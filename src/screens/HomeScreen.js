import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skull, Utensils, NotebookPen, User, Circle, CircleCheckBig } from 'lucide-react-native';

import KolamCard from '../components/KolamCard';
import StatusIndicator, { stokToLevel } from '../components/StatusIndicator';
import FormModal, { FormInput } from '../components/FormModal';
import PakanFormModal from '../components/PakanFormModal';
import DailyPakanChecklist from '../components/DailyPakanChecklist';
import MiniBarChart from '../components/MiniBarChart';
import { COLORS, SPACING } from '../theme';
import { formatRupiah, formatTanggal, todayISODate, toNumber } from '../utils/format';
import { hitungLabaRugiBersih } from '../utils/leleCalculators';
import { buildKolamSummary } from '../utils/kolamSummary';
import { subscribeDataChanged, emitDataChanged } from '../utils/eventBus';
import {
  getAllKolam,
  getAllStok,
  getAllPenjualan,
  getAllPengeluaranLain,
  getAllPakanLog,
  getAllAirLog,
  getAllAeratorLog,
  getProfilUser,
  createKematianKonsumsiLog,
  createPakanLog,
  createSamplingLog,
} from '../db/queries';

const TREATMENT_KEYWORDS = ['kuras', 'probiotik'];
const TREATMENT_INTERVAL_HARI = 7;

function hitungTugasHarianHariIni({ summaries, pakanLogs, airLogs, aeratorLogs }) {
  const hariIni = todayISODate();
  const kolamAktif = summaries.filter((s) => s.kolam.status === 'aktif');
  const totalKolamAktif = kolamAktif.length;

  const kolamSudahPakan = new Set(pakanLogs.filter((p) => p.tanggal === hariIni).map((p) => p.id_kolam)).size;
  const kolamSudahCekAir = new Set(
    [...airLogs, ...aeratorLogs].filter((l) => l.tanggal === hariIni).map((l) => l.id_kolam)
  ).size;

  const treatmentTerakhir = airLogs
    .filter((a) => a.tindakan && TREATMENT_KEYWORDS.some((k) => a.tindakan.toLowerCase().includes(k)))
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))[0] || null;
  const hariSejakTreatment = treatmentTerakhir
    ? Math.round((new Date(hariIni) - new Date(treatmentTerakhir.tanggal)) / 86400000)
    : null;

  return {
    totalKolamAktif,
    pakan: { done: totalKolamAktif > 0 && kolamSudahPakan >= totalKolamAktif, sudah: kolamSudahPakan },
    air: { done: totalKolamAktif > 0 && kolamSudahCekAir >= totalKolamAktif, sudah: kolamSudahCekAir },
    treatment: {
      done: hariSejakTreatment != null && hariSejakTreatment < TREATMENT_INTERVAL_HARI,
      terakhir: treatmentTerakhir,
      hariSejak: hariSejakTreatment,
    },
  };
}

function getSapaanWaktu() {
  const jam = new Date().getHours();
  if (jam < 11) return 'Selamat Pagi';
  if (jam < 15) return 'Selamat Siang';
  if (jam < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

const HARI_LABEL = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function buildTrenPakan7Hari(pakanLogs) {
  const hariIni = new Date();
  const hasil = [];
  for (let i = 6; i >= 0; i--) {
    const tanggal = new Date(hariIni);
    tanggal.setDate(hariIni.getDate() - i);
    const iso = tanggal.toISOString().slice(0, 10);
    const totalBiaya = pakanLogs
      .filter((p) => p.tanggal === iso)
      .reduce((sum, p) => sum + (p.biaya || 0), 0);
    hasil.push({ label: HARI_LABEL[tanggal.getDay()], value: totalBiaya });
  }
  return hasil;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [summaries, setSummaries] = useState(null);
  const [stokTipis, setStokTipis] = useState([]);
  const [labaRugi, setLabaRugi] = useState({ pendapatan: 0, biaya: 0, labaRugi: 0 });
  const [trenPakan, setTrenPakan] = useState([]);
  const [tugasHarian, setTugasHarian] = useState(null);
  const [profil, setProfil] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [activeModal, setActiveModal] = useState(null);
  const [targetKolam, setTargetKolam] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const kolamList = await getAllKolam();
    const summaryList = await Promise.all(kolamList.map(buildKolamSummary));
    setSummaries(summaryList);

    const stokList = await getAllStok();
    setStokTipis(stokList.filter((s) => stokToLevel(s.jumlah_stok, s.batas_minimal) !== 'aman'));

    const [semuaPenjualan, semuaPengeluaran, profilUser, pakanLogs, airLogs, aeratorLogs] = await Promise.all([
      getAllPenjualan(),
      getAllPengeluaranLain(),
      getProfilUser(),
      getAllPakanLog(),
      getAllAirLog(),
      getAllAeratorLog(),
    ]);
    setProfil(profilUser);
    setTrenPakan(buildTrenPakan7Hari(pakanLogs));
    setTugasHarian(hitungTugasHarianHariIni({ summaries: summaryList, pakanLogs, airLogs, aeratorLogs }));
    const totalPendapatan = semuaPenjualan.reduce((sum, p) => sum + p.total_kg * p.harga_per_kg, 0);
    const totalBiayaPakan = summaryList.reduce((sum, s) => sum + s.totalPakanBiaya, 0);
    const totalBiayaLain = semuaPengeluaran.reduce((sum, p) => sum + p.jumlah_biaya, 0);
    const totalBiaya = totalBiayaPakan + totalBiayaLain;

    setLabaRugi({
      pendapatan: totalPendapatan,
      biaya: totalBiaya,
      labaRugi: hitungLabaRugiBersih(totalPendapatan, totalBiaya),
    });
  }, []);

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

  const openModal = (type, kolam) => {
    setTargetKolam(kolam);
    setForm({ tanggal: todayISODate() });
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setTargetKolam(null);
    setForm({});
  };

  const handleSubmit = async () => {
    if (!targetKolam) return;
    setSaving(true);
    try {
      if (activeModal === 'mati') {
        await createKematianKonsumsiLog({
          idKolam: targetKolam.id,
          tanggal: form.tanggal || todayISODate(),
          jumlahMati: toNumber(form.jumlahMati),
          jumlahKonsumsi: toNumber(form.jumlahKonsumsi),
          keterangan: form.keterangan || null,
        });
      } else if (activeModal === 'pakan') {
        await createPakanLog({
          idKolam: targetKolam.id,
          tanggal: form.tanggal || todayISODate(),
          jenisPakan: form.jenisPakan || null,
          jumlahKg: toNumber(form.jumlahKg),
          biaya: form.biaya ? toNumber(form.biaya) : null,
        });
      } else if (activeModal === 'jurnal') {
        await createSamplingLog({
          idKolam: targetKolam.id,
          tanggal: form.tanggal || todayISODate(),
          beratRataRataGram: toNumber(form.beratRataRataGram),
        });
      }
      closeModal();
      await loadData();
      emitDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const alerts = [];
  (summaries || []).filter((s) => s.kolam.status !== 'archived').forEach((s) => {
    if (s.kematianAlert?.isAlert) {
      alerts.push({ key: `mati-${s.kolam.id}`, level: 'bahaya', text: `${s.kolam.nama_kolam}: ${s.kematianAlert.pesan}` });
    }
    if (s.phLevel === 'bahaya' || s.phLevel === 'waspada') {
      alerts.push({
        key: `ph-${s.kolam.id}`,
        level: s.phLevel,
        text: `${s.kolam.nama_kolam}: pH air ${s.phLatest} perlu dicek`,
      });
    }
  });
  stokTipis.forEach((s) => {
    alerts.push({
      key: `stok-${s.id}`,
      level: stokToLevel(s.jumlah_stok, s.batas_minimal),
      text: `Stok ${s.nama_barang} tinggal ${s.jumlah_stok} ${s.satuan || ''}`.trim(),
    });
  });

  if (summaries === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const kolamAktifSummaries = summaries.filter((s) => s.kolam.status !== 'archived');

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.xl * 2 + 80 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.heading} numberOfLines={1}>
              {getSapaanWaktu()}, {profil?.nama_peternakan || profil?.nama_panggilan || 'Juragan Lele'}! 👋
            </Text>
            <Text style={styles.subheading}>Begini kondisi kolam kamu hari ini.</Text>
          </View>
          <Pressable style={styles.avatarWrap} onPress={() => navigation.navigate('Profil')}>
            {profil?.foto_profil_uri ? (
              <Image source={{ uri: profil.foto_profil_uri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={20} color={COLORS.primary} />
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.labaCard}>
          <Text style={styles.labaLabel}>Laba/Rugi Bersih</Text>
          <Text style={[styles.labaValue, { color: labaRugi.labaRugi >= 0 ? COLORS.success : COLORS.danger }]}>
            {formatRupiah(labaRugi.labaRugi)}
          </Text>
          <View style={styles.labaRow}>
            <Text style={styles.labaSub}>Pendapatan: {formatRupiah(labaRugi.pendapatan)}</Text>
            <Text style={styles.labaSub}>Biaya: {formatRupiah(labaRugi.biaya)}</Text>
          </View>
        </View>

        {tugasHarian ? (
          <View style={styles.taskCard}>
            <Text style={styles.taskCardTitle}>📋 Tugas Hari Ini</Text>
            <TaskRow
              done={tugasHarian.pakan.done}
              label="Beri Pakan Pagi & Sore"
              subLabel={
                tugasHarian.totalKolamAktif > 0
                  ? `${tugasHarian.pakan.sudah}/${tugasHarian.totalKolamAktif} kolam sudah diberi pakan hari ini`
                  : 'Belum ada kolam aktif'
              }
            />
            <TaskRow
              done={tugasHarian.air.done}
              label="Cek Aerator / Air (Setiap Hari)"
              subLabel={
                tugasHarian.totalKolamAktif > 0
                  ? `${tugasHarian.air.sudah}/${tugasHarian.totalKolamAktif} kolam sudah dicek hari ini`
                  : 'Belum ada kolam aktif'
              }
            />
            <TaskRow
              done={tugasHarian.treatment.done}
              label="Kuras / Treatment Probiotik"
              subLabel={
                tugasHarian.treatment.terakhir
                  ? `Terakhir ${tugasHarian.treatment.hariSejak} hari lalu (${formatTanggal(tugasHarian.treatment.terakhir.tanggal)})`
                  : 'Belum pernah tercatat, sarankan segera dijadwalkan'
              }
              isLast
            />
          </View>
        ) : null}

        {trenPakan.some((d) => d.value > 0) ? (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Pengeluaran Pakan 7 Hari Terakhir</Text>
            <MiniBarChart data={trenPakan} color={COLORS.warning} />
          </View>
        ) : null}

        {alerts.length > 0 && (
          <View style={styles.alertSection}>
            <Text style={styles.sectionTitle}>Perlu Perhatian</Text>
            {alerts.map((alert) => (
              <View key={alert.key} style={styles.alertRow}>
                <StatusIndicator level={alert.level} size="small" label=" " />
                <Text style={styles.alertText}>{alert.text}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Kolam Kamu</Text>
        {kolamAktifSummaries.length === 0 && (
          <Text style={styles.emptyText}>Belum ada kolam. Tambahkan dari tab "Kolam & Pakan".</Text>
        )}
        {kolamAktifSummaries.map((s) => (
          <View key={s.kolam.id}>
            <KolamCard
              summary={s}
              footer={
                <View style={styles.quickActions}>
                  <Pressable style={styles.quickAction} onPress={() => openModal('mati', s.kolam)}>
                    <Skull size={18} color={COLORS.danger} />
                    <Text style={styles.quickActionText}>+Mati</Text>
                  </Pressable>
                  <Pressable style={styles.quickAction} onPress={() => openModal('pakan', s.kolam)}>
                    <Utensils size={18} color={COLORS.primary} />
                    <Text style={styles.quickActionText}>+Pakan</Text>
                  </Pressable>
                  <Pressable style={styles.quickAction} onPress={() => openModal('jurnal', s.kolam)}>
                    <NotebookPen size={18} color={COLORS.warning} />
                    <Text style={styles.quickActionText}>+Jurnal</Text>
                  </Pressable>
                </View>
              }
            />
            <DailyPakanChecklist idKolam={s.kolam.id} porsiPakanHarian={s.porsiPakanHarian} />
          </View>
        ))}
      </ScrollView>

      <FormModal
        visible={activeModal === 'mati'}
        title={`Catat Kematian - ${targetKolam?.nama_kolam ?? ''}`}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitDisabled={saving}
      >
        <FormInput
          label="Tanggal"
          value={form.tanggal}
          onChangeText={(v) => setForm((f) => ({ ...f, tanggal: v }))}
        />
        <FormInput
          label="Jumlah Mati (ekor)"
          keyboardType="numeric"
          value={form.jumlahMati}
          onChangeText={(v) => setForm((f) => ({ ...f, jumlahMati: v }))}
        />
        <FormInput
          label="Jumlah Dikonsumsi/Dipanen Sebagian (ekor)"
          keyboardType="numeric"
          value={form.jumlahKonsumsi}
          onChangeText={(v) => setForm((f) => ({ ...f, jumlahKonsumsi: v }))}
        />
        <FormInput
          label="Keterangan (opsional)"
          value={form.keterangan}
          onChangeText={(v) => setForm((f) => ({ ...f, keterangan: v }))}
        />
      </FormModal>

      <PakanFormModal
        visible={activeModal === 'pakan'}
        title={`Catat Pakan - ${targetKolam?.nama_kolam ?? ''}`}
        form={form}
        setForm={setForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitDisabled={saving}
      />

      <FormModal
        visible={activeModal === 'jurnal'}
        title={`Jurnal Sampling - ${targetKolam?.nama_kolam ?? ''}`}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitDisabled={saving}
      >
        <FormInput
          label="Tanggal"
          value={form.tanggal}
          onChangeText={(v) => setForm((f) => ({ ...f, tanggal: v }))}
        />
        <FormInput
          label="Berat Rata-rata Sampling (gram)"
          keyboardType="numeric"
          value={form.beratRataRataGram}
          onChangeText={(v) => setForm((f) => ({ ...f, beratRataRataGram: v }))}
        />
      </FormModal>
    </View>
  );
}

function TaskRow({ done, label, subLabel, isLast = false }) {
  const Icon = done ? CircleCheckBig : Circle;
  return (
    <View style={[styles.taskRow, !isLast && styles.taskRowBorder]}>
      <Icon size={20} color={done ? COLORS.success : COLORS.muted} />
      <View style={styles.taskTextWrap}>
        <Text style={[styles.taskLabel, done && styles.taskLabelDone]}>{label}</Text>
        {subLabel ? <Text style={styles.taskSubLabel}>{subLabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: SPACING.md,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 2,
  },
  avatarWrap: {
    width: 44,
    height: 44,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labaCard: {
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
  labaLabel: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600',
  },
  labaValue: {
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 4,
  },
  labaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  labaSub: {
    fontSize: 12,
    color: COLORS.muted,
  },
  taskCard: {
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
  taskCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  taskRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  taskTextWrap: {
    flex: 1,
  },
  taskLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  taskLabelDone: {
    color: COLORS.muted,
    textDecorationLine: 'line-through',
  },
  taskSubLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  chartCard: {
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
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  alertSection: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  alertText: {
    marginLeft: SPACING.sm,
    color: COLORS.text,
    fontSize: 13,
    flexShrink: 1,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
});
