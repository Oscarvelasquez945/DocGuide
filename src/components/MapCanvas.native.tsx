import { useEffect, useRef } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

import { colors } from './Ui';
import type { MapCanvasProps } from './MapCanvas';

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
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    mapRef.current?.animateToRegion(
      {
        ...center,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      },
      500,
    );
  }, [center.latitude, center.longitude]);

  return (
    <View style={styles.container}>
      <MapView
        initialRegion={{
          ...center,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        mapType="standard"
        onPress={(event) => {
          if (selectable) onCoordinateChange?.(event.nativeEvent.coordinate);
        }}
        onLongPress={(event) => {
          if (selectable) onCoordinateChange?.(event.nativeEvent.coordinate);
        }}
        provider={PROVIDER_GOOGLE}
        ref={mapRef}
        showsCompass
        showsMyLocationButton
        showsUserLocation
        style={StyleSheet.absoluteFill}
        toolbarEnabled
        zoomControlEnabled
      >
        {showRadius && (
          <Circle
            center={center}
            fillColor="rgba(47,117,217,0.14)"
            radius={radiusMeters}
            strokeColor="rgba(47,117,217,0.65)"
            strokeWidth={2}
          />
        )}
        {selectable && selectedCoordinate && (
          <Marker
            coordinate={selectedCoordinate}
            draggable
            onDragEnd={(event) => onCoordinateChange?.(event.nativeEvent.coordinate)}
            title="Consultorio"
          >
            <View style={styles.officePin}>
              <MaterialCommunityIcons color={colors.white} name="hospital-marker" size={23} />
            </View>
          </Marker>
        )}
        {doctors.map((doctor) => (
          <Marker
            coordinate={{
              latitude:
                doctor.latitude ??
                center.latitude + Math.sin(doctor.distanceKm) * 0.01,
              longitude:
                doctor.longitude ??
                center.longitude + Math.cos(doctor.distanceKm) * 0.01,
            }}
            key={doctor.id}
            onPress={() => onDoctorPress?.(doctor)}
            description={`${doctor.specialty} · ${doctor.distanceKm.toFixed(1)} km`}
            title={doctor.name}
          >
            <View style={styles.doctorPin}>
              <MaterialCommunityIcons color={colors.white} name="stethoscope" size={18} />
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 26, height: 295, overflow: 'hidden' },
  officePin: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderColor: colors.white,
    borderRadius: 19,
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
    width: 42,
  },
});
