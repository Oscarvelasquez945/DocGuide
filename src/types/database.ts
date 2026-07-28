export type Gender = 'male' | 'female';
export type UserRole = 'doctor' | 'patient';
export type MessageSender = 'user' | 'assistant';

export type ProfileRow = {
  id: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  gender: Gender | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DoctorProfileRow = {
  user_id: string;
  identity_number: string;
  specialty: string;
  biography: string | null;
  experience_years: number | null;
  office_address: string | null;
  is_active: boolean;
  is_verified: boolean;
  phone_is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type MyDoctorProfile = DoctorProfileRow & {
  profile: ProfileRow;
};

export type NearbyDoctor = {
  doctor_id: string;
  full_name: string;
  specialty: string;
  biography: string | null;
  experience_years: number | null;
  office_address: string | null;
  latitude: number;
  longitude: number;
  distance_meters: number;
  public_phone: string | null;
};

export type ConversationRow = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: number;
  conversation_id: string;
  sender: MessageSender;
  content: string;
  created_at: string;
};
