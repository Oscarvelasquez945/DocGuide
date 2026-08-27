import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Doctor } from '../data/mockData';
import { colors } from './Ui';

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type MapCanvasProps = {
  center: MapCoordinate;
  radiusMeters?: number;
  doctors?: Doctor[];
  selectable?: boolean;
  showRadius?: boolean;
  selectedCoordinate?: MapCoordinate;
  onCoordinateChange?: (coordinate: MapCoordinate) => void;
  onDoctorPress?: (doctor: Doctor) => void;
};

export function MapCanvas({
  center,
  radiusMeters = 5000,
  doctors = [],
  selectable,
  showRadius = !selectable,
  selectedCoordinate,
  onCoordinateChange,
  onDoctorPress,
}: MapCanvasProps) {
  const moveSelection = (index: number) => {
    onCoordinateChange?.({
      latitude: center.latitude + (index - 2) * 0.002,
      longitude: center.longitude + (2 - index) * 0.002,
    });
  };

  return (
    <View style={styles.map}>
      <View style={[styles.road, styles.roadOne]} />
      <View style={[styles.road, styles.roadTwo]} />
      <View style={[styles.road, styles.roadThree]} />
      {showRadius && (
        <View
          style={[
            styles.radius,
            {
              height: Math.min(210, 100 + radiusMeters / 100),
              width: Math.min(210, 100 + radiusMeters / 100),
            },
          ]}
        >
          <View style={styles.userPoint} />
        </View>
      )}

      {selectable &&
        [0, 1, 2, 3, 4].map((index) => (
          <Pressable
            key={index}
            onPress={() => moveSelection(index)}
            style={[styles.selectSpot, selectPositions[index]]}
          >
            {selectedCoordinate && index === 2 && (
              <View style={styles.officePin}>
                <MaterialCommunityIcons color={colors.white} name="hospital-marker" size={23} />
              </View>
            )}
          </Pressable>
        ))}

      {doctors.map((doctor, index) => (
        <Pressable
          key={doctor.id}
          onPress={() => onDoctorPress?.(doctor)}
          style={[styles.doctorPin, doctorPositions[index % doctorPositions.length]]}
        >
          <MaterialCommunityIcons color={colors.white} name="stethoscope" size={18} />
        </Pressable>
      ))}

      <View style={styles.webLabel}>
        <MaterialCommunityIcons color={colors.blue} name="map-outline" size={16} />
        <Text style={styles.webLabelText}>Vista web del mapa</Text>
      </View>
    </View>
  );
}

const selectPositions = [
  { left: '12%' as const, top: '16%' as const },
  { right: '13%' as const, top: '18%' as const },
  { left: '44%' as const, top: '43%' as const },
  { bottom: '18%' as const, left: '18%' as const },
  { bottom: '15%' as const, right: '13%' as const },
];

const doctorPositions = [
  { left: '20%' as const, top: '22%' as const },
  { right: '20%' as const, top: '27%' as const },
  { bottom: '23%' as const, left: '30%' as const },
  { bottom: '16%' as const, right: '18%' as const },
];

const styles = StyleSheet.create({
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
  radius: {
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
  selectSpot: { height: 52, position: 'absolute', width: 52 },
  officePin: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderColor: colors.white,
    borderRadius: 18,
    borderWidth: 3,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  doctorPin: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderColor: colors.white,
    borderRadius: 18,
    borderWidth: 3,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    width: 42,
  },
  webLabel: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    bottom: 12,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
    right: 12,
  },
  webLabelText: { color: colors.navy, fontSize: 10, fontWeight: '700', marginLeft: 5 },
});
