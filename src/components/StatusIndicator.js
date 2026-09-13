import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

const LEVEL_CONFIG = {
  aman: { emoji: '🟢', bg: COLORS.successBg, text: COLORS.success, defaultLabel: 'Aman' },
  waspada: { emoji: '🟡', bg: COLORS.warningBg, text: COLORS.warning, defaultLabel: 'Waspada' },
  bahaya: { emoji: '🔴', bg: COLORS.dangerBg, text: COLORS.danger, defaultLabel: 'Bahaya' },
};

export function srToLevel(survivalRatePercent) {
  if (survivalRatePercent == null) return 'waspada';
  if (survivalRatePercent >= 90) return 'aman';
  if (survivalRatePercent >= 75) return 'waspada';
  return 'bahaya';
}

export function phToLevel(phAir) {
  if (phAir == null) return 'waspada';
  if (phAir >= 6.5 && phAir <= 8.5) return 'aman';
  if (phAir >= 6 && phAir <= 9) return 'waspada';
  return 'bahaya';
}

export function stokToLevel(jumlahStok, batasMinimal) {
  if (batasMinimal == null || batasMinimal <= 0) return 'aman';
  if (jumlahStok <= batasMinimal) return 'bahaya';
  if (jumlahStok <= batasMinimal * 1.5) return 'waspada';
  return 'aman';
}

export function kondisiAlatToLevel(kondisi) {
  if (kondisi === 'baik') return 'aman';
  if (kondisi === 'perbaikan') return 'waspada';
  return 'bahaya';
}

const TEBAR_STATUS_LEVEL = { aman: 'aman', padat: 'waspada', overcrowded: 'bahaya' };
const TEBAR_STATUS_LABEL = { aman: 'Aman', padat: 'Padat', overcrowded: 'Overcrowded' };

export function tebarStatusToLevel(status) {
  return TEBAR_STATUS_LEVEL[status] || 'aman';
}

export function tebarStatusToLabel(status) {
  return TEBAR_STATUS_LABEL[status] || 'Aman';
}

const AERATOR_STATUS_LEVEL = { Normal: 'aman', Maintenance: 'waspada', Rusak: 'bahaya' };

export function aeratorStatusToLevel(status) {
  return AERATOR_STATUS_LEVEL[status] || 'waspada';
}

export default function StatusIndicator({ level = 'aman', label, size = 'medium' }) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.aman;
  return (
    <View style={[styles.pill, { backgroundColor: config.bg }, size === 'small' && styles.pillSmall]}>
      <Text style={size === 'small' ? styles.emojiSmall : styles.emoji}>{config.emoji}</Text>
      <Text style={[styles.label, { color: config.text }, size === 'small' && styles.labelSmall]}>
        {label ?? config.defaultLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  pillSmall: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  emoji: {
    fontSize: 14,
  },
  emojiSmall: {
    fontSize: 11,
  },
  label: {
    marginLeft: 6,
    fontWeight: '700',
    fontSize: 13,
  },
  labelSmall: {
    fontSize: 11,
    marginLeft: 4,
  },
});
