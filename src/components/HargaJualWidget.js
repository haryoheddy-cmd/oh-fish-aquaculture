import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Pencil, X } from 'lucide-react-native';

import { FormInput } from './FormModal';
import { COLORS, SPACING } from '../theme';
import { formatRupiah, toNumber } from '../utils/format';
import { hitungRekomendasiHargaJual, tentukanStatusHargaPasaran } from '../utils/leleCalculators';
import { formatKomoditasLabel } from '../constants/komoditas';
import { emitDataChanged, subscribeDataChanged } from '../utils/eventBus';
import { getHargaPasaranLokal, setHargaPasaranLokal } from '../db/queries';

const STATUS_CONFIG = {
  untung_tinggi: { emoji: '🟢', label: 'Potensi Untung Tinggi', bg: COLORS.successBg, text: COLORS.success },
  margin_tipis: { emoji: '🟡', label: 'Margin Tipis', bg: COLORS.warningBg, text: COLORS.warning },
  rugi: { emoji: '🔴', label: 'Resiko Rugi!', bg: COLORS.dangerBg, text: COLORS.danger },
};

export default function HargaJualWidget({
  totalModal,
  totalBiomassKg,
  jenisKomoditas = null,
  title = 'Analisis Harga Jual & Pasaran',
}) {
  const storageKey = jenisKomoditas || 'umum';
  const [hargaLokal, setHargaLokal] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);

  const loadHargaLokal = useCallback(async () => {
    const row = await getHargaPasaranLokal(storageKey);
    setHargaLokal(row?.harga_per_kg ?? null);
  }, [storageKey]);

  useFocusEffect(
    useCallback(() => {
      loadHargaLokal();
    }, [loadHargaLokal])
  );

  useEffect(() => subscribeDataChanged(loadHargaLokal), [loadHargaLokal]);

  const hasil = hitungRekomendasiHargaJual(totalModal, totalBiomassKg, jenisKomoditas);
  const hargaPasaranAktif = hargaLokal ?? hasil.benchmarkPasaranPerKg;
  const status = tentukanStatusHargaPasaran(hargaPasaranAktif, hasil);
  const statusConfig = status ? STATUS_CONFIG[status] : null;
  const estimasiKeuntungan =
    hargaPasaranAktif != null && hasil.bepPerKg != null && totalBiomassKg > 0
      ? (hargaPasaranAktif - hasil.bepPerKg) * totalBiomassKg
      : null;

  const openEdit = () => {
    const nilaiAwal = hargaLokal ?? hasil.benchmarkPasaranPerKg;
    setInputValue(nilaiAwal != null ? String(nilaiAwal) : '');
    setEditVisible(true);
  };

  const handleSaveHargaLokal = async () => {
    const value = toNumber(inputValue);
    if (value <= 0) return;
    setSaving(true);
    try {
      await setHargaPasaranLokal(storageKey, value);
      setHargaLokal(value);
      setEditVisible(false);
      emitDataChanged();
    } finally {
      setSaving(false);
    }
  };

  if (hasil.bepPerKg == null) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.emptyText}>Belum cukup data biaya/biomassa untuk menghitung analisis harga.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.row}>
        <View style={[styles.miniCard, styles.neutralCard]}>
          <Text style={styles.miniLabel}>BEP / Modal per Kg</Text>
          <Text style={styles.miniValue}>{formatRupiah(hasil.bepPerKg)}</Text>
        </View>
        <View style={[styles.miniCard, styles.successCard]}>
          <Text style={[styles.miniLabel, styles.successText]}>Harga Jual Disarankan</Text>
          <Text style={[styles.miniValue, styles.successText]}>{formatRupiah(hasil.hargaJualIdeal)}</Text>
          <Text style={styles.miniSub}>Min anti-rugi {formatRupiah(hasil.hargaMinimumAntiRugi)}</Text>
        </View>
      </View>

      <View style={[styles.miniCard, styles.infoCard]}>
        <View style={styles.infoHeaderRow}>
          <Text style={[styles.miniLabel, styles.infoText]} numberOfLines={1}>
            Harga Pasaran {hargaLokal != null ? 'Lokal' : 'Rata-rata'}
            {jenisKomoditas ? ` · ${formatKomoditasLabel(jenisKomoditas) ?? ''}` : ''}
          </Text>
          <Pressable style={styles.editButton} onPress={openEdit} hitSlop={8}>
            <Pencil size={14} color={COLORS.info} />
            <Text style={styles.editButtonText}>Ubah</Text>
          </Pressable>
        </View>
        <Text style={[styles.miniValue, styles.infoText]}>
          {hargaPasaranAktif != null ? formatRupiah(hargaPasaranAktif) : 'Belum diatur'}
        </Text>
      </View>

      {statusConfig ? (
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.statusText, { color: statusConfig.text }]}>
            {statusConfig.emoji} {statusConfig.label}
          </Text>
        </View>
      ) : null}

      {estimasiKeuntungan != null ? (
        <View style={styles.profitRow}>
          <Text style={styles.profitLabel}>Estimasi Keuntungan Bersih Panen</Text>
          <Text style={[styles.profitValue, { color: estimasiKeuntungan >= 0 ? COLORS.success : COLORS.danger }]}>
            {formatRupiah(estimasiKeuntungan)}
          </Text>
        </View>
      ) : null}

      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Harga Pasaran Lokal</Text>
              <Pressable onPress={() => setEditVisible(false)} hitSlop={12}>
                <X size={20} color={COLORS.muted} />
              </Pressable>
            </View>
            <Text style={styles.modalHint}>
              Masukkan harga jual tengkulak/pasar di daerahmu supaya simulasi keuntungan panen lebih akurat.
            </Text>
            <FormInput
              label="Harga per Kg (Rp)"
              keyboardType="numeric"
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Contoh: 24000"
            />
            <Pressable
              style={[styles.saveButton, (saving || toNumber(inputValue) <= 0) && styles.saveButtonDisabled]}
              onPress={handleSaveHargaLokal}
              disabled={saving || toNumber(inputValue) <= 0}
            >
              <Text style={styles.saveButtonText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  miniCard: {
    flex: 1,
    borderRadius: 14,
    padding: SPACING.md,
  },
  neutralCard: {
    backgroundColor: '#F1F3F2',
  },
  successCard: {
    backgroundColor: COLORS.primaryLight,
  },
  infoCard: {
    backgroundColor: COLORS.infoBg,
    marginBottom: SPACING.md,
  },
  successText: {
    color: COLORS.primary,
  },
  infoText: {
    color: COLORS.info,
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  miniValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  miniSub: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
    opacity: 0.8,
  },
  infoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.info,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  profitRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  profitLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  profitValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 22, 0.45)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalHint: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: SPACING.md,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
