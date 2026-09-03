import { useEffect, useState } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { Navigate } from '../types/navigation';
import {
  AppInput,
  Avatar,
  BottomNav,
  colors,
  Header,
  InfoPill,
  PrimaryButton,
  Screen,
  SectionTitle,
} from '../components/Ui';
import { MapCanvas, type MapCoordinate } from '../components/MapCanvas';
import {
  registerDoctor,
  resetPassword,
  signInDoctor,
  signOut,
  type DoctorRegistration,
} from '../services/auth';
import {
  getMyDoctorProfile,
  saveDoctorProfile,
  updateMyDoctorProfile,
} from '../services/doctors';
import type { DoctorProfileRow, ProfileRow } from '../types/database';

export type DoctorRegistrationDraft = DoctorRegistration & {
  identityNumber: string;
  specialty: string;
  servicesOffered: string;
};

export function DoctorAccessScreen({ navigate }: { navigate: Navigate }) {
  const [email, setEmail] = useState('monica@docguide.hn');
  const [password, setPassword] = useState('DocGuide2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    setLoading(true);
    setError('');
    try {
      await signInDoctor(email, password);
      navigate('doctor-home');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No fue posible iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Header onBack={() => navigate('role-selection')} title="Acceso médico" />
      <SectionTitle
        description="Ingresa a tu espacio profesional o crea una cuenta nueva."
        eyebrow="PORTAL PARA DOCTORES"
        title={'Bienvenido de\nnuevo'}
      />

      <AppInput
        autoCapitalize="none"
        icon="email-outline"
        keyboardType="email-address"
        label="Correo electrónico"
        onChangeText={setEmail}
        placeholder="doctor@correo.com"
        value={email}
      />
      <AppInput
        icon="lock-outline"
        label="Contraseña"
        onChangeText={setPassword}
        placeholder="Tu contraseña"
        secureTextEntry={!showPassword}
        value={password}
      />
      <Pressable onPress={() => setShowPassword((value) => !value)}>
        <Text style={styles.smallLink}>
          {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        </Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          if (!email.trim()) {
            setError('Ingresa tu correo para recuperar la contraseña.');
            return;
          }
          try {
            await resetPassword(email);
            Alert.alert('Correo enviado', 'Revisa tu bandeja para restablecer la contraseña.');
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'No se pudo enviar el correo.');
          }
        }}
      >
        <Text style={styles.smallLink}>Olvidé mi contraseña</Text>
      </Pressable>

      <View style={styles.buttonGap}>
        <PrimaryButton
          disabled={!email || !password || loading}
          label={loading ? 'Iniciando…' : 'Iniciar sesión'}
          onPress={login}
        />
      </View>
      {!!error && <Text style={styles.formError}>{error}</Text>}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o</Text>
        <View style={styles.dividerLine} />
      </View>
      <PrimaryButton
        icon="account-plus-outline"
        label="Crear cuenta profesional"
        onPress={() => navigate('doctor-register')}
        secondary
      />
      <Text style={styles.demoNote}>
        Demo: los campos ya están completados para que pruebes el flujo.
      </Text>
    </Screen>
  );
}

export function DoctorRegisterScreen({
  navigate,
  onContinue,
}: {
  navigate: Navigate;
  onContinue: (draft: DoctorRegistrationDraft) => void;
}) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
    identity: '',
    specialty: '',
    servicesOffered: '',
    phone: '',
  });
  const [gender, setGender] = useState<'male' | 'female' | null>(null);

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const valid =
    Object.values(form).every(Boolean) &&
    form.password === form.confirm &&
    gender !== null;

  return (
    <Screen scroll>
      <Header onBack={() => navigate('doctor-access')} title="Crear cuenta" />
      <SectionTitle
        description="Completa tus datos profesionales. Podrás editarlos después."
        eyebrow="REGISTRO MÉDICO"
        title="Únete a DocGuide"
      />

      <View style={styles.twoColumns}>
        <View style={styles.half}>
          <AppInput
            icon="account-outline"
            label="Nombre"
            onChangeText={(value) => update('firstName', value)}
            placeholder="Mónica"
            value={form.firstName}
          />
        </View>
        <View style={styles.half}>
          <AppInput
            icon="account-outline"
            label="Apellido"
            onChangeText={(value) => update('lastName', value)}
            placeholder="Castillos"
            value={form.lastName}
          />
        </View>
      </View>
      <AppInput
        autoCapitalize="none"
        icon="email-outline"
        keyboardType="email-address"
        label="Correo electrónico"
        onChangeText={(value) => update('email', value)}
        placeholder="doctor@correo.com"
        value={form.email}
      />
      <AppInput
        icon="card-account-details-outline"
        keyboardType="numeric"
        label="Número de identidad"
        onChangeText={(value) => update('identity', value)}
        placeholder="0801-1990-00000"
        value={form.identity}
      />
      <AppInput
        icon="stethoscope"
        label="Especialidad"
        onChangeText={(value) => update('specialty', value)}
        placeholder="Ej. Cardiología"
        value={form.specialty}
      />
      <AppInput
        icon="clipboard-text-outline"
        label="Prácticas y servicios"
        maxLength={1000}
        multiline
        onChangeText={(value) => update('servicesOffered', value)}
        placeholder="Ej. Consulta, electrocardiograma y control de presión"
        value={form.servicesOffered}
      />
      <AppInput
        icon="phone-outline"
        keyboardType="phone-pad"
        label="Número de teléfono"
        onChangeText={(value) => update('phone', value)}
        placeholder="+504 9999-9999"
        value={form.phone}
      />
      <AppInput
        error={
          form.confirm && form.password !== form.confirm
            ? 'Las contraseñas no coinciden'
            : undefined
        }
        icon="lock-outline"
        label="Contraseña"
        onChangeText={(value) => update('password', value)}
        placeholder="Mínimo 8 caracteres"
        secureTextEntry
        value={form.password}
      />
      <AppInput
        icon="lock-check-outline"
        label="Confirmar contraseña"
        onChangeText={(value) => update('confirm', value)}
        placeholder="Repite tu contraseña"
        secureTextEntry
        value={form.confirm}
      />

      <Text style={styles.fieldLabel}>Sexo</Text>
      <View style={styles.genderRow}>
        {[
          { value: 'female' as const, label: 'Mujer', icon: 'gender-female' as const },
          { value: 'male' as const, label: 'Hombre', icon: 'gender-male' as const },
        ].map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setGender(option.value)}
            style={[
              styles.genderOption,
              gender === option.value && styles.genderSelected,
            ]}
          >
            <MaterialCommunityIcons
              color={gender === option.value ? colors.white : colors.blue}
              name={option.icon}
              size={22}
            />
            <Text
              style={[
                styles.genderText,
                gender === option.value && styles.genderTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.buttonGap}>
        <PrimaryButton
          disabled={!valid}
          icon="map-marker-plus-outline"
          label="Seleccionar consultorio"
          onPress={() => {
            if (!gender) return;
            onContinue({
              email: form.email,
              password: form.password,
              firstName: form.firstName,
              lastName: form.lastName,
              phone: form.phone,
              gender,
              identityNumber: form.identity,
              specialty: form.specialty,
              servicesOffered: form.servicesOffered,
            });
            navigate('office-location');
          }}
        />
      </View>
      <Text style={styles.legal}>
        Al continuar confirmas que la información profesional es correcta.
      </Text>
    </Screen>
  );
}

export function OfficeLocationScreen({
  navigate,
  registration,
}: {
  navigate: Navigate;
  registration: DoctorRegistrationDraft | null;
}) {
  const [selectedCoordinate, setSelectedCoordinate] = useState<MapCoordinate>({
    latitude: 14.0818,
    longitude: -87.2068,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finishRegistration = async () => {
    if (!registration) {
      setError('Regresa al formulario y completa tus datos.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const auth = await registerDoctor(registration);
      if (!auth.session) {
        throw new Error(
          'Confirma tu correo antes de continuar o desactiva temporalmente Confirm email en Supabase.',
        );
      }
      await saveDoctorProfile({
        identityNumber: registration.identityNumber,
        specialty: registration.specialty,
        servicesOffered: registration.servicesOffered,
        latitude: selectedCoordinate.latitude,
        longitude: selectedCoordinate.longitude,
        officeAddress: `Ubicación seleccionada (${selectedCoordinate.latitude.toFixed(5)}, ${selectedCoordinate.longitude.toFixed(5)})`,
      });
      navigate('doctor-home');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No fue posible crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header onBack={() => navigate('doctor-register')} title="Tu consultorio" />
      <SectionTitle
        description="Toca el mapa para mover el marcador a la entrada de tu consultorio."
        eyebrow="UBICACIÓN PROFESIONAL"
        title="Confirma el punto"
      />
      <MapCanvas
        center={selectedCoordinate}
        onCoordinateChange={setSelectedCoordinate}
        selectable
        selectedCoordinate={selectedCoordinate}
      />
      <View style={styles.locationCard}>
        <MaterialCommunityIcons color={colors.blue} name="map-marker" size={26} />
        <View style={styles.locationCopy}>
          <Text style={styles.locationTitle}>Consultorio DocGuide</Text>
          <Text style={styles.locationAddress}>
            {selectedCoordinate.latitude.toFixed(5)}, {selectedCoordinate.longitude.toFixed(5)}
          </Text>
        </View>
        <MaterialCommunityIcons color={colors.success} name="check-circle" size={24} />
      </View>
      <View style={styles.fill} />
      <PrimaryButton
        icon="check"
        label={loading ? 'Creando cuenta…' : 'Confirmar y crear cuenta'}
        disabled={loading}
        onPress={finishRegistration}
      />
      {!!error && <Text style={styles.formError}>{error}</Text>}
    </Screen>
  );
}

export function DoctorHomeScreen({ navigate }: { navigate: Navigate }) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [doctor, setDoctor] = useState<DoctorProfileRow | null>(null);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    getMyDoctorProfile()
      .then((result) => {
        setProfile(result.profile);
        setDoctor(result.doctor);
      })
      .catch((reason) =>
        setProfileError(
          reason instanceof Error ? reason.message : 'No se pudo cargar el perfil.',
        ),
      );
  }, []);

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
  const initials = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .map((part) => part?.[0])
    .join('') || 'DR';

  return (
    <Screen scroll>
      <Header
        right={
          <Pressable onPress={() => navigate('contact')} style={styles.headerIcon}>
            <MaterialCommunityIcons color={colors.navy} name="lifebuoy" size={23} />
          </Pressable>
        }
      />
      <LinearGradient colors={['#2F75D9', '#174B9C']} style={styles.welcomeCard}>
        <View style={styles.welcomeTop}>
          <Avatar initials={initials} size={58} />
          <View style={styles.welcomeCopy}>
            <Text style={styles.welcomeLabel}>BIENVENIDO/A</Text>
            <Text style={styles.welcomeName}>{displayName || 'Profesional DocGuide'}</Text>
          </View>
        </View>
        <Text style={styles.welcomeText}>
          Tu perfil está visible para pacientes cercanos. Todo está listo para
          comenzar.
        </Text>
      </LinearGradient>
      {!!profileError && <Text style={styles.formError}>{profileError}</Text>}

      <Text style={styles.homeSectionTitle}>Tu espacio profesional</Text>
      <View style={styles.actionGrid}>
        <Pressable onPress={() => navigate('doctor-profile')} style={styles.actionCard}>
          <View style={styles.actionIcon}>
            <MaterialCommunityIcons color={colors.blue} name="account-edit-outline" size={30} />
          </View>
          <Text style={styles.actionTitle}>Mi perfil</Text>
          <Text style={styles.actionText}>Actualiza tus datos y consultorio.</Text>
        </Pressable>
        <Pressable onPress={() => navigate('chat')} style={styles.actionCard}>
          <View style={styles.actionIcon}>
            <MaterialCommunityIcons color={colors.blue} name="robot-happy-outline" size={30} />
          </View>
          <Text style={styles.actionTitle}>Vitali</Text>
          <Text style={styles.actionText}>Consulta al asistente cuando quieras.</Text>
        </Pressable>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusTop}>
          <View>
            <Text style={styles.statusLabel}>ESTADO DEL PERFIL</Text>
            <Text style={styles.statusTitle}>Visible en el mapa</Text>
          </View>
          <View style={styles.activeDot} />
        </View>
        <View style={styles.statusDetails}>
          <InfoPill
            icon="map-marker-radius-outline"
            text={doctor?.office_address || 'Consultorio registrado'}
          />
          <InfoPill icon="stethoscope" text={doctor?.specialty || 'Especialidad'} />
        </View>
      </View>
      <View style={styles.bottomSpace} />
      <BottomNav current="doctor-home" mode="doctor" navigate={navigate} />
    </Screen>
  );
}

export function DoctorProfileScreen({ navigate }: { navigate: Navigate }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [doctor, setDoctor] = useState<DoctorProfileRow | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    specialty: '',
    servicesOffered: '',
    officeAddress: '',
    biography: '',
    experienceYears: '0',
  });

  useEffect(() => {
    getMyDoctorProfile()
      .then((result) => {
        setProfile(result.profile);
        setDoctor(result.doctor);
        setForm({
          firstName: result.profile.first_name ?? '',
          lastName: result.profile.last_name ?? '',
          phone: result.profile.phone ?? '',
          specialty: result.doctor.specialty,
          servicesOffered: result.doctor.services_offered ?? '',
          officeAddress: result.doctor.office_address ?? '',
          biography: result.doctor.biography ?? '',
          experienceYears: String(result.doctor.experience_years ?? 0),
        });
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : 'No se pudo cargar el perfil.'),
      )
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await updateMyDoctorProfile({
        ...form,
        experienceYears: Number(form.experienceYears) || 0,
      });
      setProfile((current) =>
        current
          ? {
              ...current,
              first_name: form.firstName,
              last_name: form.lastName,
              phone: form.phone,
            }
          : current,
      );
      setDoctor((current) =>
        current
          ? {
              ...current,
              specialty: form.specialty,
              services_offered: form.servicesOffered || null,
              office_address: form.officeAddress || null,
              biography: form.biography,
              experience_years: Number(form.experienceYears) || 0,
            }
          : current,
      );
      setEditing(false);
      Alert.alert('Perfil actualizado', 'Los cambios se guardaron en Supabase.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No fue posible guardar.');
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    'Perfil médico';
  const profileInitials = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .map((part) => part?.[0])
    .join('') || 'DR';

  return (
    <Screen scroll>
      <Header
        onBack={() => navigate('doctor-home')}
        right={
          <Pressable onPress={() => setEditing((value) => !value)} style={styles.headerIcon}>
            <MaterialCommunityIcons
              color={colors.blue}
              name={editing ? 'close' : 'pencil-outline'}
              size={22}
            />
          </Pressable>
        }
        title="Mi perfil"
      />
      <View style={styles.profileHero}>
        <Avatar initials={profileInitials} size={108} />
        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.profileSpecialty}>
          {loading ? 'Cargando…' : doctor?.specialty ?? 'Sin especialidad'}
        </Text>
        <View style={styles.profilePills}>
          <InfoPill icon="star" text="4.9" />
          <InfoPill
            icon="briefcase-outline"
            text={`${doctor?.experience_years ?? 0} años`}
          />
        </View>
      </View>

      {editing ? (
        <View style={styles.editCard}>
          <AppInput
            icon="account-outline"
            label="Nombre"
            onChangeText={(value) => setForm((current) => ({ ...current, firstName: value }))}
            value={form.firstName}
          />
          <AppInput
            icon="account-outline"
            label="Apellido"
            onChangeText={(value) => setForm((current) => ({ ...current, lastName: value }))}
            value={form.lastName}
          />
          <AppInput
            icon="stethoscope"
            label="Especialidad"
            onChangeText={(value) => setForm((current) => ({ ...current, specialty: value }))}
            value={form.specialty}
          />
          <AppInput
            icon="phone-outline"
            label="Teléfono"
            onChangeText={(value) => setForm((current) => ({ ...current, phone: value }))}
            value={form.phone}
          />
          <AppInput
            icon="map-marker-outline"
            label="Consultorio"
            multiline
            onChangeText={(value) => setForm((current) => ({ ...current, officeAddress: value }))}
            value={form.officeAddress}
          />
          <AppInput
            icon="clipboard-text-outline"
            label="Prácticas y servicios"
            maxLength={1000}
            multiline
            onChangeText={(value) => setForm((current) => ({ ...current, servicesOffered: value }))}
            value={form.servicesOffered}
          />
          <AppInput
            icon="text-box-outline"
            label="Acerca de mí"
            multiline
            onChangeText={(value) => setForm((current) => ({ ...current, biography: value }))}
            value={form.biography}
          />
          <PrimaryButton
            icon="content-save-outline"
            label={saving ? 'Guardando…' : 'Guardar cambios'}
            disabled={saving}
            onPress={save}
          />
        </View>
      ) : (
        <>
          <View style={styles.profileInfoCard}>
            <ProfileRow
              icon="phone-outline"
              label="Teléfono"
              value={profile?.phone ?? 'No registrado'}
            />
            <ProfileRow
              icon="map-marker-outline"
              label="Consultorio"
              value={doctor?.office_address ?? 'No registrado'}
            />
            <ProfileRow
              icon="card-account-details-outline"
              label="Identidad"
              value="Información privada"
            />
            <ProfileRow
              icon="clipboard-text-outline"
              label="Prácticas y servicios"
              value={doctor?.services_offered ?? 'No registrado'}
            />
          </View>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>Acerca de mí</Text>
            <Text style={styles.aboutText}>
              {doctor?.biography || 'Añade una descripción profesional a tu perfil.'}
            </Text>
          </View>
        </>
      )}
      {!!error && <Text style={styles.formError}>{error}</Text>}
      <PrimaryButton
        icon="shield-account-outline"
        label="Panel de aprobación"
        onPress={() => navigate('admin-review')}
        secondary
      />
      <View style={styles.logout}>
        <PrimaryButton
          icon="logout"
          label="Cerrar sesión"
          secondary
          onPress={async () => {
            await signOut();
            navigate('role-selection');
          }}
        />
      </View>
      <View style={styles.bottomSpace} />
      <BottomNav current="doctor-profile" mode="doctor" navigate={navigate} />
    </Screen>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.profileRow}>
      <View style={styles.profileRowIcon}>
        <MaterialCommunityIcons color={colors.blue} name={icon} size={22} />
      </View>
      <View style={styles.profileRowCopy}>
        <Text style={styles.profileRowLabel}>{label}</Text>
        <Text style={styles.profileRowValue}>{value}</Text>
      </View>
    </View>
  );
}

const mapPositions = [
  { left: '12%' as const, top: '16%' as const },
  { right: '13%' as const, top: '18%' as const },
  { left: '44%' as const, top: '43%' as const },
  { bottom: '18%' as const, left: '18%' as const },
  { bottom: '15%' as const, right: '13%' as const },
  { left: '62%' as const, top: '25%' as const },
];

const styles = StyleSheet.create({
  smallLink: { color: colors.blue, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  buttonGap: { marginTop: 25 },
  divider: { alignItems: 'center', flexDirection: 'row', marginVertical: 22 },
  dividerLine: { backgroundColor: colors.border, flex: 1, height: 1 },
  dividerText: { color: colors.muted, marginHorizontal: 14 },
  demoNote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 18,
    textAlign: 'center',
  },
  twoColumns: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  fieldLabel: { color: colors.navy, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderOption: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
  },
  genderSelected: { backgroundColor: colors.blue, borderColor: colors.blue },
  genderText: { color: colors.navy, fontWeight: '700', marginLeft: 7 },
  genderTextSelected: { color: colors.white },
  legal: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 12,
    marginTop: 14,
    textAlign: 'center',
  },
  map: {
    backgroundColor: '#DDE9DD',
    borderRadius: 28,
    height: 315,
    overflow: 'hidden',
    position: 'relative',
  },
  road: { backgroundColor: '#FFFFFF', position: 'absolute' },
  roadOne: { height: 36, left: -20, top: 110, transform: [{ rotate: '18deg' }], width: '120%' },
  roadTwo: { height: '120%', left: '43%', top: -20, transform: [{ rotate: '-9deg' }], width: 33 },
  roadThree: { bottom: 35, height: 25, left: -15, transform: [{ rotate: '-15deg' }], width: '120%' },
  mapSpot: { height: 52, position: 'absolute', width: 52 },
  pin: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderColor: colors.white,
    borderRadius: 18,
    borderWidth: 3,
    elevation: 5,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  currentLocation: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    bottom: 16,
    elevation: 3,
    height: 45,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    width: 45,
  },
  locationCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    elevation: 3,
    flexDirection: 'row',
    marginTop: 14,
    padding: 16,
  },
  locationCopy: { flex: 1, marginLeft: 12 },
  locationTitle: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  locationAddress: { color: colors.muted, fontSize: 12, marginTop: 3 },
  fill: { flex: 1 },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  welcomeCard: { borderRadius: 26, marginTop: 30, padding: 22 },
  welcomeTop: { alignItems: 'center', flexDirection: 'row' },
  welcomeCopy: { marginLeft: 14 },
  welcomeLabel: { color: '#BFD7FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  welcomeName: { color: colors.white, fontSize: 25, fontWeight: '900', marginTop: 3 },
  welcomeText: { color: '#E7F0FF', fontSize: 14, lineHeight: 21, marginTop: 18 },
  homeSectionTitle: { color: colors.navy, fontSize: 19, fontWeight: '900', marginBottom: 14, marginTop: 28 },
  actionGrid: { flexDirection: 'row', gap: 12 },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 21,
    flex: 1,
    minHeight: 170,
    padding: 17,
  },
  actionIcon: {
    alignItems: 'center',
    backgroundColor: '#E5EFFF',
    borderRadius: 15,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  actionTitle: { color: colors.navy, fontSize: 16, fontWeight: '800', marginTop: 15 },
  actionText: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  statusCard: { backgroundColor: colors.white, borderRadius: 21, marginTop: 14, padding: 18 },
  statusTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  statusLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  statusTitle: { color: colors.navy, fontSize: 17, fontWeight: '800', marginTop: 4 },
  activeDot: { backgroundColor: colors.success, borderRadius: 7, height: 14, width: 14 },
  statusDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 15 },
  profileHero: { alignItems: 'center', marginTop: 28 },
  profileName: { color: colors.navy, fontSize: 24, fontWeight: '900', marginTop: 14 },
  profileSpecialty: { color: colors.blue, fontSize: 15, fontWeight: '700', marginTop: 4 },
  profilePills: { flexDirection: 'row', gap: 8, marginTop: 13 },
  profileInfoCard: { backgroundColor: colors.white, borderRadius: 22, marginTop: 26, padding: 18 },
  profileRow: { alignItems: 'center', flexDirection: 'row', marginVertical: 9 },
  profileRowIcon: {
    alignItems: 'center',
    backgroundColor: '#E6EFFF',
    borderRadius: 13,
    height: 44,
    justifyContent: 'center',
    marginRight: 12,
    width: 44,
  },
  profileRowLabel: { color: colors.muted, fontSize: 11 },
  profileRowCopy: { flex: 1, minWidth: 0 },
  profileRowValue: {
    color: colors.navy,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 2,
  },
  aboutCard: { backgroundColor: colors.white, borderRadius: 22, marginTop: 13, padding: 20 },
  aboutTitle: { color: colors.navy, fontSize: 17, fontWeight: '900' },
  aboutText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 9 },
  editCard: { marginTop: 25 },
  bottomSpace: { height: 90 },
  formError: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    textAlign: 'center',
  },
  logout: { marginTop: 14 },
});
