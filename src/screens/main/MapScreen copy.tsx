import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Vibration } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';


const FAKE_PATH = [
  { latitude: 28.6265, longitude: 77.3815 },
  { latitude: 28.6262, longitude: 77.3822 },
  { latitude: 28.6259, longitude: 77.3830 },
  { latitude: 28.6255, longitude: 77.3840 },
  { latitude: 28.6250, longitude: 77.3855 },
  { latitude: 28.6245, longitude: 77.3870 },
  { latitude: 28.6240, longitude: 77.3890 },
  { latitude: 28.6235, longitude: 77.3920 },
  { latitude: 28.6230, longitude: 77.3950 },
  { latitude: 28.6228, longitude: 77.3980 }, // 🚨 accident
  { latitude: 28.6225, longitude: 77.4020 },
  { latitude: 28.6222, longitude: 77.4060 },
  { latitude: 28.6220, longitude: 77.4100 },
  { latitude: 28.6215, longitude: 77.4150 },
  { latitude: 28.6208, longitude: 77.4185 },
  { latitude: 28.6202, longitude: 77.4210 },
];

export default function LiveTrackingScreen() {
  const [index, setIndex] = useState(0);
  const [accidentTriggered, setAccidentTriggered] = useState(false);
  const [blink, setBlink] = useState(true);

  const mapRef = useRef<MapView | null>(null);

  // 🚗 Move car
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => {
        const next = (prev + 1) % FAKE_PATH.length;

        const point = FAKE_PATH[next];

        // 🎥 Auto follow camera
        mapRef.current?.animateToRegion({
          latitude: point.latitude,
          longitude: point.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 700);

        // 🚨 Trigger accident at midpoint
        if (next === 4 && !accidentTriggered) {
          setAccidentTriggered(true);
          Vibration.vibrate(800);
          console.log('🚨 ACCIDENT DETECTED');
        }

        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [accidentTriggered]);

  // 🔴 Blink accident icon
  useEffect(() => {
    if (!accidentTriggered) return;

    const blinkInterval = setInterval(() => {
      setBlink(prev => !prev);
    }, 500);

    return () => clearInterval(blinkInterval);
  }, [accidentTriggered]);

  const currentLocation = FAKE_PATH[index];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: FAKE_PATH[0].latitude,
          longitude: FAKE_PATH[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >

        {/* 🛣️ Route */}
        <Polyline
          coordinates={FAKE_PATH}
          strokeWidth={4}
        />

        {/* 🚗 Moving Car */}
        <Marker coordinate={currentLocation}>
          <Text style={{ fontSize: 30 }}>🚗</Text>
        </Marker>

        {/* 🏫 Destination */}
        <Marker coordinate={FAKE_PATH[FAKE_PATH.length - 1]}>
          <Text style={{ fontSize: 26 }}>🏫</Text>
        </Marker>

        {/* 🚨 Accident */}
        {accidentTriggered && blink && (
          <Marker coordinate={FAKE_PATH[4]}>
            <Text style={{ fontSize: 32 }}>🚨</Text>
          </Marker>
        )}

      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});