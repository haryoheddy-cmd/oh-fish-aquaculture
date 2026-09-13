import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const TEAL = '#1ABC9C';
const MUTED_GREY = '#E0E0E0';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Donut chart ringan: proporsi sisa ikan (teal) vs terjual/dipanen (grey),
 * dengan teks "[X] kg" + "Sisa Stok" di tengah lingkaran.
 */
export default function BiomassaChart({ sisaKg = 0, terjualKg = 0, size = 108, strokeWidth = 14 }) {
  const total = sisaKg + terjualKg;
  const persenSisa = total > 0 ? Math.min(Math.max((sisaKg / total) * 100, 0), 100) : 100;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animatedPersen = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedPersen, {
      toValue: persenSisa,
      duration: 650,
      useNativeDriver: false,
    }).start();
  }, [persenSisa, animatedPersen]);

  const strokeDashoffset = animatedPersen.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke={MUTED_GREY} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={TEAL}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.centerWrap}>
          <Text style={styles.kgText} numberOfLines={1} adjustsFontSizeToFit>
            {sisaKg.toFixed(1)} kg
          </Text>
          <Text style={styles.label}>Sisa Stok</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  kgText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 1,
  },
});
