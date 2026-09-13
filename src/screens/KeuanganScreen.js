import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, MessageCircle, CircleCheck, FileDown } from 'lucide-react-native';

import FormModal, { FormInput, FormChoice } from '../components/FormModal';
import StatusIndicator from '../components/StatusIndicator';
import { COLORS, SPACING } from '../theme';
import { formatRupiah, formatTanggal, todayISODate, toNumber } from '../utils/format';
import { hitungHPPPerKg, hitungBEPHargaPerKg, hitungLabaRugiBersih } from '../utils/leleCalculators';
import { exportLaporanBulananPdf } from '../utils/pdfExporter';
import { subscribeDataChanged, emitDataChanged } from '../utils/eventBus';
import {
  getAllKolam,
  getAllPenjualan,
  createPenjualan,
  updatePenjualan,
  getAllPengeluaranLain,
  createPengeluaranLain,
  getPakanLogByKolam,
} from '../db/queries';

const SECTIONS = [
  { key: 'penjualan', label: 'Penjualan' },
  { key: 'pengeluaran', label: 'Pengeluaran' },
  { key: 'kalkulator', label: 'HPP & BEP' },
];

const STATUS_BAYAR_LEVEL = { lunas: 'aman', dp: 'waspada', belum_lunas: 'bahaya' };
const STATUS_BAYAR_LABEL = { lunas: 'Lunas', dp: 'DP', belum_lunas: 'Piutang' };

function normalizePhoneForWa(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/[^0-9]/g, '');
  if (!digits) return null;
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  else if (!digits.startsWith('62')) digits = `62${digits}`;
  return digits;
}

function buildTagihanMessage(penjualan, kolamNama) {
  const total = penjualan.total_kg * penjualan.harga_per_kg;
  return (
    `Halo ${penjualan.nama_pembeli || 'Kak'}, mengingatkan tagihan lele dari ${kolamNama || 'kolam kami'}:\n` +
    `${penjualan.total_kg} kg x ${formatRupiah(penjualan.harga_per_kg)}/kg = ${formatRupiah(total)}\n` +
    `Tanggal: ${formatTanggal(penjualan.tanggal)}\n` +
    `Status: ${penjualan.status_bayar === 'dp' ? 'DP, sisanya belum lunas' : 'Belum lunas'}\n\n` +
    `Mohon konfirmasi pembayarannya ya. Terima kasih! 🙏 - Mister Lele`
  );
}

function openTagihanWa(penjualan, kolamNama) {
  const phone = normalizePhoneForWa(penjualan.kontak_pembeli);
  const message = buildTagihanMessage(penjualan, kolamNama);
  const url = `https://wa.me/${phone ?? ''}?text=${encodeURIComponent(message)}`;
  Linking.openURL(url).catch(() => {});
}

export default function KeuanganScreen() {
  const insets = useSafeAreaInsets();
  const [activeSection, setActiveSection] = useState('penjualan');
  const [kolamList, setKolamList] = useState([]);
  const [penjualanList, setPenjualanList] = useState(null);
  const [pengeluaranList, setPengeluaranList] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [activeModal, setActiveModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [kalkulatorKolamId, setKalkulatorKolamId] = useState(null);
  const [kalkulatorBiayaLain, setKalkulatorBiayaLain] = useState('0');
  const [kalkulatorHasil, setKalkulatorHasil] = useState(null);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    const [kolam, penjualan, pengeluaran] = await Promise.all([
      getAllKolam(),
      getAllPenjualan(),
      getAllPengeluaranLain(),
    ]);
    setKolamList(kolam);
    setPenjualanList(penjualan);
    setPengeluaranList(pengeluaran);
    if (!kalkulatorKolamId && kolam.length > 0) {
      setKalkulatorKolamId(kolam[0].id);
    }
  }, [kalkulatorKolamId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => subscribeDataChanged(loadData), [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const kolamNama = (id) => kolamList.find((k) => k.id === id)?.nama_kolam ?? '-';

  const openModal = (type) => {
    setForm({ tanggal: todayISODate(), statusBayar: 'belum_lunas', idKolam: kolamList[0]?.id ?? null });
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setForm({});
  };

  const handleSubmitPenjualan = async () => {
    setSaving(true);
    try {
      await createPenjualan({
        idKolam: form.idKolam,
        namaPembeli: form.namaPembeli || null,
        kontakPembeli: form.kontakPembeli || null,
        totalKg: toNumber(form.totalKg),
        hargaPerKg: toNumber(form.hargaPerKg),
        statusBayar: form.statusBayar || 'belum_lunas',
        tanggal: form.tanggal || todayISODate(),
      });
      closeModal();
      await loadData();
      emitDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPengeluaran = async () => {
    setSaving(true);
    try {
      await createPengeluaranLain({
        kategori: form.kategori || 'Lainnya',
        jumlahBiaya: toNumber(form.jumlahBiaya),
        tanggal: form.tanggal || todayISODate(),
        keterangan: form.keterangan || null,
      });
      closeModal();
      await loadData();
      emitDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const tandaiLunas = async (penjualan) => {
    await updatePenjualan(penjualan.id, {
      namaPembeli: penjualan.nama_pembeli,
      kontakPembeli: penjualan.kontak_pembeli,
      totalKg: penjualan.total_kg,
      hargaPerKg: penjualan.harga_per_kg,
      statusBayar: 'lunas',
      tanggal: penjualan.tanggal,
    });
    await loadData();
    emitDataChanged();
  };

  const hitungKalkulator = async () => {
    if (!kalkulatorKolamId) return;
    const [pakanLogs, penjualanKolam] = await Promise.all([
      getPakanLogByKolam(kalkulatorKolamId),
      getAllPenjualan(),
    ]);
    const penjualanKolamOnly = penjualanKolam.filter((p) => p.id_kolam === kalkulatorKolamId);

    const totalPakanBiaya = pakanLogs.reduce((sum, p) => sum + (p.biaya || 0), 0);
    const biayaLain = toNumber(kalkulatorBiayaLain);
    const totalBiayaProduksi = totalPakanBiaya + biayaLain;

    const totalKgPanen = penjualanKolamOnly.reduce((sum, p) => sum + p.total_kg, 0);
    const totalPendapatan = penjualanKolamOnly.reduce((sum, p) => sum + p.total_kg * p.harga_per_kg, 0);
    const hargaJualRataRata = totalKgPanen > 0 ? totalPendapatan / totalKgPanen : 0;

    setKalkulatorHasil({
      totalPakanBiaya,
      totalBiayaProduksi,
      totalKgPanen,
      totalPendapatan,
      hargaJualRataRata,
      hpp: hitungHPPPerKg(totalBiayaProduksi, totalKgPanen),
      bep: hitungBEPHargaPerKg(totalBiayaProduksi, totalKgPanen),
      labaRugi: hitungLabaRugiBersih(totalPendapatan, totalBiayaProduksi),
    });
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await exportLaporanBulananPdf();
    } catch {
      Alert.alert('Gagal Export', 'Terjadi kesalahan saat membuat laporan PDF.');
    } finally {
      setExporting(false);
    }
  };

  if (penjualanList === null || pengeluaranList === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.xl * 2 + 80 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.heading}>Keuangan</Text>

        <Pressable style={styles.exportButton} onPress={handleExportPdf} disabled={exporting}>
          <FileDown size={18} color={COLORS.primary} />
          <Text style={styles.exportButtonText}>
            {exporting ? 'Menyiapkan PDF...' : 'Export Laporan Bulanan PDF'}
          </Text>
        </Pressable>

        <View style={styles.sectionSwitcher}>
          {SECTIONS.map((section) => {
            const selected = section.key === activeSection;
            return (
              <Pressable
                key={section.key}
                style={[styles.sectionChip, selected && styles.sectionChipSelected]}
                onPress={() => setActiveSection(section.key)}
              >
                <Text style={[styles.sectionChipText, selected && styles.sectionChipTextSelected]}>
                  {section.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeSection === 'penjualan' && (
          <>
            <Pressable style={styles.addButton} onPress={() => openModal('penjualan')}>
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Catat Penjualan</Text>
            </Pressable>

            {penjualanList.length === 0 && <Text style={styles.emptyText}>Belum ada penjualan tercatat.</Text>}

            {penjualanList.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{p.nama_pembeli || 'Pembeli'}</Text>
                  <StatusIndicator level={STATUS_BAYAR_LEVEL[p.status_bayar]} label={STATUS_BAYAR_LABEL[p.status_bayar]} size="small" />
                </View>
                <Text style={styles.cardSub}>{kolamNama(p.id_kolam)} · {formatTanggal(p.tanggal)}</Text>
                <Text style={styles.cardValue}>
                  {p.total_kg} kg x {formatRupiah(p.harga_per_kg)} = {formatRupiah(p.total_kg * p.harga_per_kg)}
                </Text>
                {p.status_bayar !== 'lunas' && (
                  <View style={styles.cardActions}>
                    <Pressable style={styles.waButton} onPress={() => openTagihanWa(p, kolamNama(p.id_kolam))}>
                      <MessageCircle size={16} color="#FFFFFF" />
                      <Text style={styles.waButtonText}>Tagih via WA</Text>
                    </Pressable>
                    <Pressable style={styles.lunasButton} onPress={() => tandaiLunas(p)}>
                      <CircleCheck size={16} color={COLORS.success} />
                      <Text style={styles.lunasButtonText}>Tandai Lunas</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {activeSection === 'pengeluaran' && (
          <>
            <Pressable style={styles.addButton} onPress={() => openModal('pengeluaran')}>
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Catat Pengeluaran</Text>
            </Pressable>

            {pengeluaranList.length === 0 && <Text style={styles.emptyText}>Belum ada pengeluaran lain tercatat.</Text>}

            {pengeluaranList.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{p.kategori}</Text>
                  <Text style={styles.cardValue}>{formatRupiah(p.jumlah_biaya)}</Text>
                </View>
                <Text style={styles.cardSub}>{formatTanggal(p.tanggal)}</Text>
                {!!p.keterangan && <Text style={styles.cardSub}>{p.keterangan}</Text>}
              </View>
            ))}
          </>
        )}

        {activeSection === 'kalkulator' && (
          <View>
            <Text style={styles.sectionTitle}>Pilih Kolam</Text>
            <FormChoice
              label=""
              value={kalkulatorKolamId}
              onChange={setKalkulatorKolamId}
              options={kolamList.map((k) => ({ label: k.nama_kolam, value: k.id }))}
            />
            <FormInput
              label="Biaya Lain di Luar Pakan (Rp)"
              keyboardType="numeric"
              value={kalkulatorBiayaLain}
              onChangeText={setKalkulatorBiayaLain}
            />
            <Pressable style={styles.addButton} onPress={hitungKalkulator}>
              <Text style={styles.addButtonText}>Hitung HPP & BEP</Text>
            </Pressable>

            {kalkulatorHasil && (
              <View style={styles.hasilWrapper}>
                <View style={styles.hasilCard}>
                  <Text style={styles.hasilLabel}>HPP per Kg</Text>
                  <Text style={styles.hasilValue}>
                    {kalkulatorHasil.hpp != null ? formatRupiah(kalkulatorHasil.hpp) : 'Belum ada data panen'}
                  </Text>
                </View>
                <View style={styles.hasilCard}>
                  <Text style={styles.hasilLabel}>Harga Titik Impas (BEP)</Text>
                  <Text style={styles.hasilValue}>
                    {kalkulatorHasil.bep != null ? formatRupiah(kalkulatorHasil.bep) : 'Belum ada data panen'}
                  </Text>
                </View>
                <View style={styles.hasilCard}>
                  <Text style={styles.hasilLabel}>Laba/Rugi Bersih</Text>
                  <Text style={[styles.hasilValue, { color: kalkulatorHasil.labaRugi >= 0 ? COLORS.success : COLORS.danger }]}>
                    {formatRupiah(kalkulatorHasil.labaRugi)}
                  </Text>
                </View>

                {kalkulatorHasil.hpp != null && (
                  <View style={styles.bandingCard}>
                    <Text style={styles.sectionTitle}>Harga Jual vs HPP</Text>
                    <BarBanding label="Harga Jual Rata-rata" value={kalkulatorHasil.hargaJualRataRata} max={Math.max(kalkulatorHasil.hargaJualRataRata, kalkulatorHasil.hpp)} color={COLORS.primary} />
                    <BarBanding label="HPP (Modal per Kg)" value={kalkulatorHasil.hpp} max={Math.max(kalkulatorHasil.hargaJualRataRata, kalkulatorHasil.hpp)} color={COLORS.warning} />
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <FormModal
        visible={activeModal === 'penjualan'}
        title="Catat Penjualan"
        onClose={closeModal}
        onSubmit={handleSubmitPenjualan}
        submitDisabled={saving}
      >
        <FormChoice
          label="Kolam"
          value={form.idKolam}
          onChange={(v) => setForm((f) => ({ ...f, idKolam: v }))}
          options={kolamList.map((k) => ({ label: k.nama_kolam, value: k.id }))}
        />
        <FormInput label="Nama Pembeli" value={form.namaPembeli} onChangeText={(v) => setForm((f) => ({ ...f, namaPembeli: v }))} />
        <FormInput label="No. WA Pembeli" keyboardType="phone-pad" value={form.kontakPembeli} onChangeText={(v) => setForm((f) => ({ ...f, kontakPembeli: v }))} />
        <FormInput label="Total (kg)" keyboardType="numeric" value={form.totalKg} onChangeText={(v) => setForm((f) => ({ ...f, totalKg: v }))} />
        <FormInput label="Harga per Kg (Rp)" keyboardType="numeric" value={form.hargaPerKg} onChangeText={(v) => setForm((f) => ({ ...f, hargaPerKg: v }))} />
        <FormInput label="Tanggal" value={form.tanggal} onChangeText={(v) => setForm((f) => ({ ...f, tanggal: v }))} />
        <FormChoice
          label="Status Pembayaran"
          value={form.statusBayar}
          onChange={(v) => setForm((f) => ({ ...f, statusBayar: v }))}
          options={[
            { label: 'Lunas', value: 'lunas' },
            { label: 'DP', value: 'dp' },
            { label: 'Piutang', value: 'belum_lunas' },
          ]}
        />
      </FormModal>

      <FormModal
        visible={activeModal === 'pengeluaran'}
        title="Catat Pengeluaran"
        onClose={closeModal}
        onSubmit={handleSubmitPengeluaran}
        submitDisabled={saving}
      >
        <FormChoice
          label="Kategori"
          value={form.kategori}
          onChange={(v) => setForm((f) => ({ ...f, kategori: v }))}
          options={[
            { label: 'Bibit', value: 'Bibit' },
            { label: 'Obat', value: 'Obat' },
            { label: 'Listrik/Air', value: 'Listrik/Air' },
            { label: 'Tenaga Kerja', value: 'Tenaga Kerja' },
            { label: 'Lainnya', value: 'Lainnya' },
          ]}
        />
        <FormInput label="Jumlah Biaya (Rp)" keyboardType="numeric" value={form.jumlahBiaya} onChangeText={(v) => setForm((f) => ({ ...f, jumlahBiaya: v }))} />
        <FormInput label="Tanggal" value={form.tanggal} onChangeText={(v) => setForm((f) => ({ ...f, tanggal: v }))} />
        <FormInput label="Keterangan (opsional)" value={form.keterangan} onChangeText={(v) => setForm((f) => ({ ...f, keterangan: v }))} />
      </FormModal>
    </View>
  );
}

function BarBanding({ label, value, max, color }) {
  const width = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${width}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{formatRupiah(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xl * 2 },
  heading: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.md },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 14,
    marginBottom: SPACING.md,
    gap: 6,
  },
  exportButtonText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  sectionSwitcher: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  sectionChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sectionChipText: { fontSize: 13, fontWeight: '700', color: COLORS.muted },
  sectionChipTextSelected: { color: '#FFFFFF' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 14,
    marginBottom: SPACING.lg,
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '700', marginLeft: 6 },
  emptyText: { color: COLORS.muted, fontSize: 14, marginBottom: SPACING.md },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  cardValue: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 6 },
  cardActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  waButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 999,
  },
  waButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12, marginLeft: 6 },
  lunasButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 999,
  },
  lunasButtonText: { color: COLORS.success, fontWeight: '700', fontSize: 12, marginLeft: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  hasilWrapper: { marginTop: SPACING.md },
  hasilCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  hasilLabel: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
  hasilValue: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  bandingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  barRow: { marginBottom: SPACING.sm },
  barLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
  barTrack: { height: 10, borderRadius: 999, backgroundColor: COLORS.border, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  barValue: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginTop: 4 },
});
