import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ReactNode } from 'react';
import {
  Image,
  KeyboardTypeOptions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppRoute, Navigate, UserMode } from '../types/navigation';
import { BrandLogo } from './BrandLogo';

export const colors = {
  navy: '#123A70',
  blue: '#2E73D8',
  darkBlue: '#174EA6',
  pale: '#EEF4FF',
  muted: '#61758E',
  border: '#D7E3F5',
  white: '#FFFFFF',
  success: '#1E9B79',
  danger: '#C54F5B',
};

export function Screen({
  children,
  scroll = false,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const content = <View style={styles.screenContent}>{children}</View>;

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safe}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function Header({
  onBack,
  title,
  right,
}: {
  onBack?: () => void;
  title?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable accessibilityLabel="Volver" onPress={onBack} style={styles.back}>
          <MaterialCommunityIcons color={colors.navy} name="arrow-left" size={25} />
        </Pressable>
      ) : (
        <BrandLogo compact />
      )}
      {title ? (
        <Text numberOfLines={1} style={styles.headerTitle}>
          {title}
        </Text>
      ) : (
        <View />
      )}
      {right ?? <View style={styles.headerSpacer} />}
    </View>
  );
}

export function AppInput({
  icon,
  label,
  error,
  keyboardType,
  ...props
}: TextInputProps & {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, !!error && styles.inputError]}>
        <MaterialCommunityIcons color="#7690AF" name={icon} size={20} />
        <TextInput
          keyboardType={keyboardType}
          placeholderTextColor="#90A1B7"
          style={styles.input}
          {...props}
        />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon = 'arrow-right',
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>
        {label}
      </Text>
      <MaterialCommunityIcons
        color={secondary ? colors.blue : colors.white}
        name={icon}
        size={21}
      />
    </Pressable>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <View style={styles.sectionTitle}>
      {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const navItems: Array<{
  route: AppRoute;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}> = [
  { route: 'patient-map', label: 'Explorar', icon: 'map-search-outline' },
  { route: 'chat', label: 'Vitali', icon: 'robot-happy-outline' },
  { route: 'contact', label: 'Contacto', icon: 'lifebuoy' },
];

export function BottomNav({
  current,
  navigate,
  mode,
}: {
  current: AppRoute;
  navigate: Navigate;
  mode: UserMode;
}) {
  const items =
    mode === 'doctor'
      ? [
          { route: 'doctor-home' as AppRoute, label: 'Inicio', icon: 'home-outline' as const },
          { route: 'chat' as AppRoute, label: 'Vitali', icon: 'robot-happy-outline' as const },
          { route: 'doctor-profile' as AppRoute, label: 'Perfil', icon: 'account-outline' as const },
        ]
      : navItems;

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const active = current === item.route;
        const isVitali = item.route === 'chat';
        return (
          <Pressable
            key={item.route}
            onPress={() => navigate(item.route)}
            style={styles.navItem}
          >
            <View
              style={[
                styles.navIcon,
                active && (isVitali ? styles.vitaliIconActive : styles.navIconActive),
              ]}
            >
              {isVitali ? (
                <Image
                  accessibilityLabel="Vitali"
                  resizeMode="contain"
                  source={require('../../assets/bot.png')}
                  style={[styles.vitaliNavImage, !active && styles.vitaliNavImageInactive]}
                />
              ) : (
                <MaterialCommunityIcons
                  color={active ? colors.white : '#6D819A'}
                  name={item.icon}
                  size={23}
                />
              )}
            </View>
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function InfoPill({
  icon,
  text,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.infoPill}>
      <MaterialCommunityIcons color={colors.blue} name={icon} size={17} />
      <Text style={styles.infoPillText}>{text}</Text>
    </View>
  );
}

export function Avatar({
  initials,
  color = colors.blue,
  size = 64,
}: {
  initials: string;
  color?: string;
  size?: number;
}) {
  return (
    <LinearGradient
      colors={[color, colors.darkBlue]}
      style={[
        styles.avatar,
        { borderRadius: size / 2, height: size, width: size },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.3 }]}>{initials}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.pale, flex: 1 },
  scroll: { flexGrow: 1 },
  screenContent: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: 520,
    paddingBottom: 26,
    paddingHorizontal: 22,
    paddingTop: 18,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  back: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    elevation: 2,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerTitle: {
    color: colors.navy,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    marginHorizontal: 10,
    minWidth: 0,
    textAlign: 'center',
  },
  headerSpacer: { width: 44 },
  field: { marginBottom: 15 },
  label: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 55,
    paddingHorizontal: 15,
  },
  inputError: { borderColor: colors.danger },
  input: {
    color: colors.navy,
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
    paddingVertical: 12,
  },
  error: { color: colors.danger, fontSize: 11, marginTop: 4 },
  button: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderRadius: 16,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
  },
  secondaryButton: {
    backgroundColor: '#E1ECFF',
    elevation: 0,
  },
  disabledButton: { opacity: 0.45 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    marginRight: 9,
  },
  secondaryButtonText: { color: colors.blue },
  sectionTitle: { marginBottom: 28, marginTop: 32 },
  eyebrow: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: colors.navy,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 37,
  },
  description: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  bottomNav: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 23,
    bottom: 14,
    elevation: 7,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: 20,
    paddingVertical: 9,
    position: 'absolute',
    right: 20,
    shadowColor: '#163A68',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
  },
  navItem: { alignItems: 'center', minWidth: 68 },
  navIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 44,
  },
  navIconActive: { backgroundColor: colors.blue },
  vitaliIconActive: { backgroundColor: '#DDEAFF' },
  vitaliNavImage: { height: 31, width: 24 },
  vitaliNavImageInactive: { opacity: 0.58 },
  navLabel: { color: '#6D819A', fontSize: 10, fontWeight: '700', marginTop: 3 },
  navLabelActive: { color: colors.blue },
  infoPill: {
    alignItems: 'center',
    backgroundColor: '#E4EEFF',
    borderRadius: 999,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  infoPillText: { color: colors.navy, fontSize: 12, fontWeight: '700', marginLeft: 5 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '900' },
});
