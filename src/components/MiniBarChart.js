import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { COLORS, SPACING } from '../theme';

const VIRTUAL_WIDTH = 280;

export default function MiniBarChart({ data, height = 90, color = COLORS.primary }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const gap = 6;
  const barWidth = (VIRTUAL_WIDTH - gap * (data.length - 1)) / data.length;
  const chartHeight = height - 18;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${VIRTUAL_WIDTH} ${height}`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const barHeight = max > 0 ? Math.max((d.value / max) * chartHeight, d.value > 0 ? 2 : 0) : 0;
          const x = i * (barWidth + gap);
          const y = chartHeight - barHeight;
          return <Rect key={i} x={x} y={y} width={barWidth} height={barHeight} rx={3} fill={color} />;
        })}
      </Svg>
      <View style={styles.labelRow}>
        {data.map((d, i) => (
          <Text key={i} style={styles.label} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  label: {
    flex: 1,
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'center',
  },
});
