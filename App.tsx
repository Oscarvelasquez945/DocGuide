import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { doctors, type Doctor } from './src/data/mockData';
import type { AppRoute, UserMode } from './src/types/navigation';
import {
  DoctorAccessScreen,
  DoctorHomeScreen,
  DoctorProfileScreen,
  DoctorRegisterScreen,
  OfficeLocationScreen,
  type DoctorRegistrationDraft,
} from './src/screens/DoctorScreens';
import {
  DoctorPublicProfileScreen,
  PatientMapScreen,
} from './src/screens/PatientScreens';
import { RoleSelectionScreen } from './src/screens/RoleSelectionScreen';
import { ChatScreen, ContactScreen } from './src/screens/SharedScreens';
import { SplashScreen } from './src/screens/SplashScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import type { SearchContext } from './src/services/vitali';

export default function App() {
  const [route, setRoute] = useState<AppRoute>('splash');
  const [mode, setMode] = useState<UserMode>('patient');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor>(doctors[0]);
  const [doctorRegistration, setDoctorRegistration] =
    useState<DoctorRegistrationDraft | null>(null);
  const [searchContext, setSearchContext] = useState<SearchContext>({
    latitude: 14.0818,
    longitude: -87.2068,
    radiusMeters: 5000,
  });

  useEffect(() => {
    if (route !== 'splash') return;

    const timer = setTimeout(() => setRoute('role-selection'), 2400);
    return () => clearTimeout(timer);
  }, [route]);

  const screen = (() => {
    switch (route) {
      case 'splash':
        return <SplashScreen />;
      case 'role-selection':
        return (
          <RoleSelectionScreen
            onSelect={(selectedMode) => {
              setMode(selectedMode);
              setRoute(
                selectedMode === 'doctor' ? 'doctor-access' : 'patient-map',
              );
            }}
          />
        );
      case 'doctor-access':
        return <DoctorAccessScreen navigate={setRoute} />;
      case 'doctor-register':
        return (
          <DoctorRegisterScreen
            navigate={setRoute}
            onContinue={setDoctorRegistration}
          />
        );
      case 'office-location':
        return (
          <OfficeLocationScreen
            navigate={setRoute}
            registration={doctorRegistration}
          />
        );
      case 'doctor-home':
        return <DoctorHomeScreen navigate={setRoute} />;
      case 'doctor-profile':
        return <DoctorProfileScreen navigate={setRoute} />;
      case 'admin-review':
        return <AdminScreen navigate={setRoute} />;
      case 'patient-map':
        return (
          <PatientMapScreen
            navigate={setRoute}
            onSearchContext={setSearchContext}
            selectDoctor={setSelectedDoctor}
          />
        );
      case 'doctor-public-profile':
        return (
          <DoctorPublicProfileScreen
            doctor={selectedDoctor}
            navigate={setRoute}
          />
        );
      case 'chat':
        return <ChatScreen mode={mode} navigate={setRoute} searchContext={searchContext} />;
      case 'contact':
        return <ContactScreen mode={mode} navigate={setRoute} />;
      default:
        return null;
    }
  })();

  return (
    <SafeAreaProvider>
      <StatusBar animated style={route === 'splash' ? 'light' : 'dark'} />
      {screen}
    </SafeAreaProvider>
  );
}
