import { useEffect, useMemo, useState } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Doctor } from '../data/mockData';
import type { Navigate } from '../types/navigation';
import {
  Avatar,
  BottomNav,
  colors,
  Header,
  InfoPill,
  PrimaryButton,
  Screen,
} from '../components/Ui';
import { MapCanvas, type MapCoordinate } from '../components/MapCanvas';
import {
  getCurrentSession,
  signInPatientAnonymously,
  signOut,
} from '../services/auth';
import { searchNearbyDoctors } from '../services/doctors';

const radii = [1, 3, 5, 10, 20];

export function PatientMapScreen({
  navigate,
  selectDoctor,
  onSearchContext,
}: {
  navigate: Navigate;
  selectDoctor: (doctor: Doctor) => void;
  onSearchContext?: (context: MapCoordinate & { radiusMeters: number }) => void;
}) {
  const [permission, setPermission] = useState<'pending' | 'granted' | 'manual'>(
    'pending',
  );
  const [radius, setRadius] = useState(5);
  const [center, setCenter] = useState({
    latitude: 14.0818,
    longitude: -87.2068,
  });
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const visibleDoctors = useMemo(() => allDoctors, [allDoctors]);

  useEffect(() => {
    onSearchContext?.({ ...center, radiusMeters: radius * 1000 });
  }, [center, radius, onSearchContext]);

  const ensurePatientSession = async () => {
    const session = await getCurrentSession();
    if (session?.user.is_anonymous) return;
    if (session) await signOut();
    await signInPatientAnonymously();
  };

  const useCurrentLocation = async () => {
    setLoading(true);
    setError('');
    try {
      await ensurePatientSession();
      const result = await Location.requestForegroundPermissionsAsync();
      if (!result.granted) {
        setPermission('manual');
        setError('Permiso rechazado. Puedes buscar desde Tegucigalpa manualmente.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCenter({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setPermission('granted');
    } catch (reason) {
      setPermission('manual');
      setError(
        reason instanceof Error ? reason.message : 'No fue posible obtener la ubicación.',
      );
    } finally {
      setLoading(false);
    }
  };

  const useManualLocation = async () => {
    setLoading(true);
    setError('');
    try {
      await ensurePatientSession();
      setPermission('manual');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No fue posible iniciar la sesión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permission === 'pending') return;

    let cancelled = false;
    setLoading(true);
    setError('');
    searchNearbyDoctors({
      latitude: center.latitude,
      longitude: center.longitude,
      radiusMeters: radius * 1000,
    })
      .then((results) => {
        if (cancelled) return;
        setAllDoctors(
          results.map((doctor, index) => ({
            id: doctor.doctor_id,
            name: doctor.full_name || 'Doctor DocGuide',
            specialty: doctor.specialty,
            distanceKm: Math.round((doctor.distance_meters / 1000) * 10) / 10,
            phone: doctor.public_phone ?? 'Teléfono privado',
            address: doctor.office_address ?? 'Consultorio registrado',
            servicesOffered: doctor.services_offered ?? undefined,
            experience: doctor.experience_years ?? 0,
            rating: 0,
            color: ['#3375D6', '#6E62D9', '#239E9A', '#E5844D'][index % 4],
            latitude: doctor.latitude,
            longitude: doctor.longitude,
          })),
        );
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'Error al buscar doctores.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [center.latitude, center.longitude, permission, radius]);

  if (permission === 'pending') {
    return (
      <Screen scroll>
        <Header onBack={() => navigate('role-selection')} title="Tu ubicación" />
        <View style={styles.permissionContent}>
          <View style={styles.permissionIcon}>
            <MaterialCommunityIcons
              color={colors.blue}
              name="map-marker-radius-outline"
              size={68}
            />
          </View>
          <Text style={styles.permissionTitle}>Encuentra atención cerca de ti</Text>
          <Text style={styles.permissionText}>
            Usaremos tu ubicación únicamente mientras exploras el mapa. No
            guardaremos tus recorridos.
          </Text>
          <View style={styles.permissionPoints}>
            <PermissionPoint icon="shield-check-outline" text="Tu ubicación permanece privada" />
            <PermissionPoint icon="map-search-outline" text="Puedes cambiar el punto manualmente" />
            <PermissionPoint icon="crosshairs-gps" text="Solo se usa con la app abierta" />
          </View>
          <PrimaryButton
            icon="crosshairs-gps"
            label={loading ? 'Obteniendo ubicación…' : 'Usar mi ubicación'}
            disabled={loading}
            onPress={useCurrentLocation}
          />
          <View style={styles.secondaryGap}>
            <PrimaryButton
              icon="map-marker-outline"
              label="Elegir ubicación manual"
              disabled={loading}
              onPress={useManualLocation}
              secondary
            />
          </View>
          {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Header
        onBack={() => setPermission('pending')}
        right={
          <Pressable onPress={() => navigate('contact')} style={styles.headerAction}>
            <MaterialCommunityIcons color={colors.navy} name="lifebuoy" size={22} />
          </Pressable>
        }
        title="Doctores cercanos"
      />

      <View style={styles.searchBar}>
        <MaterialCommunityIcons color="#7390AF" name="magnify" size={21} />
        <Text style={styles.searchText}>Buscar por especialidad</Text>
        <MaterialCommunityIcons color={colors.blue} name="tune-variant" size={21} />
      </View>

      {permission === 'manual' && (
        <View style={styles.manualHint}>
          <MaterialCommunityIcons color={colors.blue} name="gesture-tap" size={22} />
          <Text style={styles.manualHintText}>
            Toca cualquier punto del mapa para cambiar el centro de búsqueda.
          </Text>
        </View>
      )}

      <MapCanvas
        center={center}
        doctors={visibleDoctors}
        onCoordinateChange={setCenter}
        onDoctorPress={(doctor) => {
          selectDoctor(doctor);
          navigate('doctor-public-profile');
        }}
        radiusMeters={radius * 1000}
        selectable={permission === 'manual'}
        selectedCoordinate={permission === 'manual' ? center : undefined}
        showRadius
      />

      {permission === 'manual' && (
        <Text style={styles.selectedLocationText}>
          Punto seleccionado: {center.latitude.toFixed(5)}, {center.longitude.toFixed(5)}
        </Text>
      )}

      <Text style={styles.radiusLabel}>Radio de búsqueda: {radius} km</Text>
      <View style={styles.radiusRow}>
        {radii.map((value) => (
          <Pressable
            key={value}
            onPress={() => setRadius(value)}
            style={[styles.radiusChip, radius === value && styles.radiusChipActive]}
          >
            <Text style={[styles.radiusText, radius === value && styles.radiusTextActive]}>
              {value} km
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Resultados cercanos</Text>
        <Text style={styles.resultsCount}>
          {loading ? 'Buscando…' : `${visibleDoctors.length} encontrados`}
        </Text>
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {visibleDoctors.length ? (
        visibleDoctors.map((doctor) => (
          <DoctorCard
            doctor={doctor}
            key={doctor.id}
            onPress={() => {
              selectDoctor(doctor);
              navigate('doctor-public-profile');
            }}
          />
        ))
      ) : (
        <View style={styles.empty}>
          <MaterialCommunityIcons color="#91A5BE" name="map-search-outline" size={40} />
          <Text style={styles.emptyTitle}>Sin resultados en este radio</Text>
          <Text style={styles.emptyText}>Prueba ampliando la distancia de búsqueda.</Text>
        </View>
      )}
      <View style={styles.chatCta}>
        <View style={styles.chatCtaCopy}>
          <Text style={styles.chatCtaTitle}>¿No sabes qué especialidad buscar?</Text>
          <Text style={styles.chatCtaText}>Vitali puede orientarte.</Text>
        </View>
        <Pressable onPress={() => navigate('chat')} style={styles.chatCtaButton}>
          <Image
            accessibilityLabel="Abrir Vitali"
            resizeMode="contain"
            source={require('../../assets/bot.png')}
            style={styles.chatCtaVitali}
          />
        </Pressable>
      </View>
      <View style={styles.bottomSpace} />
      <BottomNav current="patient-map" mode="patient" navigate={navigate} />
    </Screen>
  );
}

function PermissionPoint({
  icon,
  text,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.permissionPoint}>
      <MaterialCommunityIcons color={colors.success} name={icon} size={21} />
      <Text style={styles.permissionPointText}>{text}</Text>
    </View>
  );
}

function DoctorCard({ doctor, onPress }: { doctor: Doctor; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.doctorCard}>
      <Avatar color={doctor.color} initials={getInitials(doctor.name)} size={57} />
      <View style={styles.doctorCopy}>
        <Text style={styles.doctorName}>{doctor.name}</Text>
        <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
        <View style={styles.doctorMeta}>
          <MaterialCommunityIcons color="#E5A225" name="star" size={15} />
          <Text style={styles.doctorMetaText}>
            {doctor.rating ? doctor.rating : 'Verificado'}
          </Text>
          <View style={styles.metaDot} />
          <Text style={styles.doctorMetaText}>{doctor.distanceKm} km</Text>
        </View>
      </View>
      <MaterialCommunityIcons color={colors.blue} name="chevron-right" size={26} />
    </Pressable>
  );
}

export function DoctorPublicProfileScreen({
  doctor,
  navigate,
}: {
  doctor: Doctor;
  navigate: Navigate;
}) {
  return (
    <Screen scroll>
      <Header onBack={() => navigate('patient-map')} title="Perfil médico" />
      <View style={styles.publicHero}>
        <Avatar color={doctor.color} initials={getInitials(doctor.name)} size={112} />
        <Text style={styles.publicName}>{doctor.name}</Text>
        <Text style={styles.publicSpecialty}>{doctor.specialty}</Text>
        <View style={styles.publicPills}>
          <InfoPill icon="star" text={`${doctor.rating}`} />
          <InfoPill icon="map-marker-distance" text={`${doctor.distanceKm} km`} />
          <InfoPill icon="briefcase-outline" text={`${doctor.experience} años`} />
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Acerca del doctor</Text>
        <Text style={styles.infoText}>
          Profesional comprometido con una atención cercana, clara y basada en
          evidencia. Su perfil ha sido verificado para esta demostración.
        </Text>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Prácticas y servicios</Text>
        <Text style={styles.infoText}>
          {doctor.servicesOffered || 'El médico todavía no ha detallado sus servicios.'}
        </Text>
      </View>
      <View style={styles.infoCard}>
        <ProfileItem icon="map-marker-outline" label="Consultorio" value={doctor.address} />
        <ProfileItem icon="phone-outline" label="Teléfono" value={doctor.phone} />
        <ProfileItem icon="clock-outline" label="Horario" value="Lun–Vie · 8:00 a.m.–4:00 p.m." />
      </View>

      <PrimaryButton
        icon="robot-happy-outline"
        label="Consultar a Vitali"
        onPress={() => navigate('chat')}
      />
      <View style={styles.secondaryGap}>
        <PrimaryButton
          icon="map-outline"
          label="Volver al mapa"
          onPress={() => navigate('patient-map')}
          secondary
        />
      </View>
    </Screen>
  );
}

function ProfileItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.profileItem}>
      <View style={styles.profileIcon}>
        <MaterialCommunityIcons color={colors.blue} name={icon} size={22} />
      </View>
      <View style={styles.profileCopy}>
        <Text style={styles.profileLabel}>{label}</Text>
        <Text style={styles.profileValue}>{value}</Text>
      </View>
    </View>
  );
}

function getInitials(name: string) {
  return name
    .replace('Dra. ', '')
    .replace('Dr. ', '')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}

const pinPositions = [
  { left: '20%' as const, top: '22%' as const },
  { right: '20%' as const, top: '27%' as const },
  { bottom: '23%' as const, left: '30%' as const },
  { bottom: '16%' as const, right: '18%' as const },
];

const styles = StyleSheet.create({
  permissionContent: { flex: 1, justifyContent: 'center', paddingBottom: 20 },
  permissionIcon: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#DDEAFF',
    borderRadius: 48,
    height: 116,
    justifyContent: 'center',
    marginBottom: 27,
    width: 116,
  },
  permissionTitle: {
    color: colors.navy,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.7,
    lineHeight: 36,
    textAlign: 'center',
  },
  permissionText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 13,
    textAlign: 'center',
  },
  permissionPoints: { backgroundColor: colors.white, borderRadius: 22, marginVertical: 28, padding: 18 },
  permissionPoint: { alignItems: 'center', flexDirection: 'row', marginVertical: 7 },
  permissionPointText: { color: colors.navy, fontSize: 13, fontWeight: '600', marginLeft: 10 },
  secondaryGap: { marginTop: 11 },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  headerAction: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 13,
    marginTop: 20,
    minHeight: 52,
    paddingHorizontal: 15,
  },
  searchText: { color: '#8192A8', flex: 1, fontSize: 14, marginLeft: 9 },
  manualHint: {
    alignItems: 'center',
    backgroundColor: '#E1ECFF',
    borderRadius: 15,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
  },
  manualHintText: { color: colors.navy, flex: 1, fontSize: 12, lineHeight: 17, marginLeft: 9 },
  selectedLocationText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  map: {
    backgroundColor: '#DCE9DD',
    borderRadius: 26,
    height: 295,
    overflow: 'hidden',
    position: 'relative',
  },
  road: { backgroundColor: colors.white, position: 'absolute' },
  roadOne: { height: 35, left: -15, top: 92, transform: [{ rotate: '14deg' }], width: '120%' },
  roadTwo: { height: '120%', left: '47%', top: -20, transform: [{ rotate: '-12deg' }], width: 30 },
  roadThree: { bottom: 45, height: 25, left: -10, transform: [{ rotate: '-9deg' }], width: '120%' },
  radiusCircle: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(47,117,217,0.16)',
    borderColor: 'rgba(47,117,217,0.5)',
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: 'center',
    left: '50%',
    position: 'absolute',
    top: '50%',
    transform: [{ translateX: -70 }, { translateY: -70 }],
  },
  userPoint: {
    backgroundColor: colors.blue,
    borderColor: colors.white,
    borderRadius: 10,
    borderWidth: 4,
    height: 20,
    width: 20,
  },
  doctorPin: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderColor: colors.white,
    borderRadius: 18,
    borderWidth: 3,
    elevation: 4,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    width: 42,
  },
  mapBadge: {
    backgroundColor: 'rgba(18,58,112,0.9)',
    borderRadius: 12,
    left: 13,
    paddingHorizontal: 11,
    paddingVertical: 7,
    position: 'absolute',
    top: 13,
  },
  mapBadgeText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  radiusLabel: { color: colors.navy, fontSize: 14, fontWeight: '800', marginTop: 18 },
  radiusRow: { flexDirection: 'row', gap: 7, marginTop: 10 },
  radiusChip: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  radiusChipActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  radiusText: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  radiusTextActive: { color: colors.white },
  resultsHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 25,
  },
  resultsTitle: { color: colors.navy, fontSize: 19, fontWeight: '900' },
  resultsCount: { color: colors.muted, fontSize: 11 },
  doctorCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 19,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 14,
  },
  doctorCopy: { flex: 1, marginLeft: 12 },
  doctorName: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  doctorSpecialty: { color: colors.blue, fontSize: 12, fontWeight: '700', marginTop: 2 },
  doctorMeta: { alignItems: 'center', flexDirection: 'row', marginTop: 7 },
  doctorMetaText: { color: colors.muted, fontSize: 11, marginLeft: 3 },
  metaDot: { backgroundColor: '#AAB8C8', borderRadius: 2, height: 4, marginHorizontal: 7, width: 4 },
  empty: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 20, padding: 24 },
  emptyTitle: { color: colors.navy, fontSize: 15, fontWeight: '800', marginTop: 7 },
  emptyText: { color: colors.muted, fontSize: 12, marginTop: 3 },
  chatCta: {
    alignItems: 'center',
    backgroundColor: '#DCE9FF',
    borderRadius: 20,
    flexDirection: 'row',
    marginTop: 6,
    padding: 16,
  },
  chatCtaCopy: { flex: 1 },
  chatCtaTitle: { color: colors.navy, fontSize: 14, fontWeight: '800' },
  chatCtaText: { color: colors.muted, fontSize: 12, marginTop: 3 },
  chatCtaButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 17,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  chatCtaVitali: { height: 39, width: 31 },
  bottomSpace: { height: 88 },
  publicHero: { alignItems: 'center', marginBottom: 26, marginTop: 28 },
  publicName: { color: colors.navy, fontSize: 24, fontWeight: '900', marginTop: 14 },
  publicSpecialty: { color: colors.blue, fontSize: 15, fontWeight: '700', marginTop: 4 },
  publicPills: { flexDirection: 'row', gap: 7, marginTop: 13 },
  infoCard: { backgroundColor: colors.white, borderRadius: 21, marginBottom: 13, padding: 19 },
  infoTitle: { color: colors.navy, fontSize: 17, fontWeight: '900' },
  infoText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  profileItem: { alignItems: 'center', flexDirection: 'row', marginVertical: 7 },
  profileIcon: {
    alignItems: 'center',
    backgroundColor: '#E5EFFF',
    borderRadius: 13,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  profileCopy: { flex: 1, marginLeft: 12 },
  profileLabel: { color: colors.muted, fontSize: 11 },
  profileValue: { color: colors.navy, fontSize: 13, fontWeight: '700', marginTop: 2 },
});
