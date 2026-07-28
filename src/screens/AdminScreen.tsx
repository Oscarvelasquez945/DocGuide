import { useEffect, useState } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, Header, PrimaryButton, Screen } from '../components/Ui';
import {
  checkIsAdmin,
  listDoctorsForReview,
  setDoctorReviewStatus,
  type DoctorReview,
} from '../services/admin';
import type { Navigate } from '../types/navigation';

export function AdminScreen({ navigate }: { navigate: Navigate }) {
  const [filter, setFilter] = useState<'pending' | 'verified' | 'all'>('pending');
  const [doctors, setDoctors] = useState<DoctorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (!(await checkIsAdmin())) throw new Error('Esta cuenta no es administradora.');
      setDoctors(await listDoctorsForReview(filter));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar el panel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [filter]);

  const review = async (doctor: DoctorReview, verified: boolean, active = true) => {
    try {
      await setDoctorReviewStatus(doctor.doctor_id, verified, active);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar.');
    }
  };

  return (
    <Screen scroll>
      <Header onBack={() => navigate('doctor-profile')} title="Aprobación médica" />
      <Text style={styles.title}>Panel de revisión</Text>
      <Text style={styles.subtitle}>Aprueba únicamente perfiles cuya identidad hayas validado.</Text>
      <View style={styles.filters}>
        {(['pending', 'verified', 'all'] as const).map((value) => (
          <Pressable
            key={value}
            onPress={() => setFilter(value)}
            style={[styles.filter, filter === value && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
              {value === 'pending' ? 'Pendientes' : value === 'verified' ? 'Verificados' : 'Todos'}
            </Text>
          </Pressable>
        ))}
      </View>
      {loading && <Text style={styles.state}>Cargando…</Text>}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!loading && !error && !doctors.length && <Text style={styles.state}>No hay perfiles aquí.</Text>}
      {doctors.map((doctor) => (
        <View key={doctor.doctor_id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.icon}>
              <MaterialCommunityIcons color={colors.blue} name="doctor" size={25} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.name}>{doctor.full_name}</Text>
              <Text style={styles.specialty}>{doctor.specialty}</Text>
            </View>
          </View>
          <Text style={styles.detail}>Identidad: {doctor.identity_number}</Text>
          <Text style={styles.detail}>Correo: {doctor.email}</Text>
          <Text style={styles.detail}>Consultorio: {doctor.office_address || 'Sin dirección'}</Text>
          <View style={styles.actions}>
            <View style={styles.action}>
              <PrimaryButton label="Aprobar" onPress={() => review(doctor, true)} />
            </View>
            <View style={styles.action}>
              <PrimaryButton
                label={doctor.is_active ? 'Rechazar' : 'Reactivar'}
                onPress={() => review(doctor, false, !doctor.is_active)}
                secondary
              />
            </View>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.navy, fontSize: 27, fontWeight: '900', marginTop: 24 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
  filters: { flexDirection: 'row', gap: 8, marginVertical: 20 },
  filter: { backgroundColor: colors.white, borderRadius: 99, flex: 1, paddingVertical: 10 },
  filterActive: { backgroundColor: colors.blue },
  filterText: { color: colors.muted, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  filterTextActive: { color: colors.white },
  state: { color: colors.muted, padding: 24, textAlign: 'center' },
  error: { color: colors.danger, marginVertical: 15, textAlign: 'center' },
  card: { backgroundColor: colors.white, borderRadius: 20, marginBottom: 12, padding: 17 },
  cardTop: { alignItems: 'center', flexDirection: 'row', marginBottom: 12 },
  icon: { alignItems: 'center', backgroundColor: '#E5EFFF', borderRadius: 14, height: 48, justifyContent: 'center', width: 48 },
  copy: { flex: 1, marginLeft: 12 },
  name: { color: colors.navy, fontSize: 16, fontWeight: '900' },
  specialty: { color: colors.blue, fontSize: 12, fontWeight: '700', marginTop: 2 },
  detail: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  action: { flex: 1 },
});
