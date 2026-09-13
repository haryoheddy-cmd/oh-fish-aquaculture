import { View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { COLORS } from '../theme';

export default function Sparkline({ values, width = 100, height = 32, color = COLORS.primary }) {
  if (!values || values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const padY = 3;

  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = padY + (1 - (v - min) / range) * (height - padY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const lastX = (values.length - 1) * stepX;
  const lastY = padY + (1 - (values[values.length - 1] - min) / range) * (height - padY * 2);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <Circle cx={lastX} cy={lastY} r={3} fill={color} />
      </Svg>
    </View>
  );
}
