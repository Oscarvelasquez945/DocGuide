import { useRef } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackgroundBubbles } from '../components/BackgroundBubbles';
import { BrandLogo } from '../components/BrandLogo';

type Role = 'doctor' | 'patient';

type RoleCardProps = {
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  selected: boolean;
};

function RoleCard({
  description,
  icon,
  label,
  onPress,
  selected,
}: RoleCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (value: number) => {
    Animated.spring(scale, {
      friction: 6,
      toValue: value,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityHint={`Continuar como ${label}`}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        onPressIn={() => animate(0.97)}
        onPressOut={() => animate(1)}
        style={[styles.card, selected && styles.selectedCard]}
      >
        <LinearGradient
          colors={selected ? ['#2F73E6', '#174EA6'] : ['#FFFFFF', '#F4F7FF']}
          style={styles.iconCircle}
        >
          <MaterialCommunityIcons
            color={selected ? '#FFFFFF' : '#2864C7'}
            name={icon}
            size={54}
          />
        </LinearGradient>

        <View style={styles.cardCopy}>
          <Text style={[styles.cardTitle, selected && styles.selectedText]}>
            {label}
          </Text>
          <Text
            style={[
              styles.cardDescription,
              selected && styles.selectedDescription,
            ]}
          >
            {description}
          </Text>
        </View>

        <View style={[styles.arrow, selected && styles.selectedArrow]}>
          <MaterialCommunityIcons
            color={selected ? '#FFFFFF' : '#235EBB'}
            name="arrow-right"
            size={23}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function RoleSelectionScreen({
  onSelect,
}: {
  onSelect: (role: Role) => void;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.screen}
        showsVerticalScrollIndicator={false}
      >
        <BackgroundBubbles light />

        <View style={styles.header}>
          <BrandLogo compact />
          <Text style={styles.step}>PASO 1 DE 2</Text>
        </View>

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>¡TE DAMOS LA BIENVENIDA!</Text>
          <Text style={styles.title}>¿Cómo usarás{'\n'}DocGuide?</Text>
          <Text style={styles.subtitle}>
            Elige una opción para personalizar tu experiencia.
          </Text>
        </View>

        <View style={styles.cards}>
          <RoleCard
            description="Registra tu consultorio y crea tu perfil profesional."
            icon="doctor"
            label="Soy doctor"
            onPress={() => onSelect('doctor')}
            selected={false}
          />
          <RoleCard
            description="Encuentra doctores cercanos y conversa con Vitali."
            icon="account-heart-outline"
            label="Soy paciente"
            onPress={() => onSelect('patient')}
            selected={false}
          />
        </View>

        <Text style={styles.footerText}>
          Podrás cambiar de cuenta más adelante.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#EEF4FF',
    flex: 1,
  },
  screen: {
    flexGrow: 1,
    paddingBottom: 28,
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  step: {
    color: '#567198',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  copy: {
    marginTop: 52,
    zIndex: 1,
  },
  eyebrow: {
    color: '#3775D6',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title: {
    color: '#103968',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 43,
  },
  subtitle: {
    color: '#58708E',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 310,
  },
  cards: {
    gap: 14,
    marginTop: 38,
    zIndex: 1,
  },
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: 'rgba(47,102,187,0.1)',
    borderRadius: 25,
    borderWidth: 1,
    elevation: 5,
    flexDirection: 'row',
    minHeight: 132,
    padding: 15,
    shadowColor: '#214C85',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  selectedCard: {
    backgroundColor: '#DCEAFF',
    borderColor: '#3474D7',
    borderWidth: 2,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 21,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  cardCopy: {
    flex: 1,
    marginLeft: 15,
    paddingRight: 4,
  },
  cardTitle: {
    color: '#123A70',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 5,
  },
  selectedText: {
    color: '#174E9C',
  },
  cardDescription: {
    color: '#62758C',
    fontSize: 13,
    lineHeight: 18,
  },
  selectedDescription: {
    color: '#345F96',
  },
  arrow: {
    alignItems: 'center',
    backgroundColor: '#E7F0FF',
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  selectedArrow: {
    backgroundColor: '#2864C7',
  },
  footerText: {
    color: '#6A7D95',
    fontSize: 12,
    marginTop: 26,
    paddingBottom: 8,
    textAlign: 'center',
  },
});
