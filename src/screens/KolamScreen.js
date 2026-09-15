import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Fish,
  Skull,
  Scale,
  Utensils,
  Droplets,
  ArrowLeftRight,
  Shell,
  Wind,
  Bug,
  Archive,
  ArchiveRestore,
  Trash2,
} from 'lucide-react-native';

import KolamCard from '../components/KolamCard';
import StatusIndicator from '../components/StatusIndicator';
import FormModal, { FormInput, FormChoice } from '../components/FormModal';
import KolamFormFields, { kolamFormToPayload, kolamToForm, KOLAM_FORM_DEFAULTS } from '../components/KolamFormFields';
import PakanAlternatifCalc from '../components/PakanAlternatifCalc';
import HargaJualWidget from '../components/HargaJualWidget';
import PakanFormModal from '../components/PakanFormModal';
import WaterQualityModal from '../components/WaterQualityModal';
import GradingModal from '../components/GradingModal';
import DailyPakanChecklist from '../components/DailyPakanChecklist';
import { COLORS, SPACING } from '../theme';
import { formatTanggal, todayISODate, toNumber } from '../utils/format';
import { buildKolamSummary } from '../utils/kolamSummary';
import { hitungRekomendasiPakanHarianKg, analisaKualitasAir } from '../utils/leleCalculators';
import { subscribeDataChanged, emitDataChanged } from '../utils/eventBus';
import {
  getAllKolam,
  createKolam,
  updateKolam,
  archiveKolam,
  restoreKolam,
  deleteKolam,
  createPopulasiLog,
  getPopulasiLogByKolam,
  updatePopulasiLog,
  createKematianKonsumsiLog,
  createSamplingLog,
  createPakanLog,
  createAirLog,
  createGradingLog,
  createMoltingLog,
  createAeratorLog,
  createWaterAlert,
  resolveWaterAlert,
  getAllPenjualBibit,
} from '../db/queries';

function formatJamFromIso(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function buildRekapHariIni(summary) {
  const items = [];

  (summary.dailyChecklistHariIni || [])
    .filter((row) => row.is_completed)
    .forEach((row) => {
      items.push({
        id: `checklist-${row.id}`,
        waktu: row.waktu_selesai,
        text: `Pakan ${row.sesi_pakan} (${(row.jumlah_kg ?? 0).toFixed(2)} kg) [Selesai]`,
      });
    });

  (summary.waterAlertsResolvedHariIni || []).forEach((alert) => {
    items.push({
      id: `alert-${alert.id}`,
      waktu: alert.waktu_resolved,
      text: `${alert.rekomendasi || alert.pesan} [Selesai]`,
    });
  });

  return items
    .filter((item) => item.waktu)
    .sort((a, b) => new Date(a.waktu) - new Date(b.waktu));
}

const ACTIONS = [
  { key: 'tebar', label: 'Tebar Bibit', icon: Fish, color: COLORS.primary },
  { key: 'mati', label: 'Kematian/Konsumsi', icon: Skull, color: COLORS.danger },
  { key: 'sampling', label: 'Sampling Berat', icon: Scale, color: COLORS.warning },
  { key: 'pakan', label: 'Pakan Harian', icon: Utensils, color: COLORS.primary },
  { key: 'air', label: 'Air & Cuaca', icon: Droplets, color: COLORS.primary },
  { key: 'grading', label: 'Pindah/Grading', icon: ArrowLeftRight, color: COLORS.warning },
  { key: 'molting', label: 'Catat Molting', icon: Shell, color: COLORS.warning, lobsterOnly: true },
  { key: 'aerator', label: 'Log Aerator/Suhu', icon: Wind, color: COLORS.primary },
  { key: 'pakanAlternatif', label: 'Pakan Alternatif', icon: Bug, color: COLORS.success, standalone: true },
];

function buildActivityFeed(detail) {
  const items = [];
  detail.populasiLogs.forEach((p) =>
    items.push({ id: `populasi-${p.id}`, date: p.tanggal_tebar, text: `🐟 Tebar ${p.jumlah_bibit} ekor bibit` })
  );
  detail.kematianLogs.forEach((k) =>
    items.push({
      id: `mati-${k.id}`,
      date: k.tanggal,
      text: `💀 Mati ${k.jumlah_mati} ekor${k.jumlah_konsumsi ? `, konsumsi ${k.jumlah_konsumsi} ekor` : ''}`,
    })
  );
  detail.samplingLogs.forEach((s) =>
    items.push({ id: `sampling-${s.id}`, date: s.tanggal, text: `⚖️ Sampling rata-rata ${s.berat_rata_rata_gram} gram` })
  );
  detail.pakanLogs.forEach((p) =>
    items.push({
      id: `pakan-${p.id}`,
      date: p.tanggal,
      text: `🍽️ Pakan ${p.jumlah_kg} kg${p.jenis_pakan ? ` (${p.jenis_pakan})` : ''}`,
    })
  );
  detail.airLogs.forEach((a) =>
    items.push({
      id: `air-${a.id}`,
      date: a.tanggal,
      text: `💧 pH ${a.ph_air ?? '-'} · suhu ${a.suhu ?? '-'}°C · ${a.kondisi_cuaca ?? '-'}`,
    })
  );
  detail.gradingLogs.forEach((g) =>
    items.push({
      id: `grading-${g.id}`,
      date: g.tanggal,
      text: `↔️ Grading ${g.jumlah_ekor} ekor${g.ukuran ? ` (${g.ukuran})` : ''}`,
    })
  );
  detail.moltingLogs.forEach((m) =>
    items.push({
      id: `molting-${m.id}`,
      date: m.tanggal_molting,
      text: `🦞 Molting${m.nomor_box ? ` box ${m.nomor_box}` : ''} • ${m.status_cangkang}`,
    })
  );
  detail.aeratorLogs.forEach((a) =>
    items.push({
      id: `aerator-${a.id}`,
      date: a.tanggal,
      text: `🌀 Aerator ${a.status_aerator}${a.nilai_do_ppm != null ? ` • DO ${a.nilai_do_ppm} ppm` : ''}${a.suhu_celsius != null ? ` • ${a.suhu_celsius}°C` : ''}`,
    })
  );
  return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
}

export default function KolamScreen() {
  const insets = useSafeAreaInsets();
  const [summaries, setSummaries] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedKolamId, setSelectedKolamId] = useState(null);
  const [penjualBibitList, setPenjualBibitList] = useState([]);
  const [kolamTab, setKolamTab] = useState('aktif');

  const [activeModal, setActiveModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const kolamList = await getAllKolam();
    const summaryList = await Promise.all(kolamList.map(buildKolamSummary));
    setSummaries(summaryList);
    const penjualList = await getAllPenjualBibit();
    setPenjualBibitList(penjualList);
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

  const selected = (summaries || []).find((s) => s.kolam.id === selectedKolamId) || null;

  const openModal = (type, kolamToEdit) => {
    if (type === 'tambahKolam') {
      setForm({ ...KOLAM_FORM_DEFAULTS });
    } else if (type === 'editKolam' && kolamToEdit) {
      setForm(kolamToForm(kolamToEdit));
    } else if (type === 'molting') {
      setForm({ tanggalMolting: todayISODate(), statusCangkang: 'Lunak/Karantina' });
    } else if (type === 'aerator') {
      setForm({ tanggal: todayISODate(), statusAerator: 'Normal' });
    } else if (type === 'air') {
      setForm({ tanggal: todayISODate(), kejernihan: 'Jernih', kondisiCuaca: 'Cerah' });
    } else {
      setForm({ tanggal: todayISODate(), tanggalTebar: todayISODate(), tanggalBeli: todayISODate(), kondisiCuaca: 'Cerah' });
    }
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setForm({});
  };

  const handleSubmitKolamBaru = async () => {
    if (!form.namaKolam) return;
    setSaving(true);
    try {
      await createKolam({ ...kolamFormToPayload(form), status: 'aktif' });
      closeModal();
      await loadData();
      emitDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitEditKolam = async () => {
    if (!form.namaKolam || !selected) return;
    setSaving(true);
    try {
      await updateKolam(selected.kolam.id, { ...kolamFormToPayload(form), status: selected.kolam.status });
      closeModal();
      await loadData();
      emitDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitDetailModal = async () => {
    if (!selected) return;
    const idKolam = selected.kolam.id;
    setSaving(true);
    try {
      if (activeModal === 'tebar') {
        await createPopulasiLog({
          idKolam,
          tanggalTebar: form.tanggalTebar || todayISODate(),
          jumlahBibit: toNumber(form.jumlahBibit),
          ukuranBibitCm: form.ukuranBibitCm ? toNumber(form.ukuranBibitCm) : null,
          bobotAwalGram: form.bobotAwalGram ? toNumber(form.bobotAwalGram) : null,
          idPenjualBibit: form.idPenjualBibit ?? null,
        });
      } else if (activeModal === 'mati') {
        await createKematianKonsumsiLog({
          idKolam,
          tanggal: form.tanggal || todayISODate(),
          jumlahMati: toNumber(form.jumlahMati),
          jumlahKonsumsi: toNumber(form.jumlahKonsumsi),
          keterangan: form.keterangan || null,
        });
      } else if (activeModal === 'sampling') {
        await createSamplingLog({
          idKolam,
          tanggal: form.tanggal || todayISODate(),
          beratRataRataGram: toNumber(form.beratRataRataGram),
        });
      } else if (activeModal === 'pakan') {
        await createPakanLog({
          idKolam,
          tanggal: form.tanggal || todayISODate(),
          jenisPakan: form.jenisPakan || null,
          jumlahKg: toNumber(form.jumlahKg),
          biaya: form.biaya ? toNumber(form.biaya) : null,
        });
      } else if (activeModal === 'air') {
        const tanggalAir = form.tanggal || todayISODate();
        const phAir = form.phAir ? toNumber(form.phAir) : null;
        const kejernihan = form.kejernihan || null;

        await createAirLog({
          idKolam,
          tanggal: tanggalAir,
          phAir,
          suhu: form.suhu ? toNumber(form.suhu) : null,
          kejernihan,
          kondisiCuaca: form.kondisiCuaca || null,
          tindakan: form.tindakan || null,
        });

        const hasilAnalisa = analisaKualitasAir({ phAir, kejernihan, volumeAirM3: selected.specKolam.volumeAirM3 });
        for (const alert of hasilAnalisa.alerts) {
          await createWaterAlert({
            idKolam,
            tanggal: tanggalAir,
            jenisAlert: alert.kode,
            pesan: alert.pesan,
            rekomendasi: alert.rekomendasi,
          });
        }
      } else if (activeModal === 'grading') {
        const jumlahEkor = toNumber(form.jumlahEkor);
        const tanggalGrading = form.tanggal || todayISODate();
        const kolamTujuanId = form.idKolamTujuan ?? null;

        await createGradingLog({
          idKolamAsal: idKolam,
          idKolamTujuan: kolamTujuanId,
          tanggal: tanggalGrading,
          jumlahEkor,
          ukuran: form.ukuran || null,
        });

        if (kolamTujuanId) {
          // Grading dengan tujuan = transfer sungguhan: kurangi populasi Kolam Asal
          // (via kematian_konsumsi_log, sama seperti mekanisme panen) dan tambahkan
          // ke populasi_log Kolam Tujuan (gabung ke batch aktif bila ada, atau buat
          // batch baru bila Kolam Tujuan masih kosong).
          await createKematianKonsumsiLog({
            idKolam,
            tanggal: tanggalGrading,
            jumlahMati: 0,
            jumlahKonsumsi: jumlahEkor,
            keterangan: 'Grading/Pindah Kolam',
          });

          const populasiTujuan = await getPopulasiLogByKolam(kolamTujuanId);
          const latestTujuan = populasiTujuan[0] || null;
          if (latestTujuan) {
            await updatePopulasiLog(latestTujuan.id, {
              tanggalTebar: latestTujuan.tanggal_tebar,
              jumlahBibit: latestTujuan.jumlah_bibit + jumlahEkor,
              ukuranBibitCm: latestTujuan.ukuran_bibit_cm,
              bobotAwalGram: latestTujuan.bobot_awal_gram,
              idPenjualBibit: latestTujuan.id_penjual_bibit,
            });
          } else {
            await createPopulasiLog({
              idKolam: kolamTujuanId,
              tanggalTebar: tanggalGrading,
              jumlahBibit: jumlahEkor,
              ukuranBibitCm: null,
              bobotAwalGram: null,
              idPenjualBibit: null,
            });
          }

          const kolamTujuanRow = summaries.find((s) => s.kolam.id === kolamTujuanId)?.kolam;
          if (kolamTujuanRow && kolamTujuanRow.status !== 'aktif') {
            await updateKolam(kolamTujuanId, { ...kolamFormToPayload(kolamToForm(kolamTujuanRow)), status: 'aktif' });
          }
        }
      } else if (activeModal === 'molting') {
        await createMoltingLog({
          idKolam,
          nomorBox: form.nomorBox || null,
          tanggalMolting: form.tanggalMolting || todayISODate(),
          statusCangkang: form.statusCangkang || 'Lunak/Karantina',
          catatan: form.catatan || null,
        });
      } else if (activeModal === 'aerator') {
        await createAeratorLog({
          idKolam,
          tanggal: form.tanggal || todayISODate(),
          statusAerator: form.statusAerator || 'Normal',
          nilaiDoPpm: form.nilaiDoPpm ? toNumber(form.nilaiDoPpm) : null,
          suhuCelsius: form.suhuCelsius ? toNumber(form.suhuCelsius) : null,
        });
      }
      closeModal();
      await loadData();
      emitDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleResolveAlert = async (alertId) => {
    await resolveWaterAlert(alertId);
    await loadData();
    emitDataChanged();
  };

  const handleArchiveKolam = (kolam) => {
    Alert.alert(
      'Arsipkan Kolam',
      `Kolam "${kolam.nama_kolam}" akan dipindahkan ke Kolam Diarsipkan dan tidak lagi tampil di dashboard utama. Seluruh riwayat pakan dan catatannya tetap tersimpan, dan kolam bisa diaktifkan kembali kapan saja.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Arsipkan',
          onPress: async () => {
            await archiveKolam(kolam.id);
            if (selectedKolamId === kolam.id) setSelectedKolamId(null);
            await loadData();
            emitDataChanged();
          },
        },
      ]
    );
  };

  const handleRestoreKolam = (kolam) => {
    Alert.alert(
      'Aktifkan Kembali Kolam',
      `Kolam "${kolam.nama_kolam}" akan diaktifkan kembali dan muncul lagi di daftar Kolam Aktif.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Aktifkan',
          onPress: async () => {
            await restoreKolam(kolam.id);
            await loadData();
            emitDataChanged();
          },
        },
      ]
    );
  };

  const handleDeleteKolam = (kolam) => {
    Alert.alert(
      'Hapus Kolam Permanen',
      `Semua data kolam "${kolam.nama_kolam}" beserta riwayat pakan, populasi, dan catatan lainnya akan dihapus permanen dan TIDAK BISA dikembalikan. Lanjutkan?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Permanen',
          style: 'destructive',
          onPress: async () => {
            await deleteKolam(kolam.id);
            if (selectedKolamId === kolam.id) setSelectedKolamId(null);
            await loadData();
            emitDataChanged();
          },
        },
      ]
    );
  };

  if (summaries === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (selected) {
    const rekomendasiPakan = hitungRekomendasiPakanHarianKg(selected.biomassaKg * 1000);
    const activityFeed = buildActivityFeed(selected);

    return (
      <KolamDetail
        summary={selected}
        rekomendasiPakan={rekomendasiPakan}
        activityFeed={activityFeed}
        onBack={() => setSelectedKolamId(null)}
        openModal={openModal}
        onResolveAlert={handleResolveAlert}
        onArchive={handleArchiveKolam}
        onRestore={handleRestoreKolam}
        onDelete={handleDeleteKolam}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <FormModal
          visible={activeModal === 'tebar'}
          title="Tebar Bibit"
          onClose={closeModal}
          onSubmit={handleSubmitDetailModal}
          submitDisabled={saving}
        >
          <FormInput label="Tanggal Tebar" value={form.tanggalTebar} onChangeText={(v) => setForm((f) => ({ ...f, tanggalTebar: v }))} />
          <FormInput label="Jumlah Bibit (ekor)" keyboardType="numeric" value={form.jumlahBibit} onChangeText={(v) => setForm((f) => ({ ...f, jumlahBibit: v }))} />
          <FormInput label="Ukuran Bibit (cm)" keyboardType="numeric" value={form.ukuranBibitCm} onChangeText={(v) => setForm((f) => ({ ...f, ukuranBibitCm: v }))} />
          <FormInput label="Bobot Awal per Ekor (gram)" keyboardType="numeric" value={form.bobotAwalGram} onChangeText={(v) => setForm((f) => ({ ...f, bobotAwalGram: v }))} />
          {penjualBibitList.length > 0 && (
            <FormChoice
              label="Beli Bibit Dari"
              value={form.idPenjualBibit}
              onChange={(v) => setForm((f) => ({ ...f, idPenjualBibit: v }))}
              options={penjualBibitList.map((p) => ({ label: p.nama_penjual, value: p.id }))}
            />
          )}
        </FormModal>

        <FormModal
          visible={activeModal === 'mati'}
          title="Catat Kematian/Konsumsi"
          onClose={closeModal}
          onSubmit={handleSubmitDetailModal}
          submitDisabled={saving}
        >
          <FormInput label="Tanggal" value={form.tanggal} onChangeText={(v) => setForm((f) => ({ ...f, tanggal: v }))} />
          <FormInput label="Jumlah Mati (ekor)" keyboardType="numeric" value={form.jumlahMati} onChangeText={(v) => setForm((f) => ({ ...f, jumlahMati: v }))} />
          <FormInput label="Jumlah Dikonsumsi/Dipanen Sebagian (ekor)" keyboardType="numeric" value={form.jumlahKonsumsi} onChangeText={(v) => setForm((f) => ({ ...f, jumlahKonsumsi: v }))} />
          <FormInput label="Keterangan (opsional)" value={form.keterangan} onChangeText={(v) => setForm((f) => ({ ...f, keterangan: v }))} />
        </FormModal>

        <FormModal
          visible={activeModal === 'sampling'}
          title="Sampling Berat"
          onClose={closeModal}
          onSubmit={handleSubmitDetailModal}
          submitDisabled={saving}
        >
          <FormInput label="Tanggal" value={form.tanggal} onChangeText={(v) => setForm((f) => ({ ...f, tanggal: v }))} />
          <FormInput label="Berat Rata-rata (gram)" keyboardType="numeric" value={form.beratRataRataGram} onChangeText={(v) => setForm((f) => ({ ...f, beratRataRataGram: v }))} />
        </FormModal>

        <PakanFormModal
          visible={activeModal === 'pakan'}
          title="Pakan Harian"
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleSubmitDetailModal}
          submitDisabled={saving}
        />

        <WaterQualityModal
          visible={activeModal === 'air'}
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleSubmitDetailModal}
          submitDisabled={saving}
        />

        <GradingModal
          visible={activeModal === 'grading'}
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleSubmitDetailModal}
          submitDisabled={saving || toNumber(form.jumlahEkor) <= 0}
          kolamAsalLabel={selected.kolam.nama_kolam}
          kolamTujuanOptions={[
            { label: 'Sortir di Kolam Ini (Tidak Pindah)', value: null },
            ...summaries
              .filter((s) => s.kolam.id !== selected.kolam.id && s.kolam.status !== 'archived')
              .map((s) => ({ label: s.kolam.nama_kolam, value: s.kolam.id })),
          ]}
        />

        <FormModal
          visible={activeModal === 'molting'}
          title="Catat Molting"
          onClose={closeModal}
          onSubmit={handleSubmitDetailModal}
          submitDisabled={saving}
        >
          <FormInput
            label="Nomor Box (opsional)"
            value={form.nomorBox}
            onChangeText={(v) => setForm((f) => ({ ...f, nomorBox: v }))}
          />
          <FormInput
            label="Tanggal Molting"
            value={form.tanggalMolting}
            onChangeText={(v) => setForm((f) => ({ ...f, tanggalMolting: v }))}
          />
          <FormChoice
            label="Status Cangkang"
            value={form.statusCangkang}
            onChange={(v) => setForm((f) => ({ ...f, statusCangkang: v }))}
            options={[
              { label: 'Lunak/Karantina', value: 'Lunak/Karantina' },
              { label: 'Mulai Mengkeras', value: 'Mulai Mengkeras' },
              { label: 'Keras/Normal', value: 'Keras/Normal' },
            ]}
          />
          <FormInput label="Catatan (opsional)" value={form.catatan} onChangeText={(v) => setForm((f) => ({ ...f, catatan: v }))} />
        </FormModal>

        <FormModal
          visible={activeModal === 'aerator'}
          title="Log Aerator/Suhu"
          onClose={closeModal}
          onSubmit={handleSubmitDetailModal}
          submitDisabled={saving}
        >
          <FormInput label="Tanggal" value={form.tanggal} onChangeText={(v) => setForm((f) => ({ ...f, tanggal: v }))} />
          <FormChoice
            label="Status Aerator"
            value={form.statusAerator}
            onChange={(v) => setForm((f) => ({ ...f, statusAerator: v }))}
            options={[
              { label: 'Normal', value: 'Normal' },
              { label: 'Maintenance', value: 'Maintenance' },
              { label: 'Rusak', value: 'Rusak' },
            ]}
          />
          <FormInput
            label="Nilai DO (ppm, opsional)"
            keyboardType="numeric"
            value={form.nilaiDoPpm}
            onChangeText={(v) => setForm((f) => ({ ...f, nilaiDoPpm: v }))}
          />
          <FormInput
            label="Suhu (°C, opsional)"
            keyboardType="numeric"
            value={form.suhuCelsius}
            onChangeText={(v) => setForm((f) => ({ ...f, suhuCelsius: v }))}
          />
        </FormModal>

        <FormModal
          visible={activeModal === 'editKolam'}
          title="Ubah Kolam"
          onClose={closeModal}
          onSubmit={handleSubmitEditKolam}
          submitDisabled={saving || !form.namaKolam}
        >
          <KolamFormFields form={form} setForm={setForm} />
        </FormModal>
      </KolamDetail>
    );
  }

  const kolamAktifList = summaries.filter((s) => s.kolam.status !== 'archived');
  const kolamArsipList = summaries.filter((s) => s.kolam.status === 'archived');
  const kolamTampil = kolamTab === 'aktif' ? kolamAktifList : kolamArsipList;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Kolam & Pakan</Text>
          <Pressable style={styles.addButton} onPress={() => openModal('tambahKolam')}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Kolam</Text>
          </Pressable>
        </View>

        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabButton, kolamTab === 'aktif' && styles.tabButtonActive]}
            onPress={() => setKolamTab('aktif')}
          >
            <Text style={[styles.tabButtonText, kolamTab === 'aktif' && styles.tabButtonTextActive]}>
              Kolam Aktif ({kolamAktifList.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, kolamTab === 'archived' && styles.tabButtonActive]}
            onPress={() => setKolamTab('archived')}
          >
            <Text style={[styles.tabButtonText, kolamTab === 'archived' && styles.tabButtonTextActive]}>
              Kolam Diarsipkan ({kolamArsipList.length})
            </Text>
          </Pressable>
        </View>

        {kolamTampil.length === 0 && (
          <Text style={styles.emptyText}>
            {kolamTab === 'aktif'
              ? 'Belum ada kolam aktif. Yuk tambahkan kolam pertamamu!'
              : 'Belum ada kolam yang diarsipkan.'}
          </Text>
        )}

        {kolamTampil.map((s) => (
          <KolamCard
            key={s.kolam.id}
            summary={s}
            onPress={() => setSelectedKolamId(s.kolam.id)}
            footer={
              <View style={styles.cardActionsRow}>
                {kolamTab === 'aktif' ? (
                  <Pressable style={styles.cardActionButton} onPress={() => handleArchiveKolam(s.kolam)}>
                    <Archive size={16} color={COLORS.warning} />
                    <Text style={[styles.cardActionText, { color: COLORS.warning }]}>Arsipkan</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.cardActionButton} onPress={() => handleRestoreKolam(s.kolam)}>
                    <ArchiveRestore size={16} color={COLORS.primary} />
                    <Text style={[styles.cardActionText, { color: COLORS.primary }]}>Aktifkan</Text>
                  </Pressable>
                )}
                <Pressable style={styles.cardActionButton} onPress={() => handleDeleteKolam(s.kolam)}>
                  <Trash2 size={16} color={COLORS.danger} />
                  <Text style={[styles.cardActionText, { color: COLORS.danger }]}>Hapus Permanen</Text>
                </Pressable>
              </View>
            }
          />
        ))}
      </ScrollView>

      <FormModal
        visible={activeModal === 'tambahKolam'}
        title="Tambah Kolam Baru"
        onClose={closeModal}
        onSubmit={handleSubmitKolamBaru}
        submitDisabled={saving || !form.namaKolam}
      >
        <KolamFormFields form={form} setForm={setForm} />
      </FormModal>
    </View>
  );
}

function KolamDetail({
  summary,
  rekomendasiPakan,
  activityFeed,
  onBack,
  openModal,
  onResolveAlert,
  onArchive,
  onRestore,
  onDelete,
  refreshing,
  onRefresh,
  children,
}) {
  const insets = useSafeAreaInsets();
  const [pakanAlternatifVisible, setPakanAlternatifVisible] = useState(false);
  const rekapHariIni = buildRekapHariIni(summary);
  const isArchived = summary.kolam.status === 'archived';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.backRow}>
          <Pressable style={styles.backLink} onPress={onBack}>
            <ArrowLeft size={18} color={COLORS.primary} />
            <Text style={styles.backText}>Semua Kolam</Text>
          </Pressable>
          <View style={styles.detailActionsRow}>
            <Pressable style={styles.editLink} onPress={() => openModal('editKolam', summary.kolam)}>
              <Pencil size={16} color={COLORS.muted} />
              <Text style={styles.editText}>Ubah</Text>
            </Pressable>
            {isArchived ? (
              <Pressable style={styles.editLink} onPress={() => onRestore(summary.kolam)}>
                <ArchiveRestore size={16} color={COLORS.primary} />
                <Text style={[styles.editText, { color: COLORS.primary }]}>Aktifkan</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.editLink} onPress={() => onArchive(summary.kolam)}>
                <Archive size={16} color={COLORS.warning} />
                <Text style={[styles.editText, { color: COLORS.warning }]}>Arsipkan</Text>
              </Pressable>
            )}
            <Pressable style={styles.editLink} onPress={() => onDelete(summary.kolam)}>
              <Trash2 size={16} color={COLORS.danger} />
              <Text style={[styles.editText, { color: COLORS.danger }]}>Hapus</Text>
            </Pressable>
          </View>
        </View>

        <KolamCard summary={summary} />

        {summary.kualitasAir ? (
          <View style={styles.waterQualityBox}>
            <StatusIndicator level={summary.kualitasAir.level} label={summary.kualitasAir.label} />
            {summary.waterAlertsPending.map((alert) => (
              <View key={alert.id} style={styles.alertActionRow}>
                <Text style={styles.waterQualityAlertText}>⚠️ {alert.pesan}</Text>
                <Pressable style={styles.alertActionButton} onPress={() => onResolveAlert(alert.id)}>
                  <Text style={styles.alertActionButtonText}>✓ Sudah {alert.rekomendasi || 'Ditangani'}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.pakanCard}>
          <Text style={styles.pakanTitle}>Rekomendasi Pakan Hari Ini</Text>
          <Text style={styles.pakanValue}>
            {rekomendasiPakan.minKg.toFixed(2)} - {rekomendasiPakan.maxKg.toFixed(2)} kg
          </Text>
          <Text style={styles.pakanSub}>3-5% dari total biomassa kolam</Text>
        </View>

        <DailyPakanChecklist idKolam={summary.kolam.id} porsiPakanHarian={summary.porsiPakanHarian} />

        <HargaJualWidget
          title="Analisis Harga Jual (Estimasi Saat Ini)"
          totalModal={summary.totalPakanBiaya}
          totalBiomassKg={summary.biomassaKg}
          jenisKomoditas={summary.kolam.jenis_komoditas}
        />

        <Text style={styles.sectionTitle}>Catat Aktivitas</Text>
        <View style={styles.actionGrid}>
          {ACTIONS.filter((action) => !action.lobsterOnly || summary.isLobster).map((action) => (
            <Pressable
              key={action.key}
              style={styles.actionCard}
              onPress={() => (action.standalone ? setPakanAlternatifVisible(true) : openModal(action.key))}
            >
              <action.icon size={22} color={action.color} />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {rekapHariIni.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Rekapitulasi Hari Ini</Text>
            {rekapHariIni.map((item) => (
              <View key={item.id} style={styles.activityRow}>
                <Text style={styles.activityText}>{item.text}</Text>
                <Text style={styles.activityDate}>{formatJamFromIso(item.waktu)}</Text>
              </View>
            ))}
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Riwayat Terbaru</Text>
        {activityFeed.length === 0 && <Text style={styles.emptyText}>Belum ada catatan untuk kolam ini.</Text>}
        {activityFeed.map((item) => (
          <View key={item.id} style={styles.activityRow}>
            <Text style={styles.activityText}>{item.text}</Text>
            <Text style={styles.activityDate}>{formatTanggal(item.date)}</Text>
          </View>
        ))}
      </ScrollView>
      {children}
      <PakanAlternatifCalc
        visible={pakanAlternatifVisible}
        onClose={() => setPakanAlternatifVisible(false)}
        initialTotalPakanKg={rekomendasiPakan.maxKg}
      />
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
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 6,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 999,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  cardActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: COLORS.primary,
    fontWeight: '700',
    marginLeft: 6,
  },
  detailActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  editText: {
    color: COLORS.muted,
    fontWeight: '700',
    marginLeft: 4,
    fontSize: 13,
  },
  waterQualityBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  waterQualityAlertText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
    flexShrink: 1,
    marginRight: SPACING.sm,
  },
  alertActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  alertActionButton: {
    backgroundColor: COLORS.dangerBg,
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  alertActionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
  },
  pakanCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  pakanTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pakanValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginVertical: 4,
  },
  pakanSub: {
    fontSize: 12,
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  actionCard: {
    width: '31%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 6,
    textAlign: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  activityText: {
    fontSize: 13,
    color: COLORS.text,
    flexShrink: 1,
    marginRight: SPACING.sm,
  },
  activityDate: {
    fontSize: 11,
    color: COLORS.muted,
  },
});
