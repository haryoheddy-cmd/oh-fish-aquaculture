import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { FormInput, FormChoice } from './FormModal';
import { COLORS, SPACING } from '../theme';
import { formatRupiah, toNumber } from '../utils/format';
import { hitungPakanAlternatif } from '../utils/leleCalculators';

export const PAKAN_ALTERNATIF_PRESETS = [
  { id: 'maggot', nama: 'Maggot BSF', hargaPerKg: 5000 },
  { id: 'azolla', nama: 'Azolla', hargaPerKg: 1500 },
  { id: 'ikan_rucah', nama: 'Ikan Rucah', hargaPerKg: 4000 },
  { id: 'cacing_sutra', nama: 'Cacing Sutra', hargaPerKg: 8000 },
];

export default function PakanAlternatifCalc({ visible, onClose, initialTotalPakanKg = null }) {
  const insets = useSafeAreaInsets();
  const [totalPakanKgHarian, setTotalPakanKgHarian] = useState(
    initialTotalPakanKg != null ? String(initialTotalPakanKg.toFixed(2)) : ''
  );
  const [hargaPeletPerKg, setHargaPeletPerKg] = useState('12000');
  const [jenisAlternatif, setJenisAlternatif] = useState('maggot');
  const [hargaAlternatifPerKg, setHargaAlternatifPerKg] = useState(String(PAKAN_ALTERNATIF_PRESETS[0].hargaPerKg));
  const [persenAlternatif, setPersenAlternatif] = useState('30');
  const [hasil, setHasil] = useState(null);

  const handleJenisChange = (id) => {
    const preset = PAKAN_ALTERNATIF_PRESETS.find((p) => p.id === id);
    setJenisAlternatif(id);
    if (preset) setHargaAlternatifPerKg(String(preset.hargaPerKg));
  };

  const handleHitung = () => {
    setHasil(
      hitungPakanAlternatif({
        totalPakanKgHarian: toNumber(totalPakanKgHarian),
        persenAlternatif: toNumber(persenAlternatif),
        hargaPeletPerKg: toNumber(hargaPeletPerKg),
        hargaAlternatifPerKg: toNumber(hargaAlternatifPerKg),
      })
    );
  };

  const namaAlternatif = PAKAN_ALTERNATIF_PRESETS.find((p) => p.id === jenisAlternatif)?.nama ?? 'Alternatif';
  const persenPelet = 100 - Math.min(Math.max(toNumber(persenAlternatif), 0), 100);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.sheetWrapper}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Kalkulator Pakan Alternatif</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <X size={22} color={COLORS.muted} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              <FormInput
                label="Total Kebutuhan Pakan Harian (kg)"
                keyboardType="numeric"
                value={totalPakanKgHarian}
                onChangeText={setTotalPakanKgHarian}
              />
              <FormInput
                label="Harga Pakan Pabrik/Pelet per Kg (Rp)"
                keyboardType="numeric"
                value={hargaPeletPerKg}
                onChangeText={setHargaPeletPerKg}
              />

              <FormChoice
                label="Jenis Pakan Alternatif"
                value={jenisAlternatif}
                onChange={handleJenisChange}
                options={PAKAN_ALTERNATIF_PRESETS.map((p) => ({ label: p.nama, value: p.id }))}
              />
              <FormInput
                label={`Harga ${namaAlternatif} per Kg (Rp)`}
                keyboardType="numeric"
                value={hargaAlternatifPerKg}
                onChangeText={setHargaAlternatifPerKg}
              />
              <FormInput
                label="Persentase Pakan Alternatif dalam Campuran (%)"
                keyboardType="numeric"
                placeholder="Contoh: 30"
                value={persenAlternatif}
                onChangeText={setPersenAlternatif}
              />
              <Text style={styles.rasioHint}>
                Rasio campuran: {persenPelet}% Pelet + {Math.min(Math.max(toNumber(persenAlternatif), 0), 100)}%{' '}
                {namaAlternatif}
              </Text>

              <Pressable style={styles.hitungButton} onPress={handleHitung}>
                <Text style={styles.hitungButtonText}>Hitung Penghematan</Text>
              </Pressable>

              {hasil ? (
                <View style={styles.hasilWrapper}>
                  <View style={styles.hasilRow}>
                    <View style={styles.hasilBox}>
                      <Text style={styles.hasilLabel}>Kebutuhan Pelet</Text>
                      <Text style={styles.hasilValue}>{hasil.kebutuhanPeletKg.toFixed(2)} kg</Text>
                      <Text style={styles.hasilSub}>{formatRupiah(hasil.biayaPeletHarian)}</Text>
                    </View>
                    <View style={styles.hasilBox}>
                      <Text style={styles.hasilLabel}>Kebutuhan {namaAlternatif}</Text>
                      <Text style={styles.hasilValue}>{hasil.kebutuhanAlternatifKg.toFixed(2)} kg</Text>
                      <Text style={styles.hasilSub}>{formatRupiah(hasil.biayaAlternatifHarian)}</Text>
                    </View>
                  </View>

                  <View style={styles.hematCard}>
                    <Text style={styles.hematLabel}>Penghematan Biaya Harian</Text>
                    <Text
                      style={[
                        styles.hematValue,
                        { color: hasil.penghematanHarian >= 0 ? COLORS.success : COLORS.danger },
                      ]}
                    >
                      {formatRupiah(hasil.penghematanHarian)}
                    </Text>
                    <View style={styles.hematDivider} />
                    <Text style={styles.hematLabel}>Penghematan Biaya Bulanan (30 hari)</Text>
                    <Text
                      style={[
                        styles.hematValue,
                        { color: hasil.penghematanBulanan >= 0 ? COLORS.success : COLORS.danger },
                      ]}
                    >
                      {formatRupiah(hasil.penghematanBulanan)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Tutup</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 22, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
    maxHeight: '88%',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flexShrink: 1,
    marginRight: SPACING.sm,
  },
  scrollArea: {
    flexGrow: 0,
    flexShrink: 1,
  },
  body: {
    paddingBottom: SPACING.md,
  },
  rasioHint: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: -8,
    marginBottom: SPACING.md,
  },
  hitungButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  hitungButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  hasilWrapper: {
    marginTop: SPACING.xs,
  },
  hasilRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  hasilBox: {
    flex: 1,
    backgroundColor: '#FAFBFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  hasilLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  hasilValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  hasilSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  hematCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: SPACING.lg,
  },
  hematLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  hematValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  hematDivider: {
    height: 1,
    backgroundColor: 'rgba(15, 118, 110, 0.15)',
    marginVertical: SPACING.sm,
  },
  footer: {
    paddingTop: SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F1F3F2',
  },
  closeButtonText: {
    fontWeight: '700',
    color: COLORS.muted,
  },
});
