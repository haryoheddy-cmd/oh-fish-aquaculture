import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { FormInput, FormChoice } from './FormModal';
import { COLORS, SPACING } from '../theme';
import { toNumber } from '../utils/format';
import { hitungRekomendasiProbiotik } from '../utils/leleCalculators';

export default function ProbiotikCalc({
  visible,
  onClose,
  initialVolumeAirM3 = null,
  initialDebitAirLPerMenit = null,
  initialLokasiKolam = 'Outdoor',
}) {
  const insets = useSafeAreaInsets();
  const [volumeAirM3, setVolumeAirM3] = useState(
    initialVolumeAirM3 != null && initialVolumeAirM3 > 0 ? String(initialVolumeAirM3.toFixed(2)) : ''
  );
  const [debitAirLPerMenit, setDebitAirLPerMenit] = useState(
    initialDebitAirLPerMenit != null ? String(initialDebitAirLPerMenit) : ''
  );
  const [lokasiKolam, setLokasiKolam] = useState(initialLokasiKolam || 'Outdoor');
  const [hasil, setHasil] = useState(null);

  const handleHitung = () => {
    setHasil(
      hitungRekomendasiProbiotik({
        volumeAirM3: toNumber(volumeAirM3),
        debitAirLPerMenit: debitAirLPerMenit ? toNumber(debitAirLPerMenit) : null,
        lokasiKolam,
      })
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.sheetWrapper}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Kalkulator Takaran Probiotik</Text>
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
              <Text style={styles.introText}>
                Takaran fermentasi molase & ragi untuk air hijau/floc, otomatis disesuaikan dengan volume air,
                debit/pergantian air, dan lokasi kolam.
              </Text>

              <FormInput
                label="Volume Air Kolam (m³)"
                keyboardType="numeric"
                helperText="Terisi otomatis dari spesifikasi kolam bila tersedia — bisa diubah manual."
                value={volumeAirM3}
                onChangeText={setVolumeAirM3}
              />
              <FormInput
                label="Debit Air Masuk (Liter/Menit, opsional)"
                keyboardType="numeric"
                helperText="Isi bila kolam punya aliran air masuk terus-menerus (bukan kolam statis)."
                value={debitAirLPerMenit}
                onChangeText={setDebitAirLPerMenit}
              />
              <FormChoice
                label="Lokasi Kolam"
                value={lokasiKolam}
                onChange={setLokasiKolam}
                options={[
                  { label: '☀️ Outdoor', value: 'Outdoor' },
                  { label: '🏠 Indoor', value: 'Indoor' },
                ]}
              />

              <Pressable style={styles.hitungButton} onPress={handleHitung}>
                <Text style={styles.hitungButtonText}>Hitung Takaran</Text>
              </Pressable>

              {hasil ? (
                <View style={styles.hasilWrapper}>
                  <View style={styles.hasilCard}>
                    <Text style={styles.hasilLabel}>Dosis Larutan Starter</Text>
                    <Text style={styles.hasilValue}>{hasil.dosisLiter.toFixed(2)} Liter</Text>
                    <Text style={styles.hasilSub}>untuk {hasil.volumeAirM3.toFixed(2)} m³ air kolam</Text>
                  </View>

                  <View style={styles.bahanRow}>
                    <View style={styles.bahanBox}>
                      <Text style={styles.bahanLabel}>Molase</Text>
                      <Text style={styles.bahanValue}>{hasil.bahan.molaseMl} mL</Text>
                    </View>
                    <View style={styles.bahanBox}>
                      <Text style={styles.bahanLabel}>Ragi</Text>
                      <Text style={styles.bahanValue}>{hasil.bahan.ragiGram} g</Text>
                    </View>
                    <View style={styles.bahanBox}>
                      <Text style={styles.bahanLabel}>Air</Text>
                      <Text style={styles.bahanValue}>{hasil.bahan.airMl} mL</Text>
                    </View>
                  </View>

                  <View style={styles.intervalCard}>
                    <Text style={styles.intervalLabel}>Interval Pemberian</Text>
                    <Text style={styles.intervalValue}>Setiap {hasil.intervalHari} hari sekali</Text>
                  </View>

                  <View style={styles.catatanCard}>
                    <Text style={styles.catatanTitle}>💧 Catatan Debit Air</Text>
                    <Text style={styles.catatanText}>{hasil.catatanDebit}</Text>
                  </View>

                  <View style={styles.catatanCard}>
                    <Text style={styles.catatanTitle}>{hasil.isIndoor ? '🏠 Catatan Kolam Indoor' : '☀️ Catatan Kolam Outdoor'}</Text>
                    <Text style={styles.catatanText}>{hasil.catatanLokasi}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyHint}>
                  Isi volume air kolam lalu tekan "Hitung Takaran" untuk melihat rekomendasi dosis.
                </Text>
              )}
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
  introText: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: SPACING.md,
    lineHeight: 17,
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
  emptyHint: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  hasilWrapper: {
    gap: SPACING.sm,
  },
  hasilCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: SPACING.lg,
  },
  hasilLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  hasilValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginVertical: 2,
  },
  hasilSub: {
    fontSize: 12,
    color: COLORS.primary,
  },
  bahanRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  bahanBox: {
    flex: 1,
    backgroundColor: '#FAFBFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  bahanLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  bahanValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  intervalCard: {
    backgroundColor: '#FAFBFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  intervalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  intervalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  catatanCard: {
    backgroundColor: '#FAFBFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  catatanTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  catatanText: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 17,
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
