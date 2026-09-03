import type {
  DoctorProfileRow,
  NearbyDoctor,
  ProfileRow,
} from '../types/database';
import { supabase } from '../lib/supabase';

export type DoctorProfileInput = {
  identityNumber: string;
  specialty: string;
  latitude: number;
  longitude: number;
  officeAddress?: string;
  servicesOffered?: string;
  biography?: string;
  experienceYears?: number;
  phoneIsPublic?: boolean;
};

export async function saveDoctorProfile(input: DoctorProfileInput) {
  const { error } = await supabase.rpc('upsert_doctor_profile', {
    p_identity_number: input.identityNumber,
    p_specialty: input.specialty,
    p_office_latitude: input.latitude,
    p_office_longitude: input.longitude,
    p_office_address: input.officeAddress ?? null,
    p_biography: input.biography ?? null,
    p_experience_years: input.experienceYears ?? null,
    p_phone_is_public: input.phoneIsPublic ?? false,
    p_services_offered: input.servicesOffered?.trim() || null,
  });

  if (error) throw error;
}

export async function searchNearbyDoctors(input: {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  specialty?: string;
}) {
  const { data, error } = await supabase.rpc('nearby_doctors', {
    p_latitude: input.latitude,
    p_longitude: input.longitude,
    p_radius_meters: input.radiusMeters,
    p_specialty: input.specialty?.trim() || null,
  });

  if (error) throw error;
  return (data ?? []) as NearbyDoctor[];
}

export async function getMyDoctorProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('An authenticated doctor session is required');

  const [profileResult, doctorResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('doctor_profiles').select('*').eq('user_id', user.id).single(),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (doctorResult.error) throw doctorResult.error;

  return {
    profile: profileResult.data as ProfileRow,
    doctor: doctorResult.data as DoctorProfileRow,
  };
}

export async function updateMyDoctorProfile(input: {
  firstName: string;
  lastName: string;
  phone: string;
  specialty: string;
  servicesOffered?: string;
  officeAddress?: string;
  biography?: string;
  experienceYears?: number;
  phoneIsPublic?: boolean;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('An authenticated doctor session is required');

  const profileResult = await supabase
    .from('profiles')
    .update({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      phone: input.phone.trim(),
    })
    .eq('id', user.id);

  if (profileResult.error) throw profileResult.error;

  const doctorUpdates: Record<string, string | number | boolean | null> = {
    specialty: input.specialty.trim(),
    services_offered: input.servicesOffered?.trim() || null,
    office_address: input.officeAddress?.trim() || null,
    biography: input.biography?.trim() || null,
    experience_years: input.experienceYears ?? null,
  };
  if (input.phoneIsPublic !== undefined) {
    doctorUpdates.phone_is_public = input.phoneIsPublic;
  }

  const doctorResult = await supabase
    .from('doctor_profiles')
    .update(doctorUpdates)
    .eq('user_id', user.id);

  if (doctorResult.error) throw doctorResult.error;
}
