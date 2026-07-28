export type AppRoute =
  | 'splash'
  | 'role-selection'
  | 'doctor-access'
  | 'doctor-register'
  | 'office-location'
  | 'doctor-home'
  | 'doctor-profile'
  | 'admin-review'
  | 'patient-map'
  | 'doctor-public-profile'
  | 'chat'
  | 'contact';

export type UserMode = 'doctor' | 'patient';

export type Navigate = (route: AppRoute) => void;
