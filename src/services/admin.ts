import { supabase } from '../lib/supabase';

export type DoctorReview = {
  doctor_id: string;
  full_name: string;
  email: string;
  identity_number: string;
  specialty: string;
  office_address: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
};

export async function checkIsAdmin() {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) throw error;
  return Boolean(data);
}

export async function listDoctorsForReview(
  filter: 'pending' | 'verified' | 'inactive' | 'all' = 'pending',
) {
  const { data, error } = await supabase.rpc('list_doctors_for_review', {
    p_filter: filter,
  });
  if (error) throw error;
  return (data ?? []) as DoctorReview[];
}

export async function setDoctorReviewStatus(
  doctorId: string,
  verified: boolean,
  active = true,
) {
  const { error } = await supabase.rpc('set_doctor_review_status', {
    p_doctor_id: doctorId,
    p_verified: verified,
    p_active: active,
  });
  if (error) throw error;
}
