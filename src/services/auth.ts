import type { Gender } from '../types/database';
import { supabase } from '../lib/supabase';

export type DoctorRegistration = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: Gender;
};

export async function registerDoctor(input: DoctorRegistration) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        role: 'doctor',
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        phone: input.phone.trim(),
        gender: input.gender,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signInDoctor(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function signInPatientAnonymously() {
  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      data: { role: 'patient' },
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
  );
  if (error) throw error;
}

export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  return session;
}

export async function getCurrentProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
