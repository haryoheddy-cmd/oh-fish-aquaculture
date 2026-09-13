import { phToLevel, aeratorStatusToLevel } from '../components/StatusIndicator';
import { isKomoditasLobster, getKomoditasPreset } from '../constants/komoditas';
import {
  hitungPopulasiAktif,
  hitungSurvivalRate,
  hitungBiomassaTotalGram,
  hitungProgressPanenPersen,
  hitungEstimasiSisaHariPanen,
  cekAlertKematianHarian,
  sumKematianKonsumsi,
  hitungRekomendasiPakanHarianKg,
  kalkulasiSpesifikasiKolam,
  cekStatusKepadatanTebar,
  rekomendasiJenisPelet,
  hitungPorsiPakanHarian,
  prediksiSiklusMolting,
  hitungProgressPanen,
  estimasiBobotSaatIni,
} from './leleCalculators';
import {
  getPopulasiLogByKolam,
  getKematianKonsumsiLogByKolam,
  getSamplingLogByKolam,
  getAirLogByKolam,
  getPakanLogByKolam,
  getGradingLogByKolamAsal,
  getMoltingLogByKolam,
  getAeratorLogByKolam,
} from '../db/queries';

export async function buildKolamSummary(kolam) {
  const [populasiLogs, kematianLogs, samplingLogs, airLogs, pakanLogs, gradingLogs, moltingLogs, aeratorLogs] =
    await Promise.all([
      getPopulasiLogByKolam(kolam.id),
      getKematianKonsumsiLogByKolam(kolam.id),
      getSamplingLogByKolam(kolam.id),
      getAirLogByKolam(kolam.id),
      getPakanLogByKolam(kolam.id),
      getGradingLogByKolamAsal(kolam.id),
      getMoltingLogByKolam(kolam.id),
      getAeratorLogByKolam(kolam.id),
    ]);

  const latestPopulasi = populasiLogs[0] || null;
  const latestSampling = samplingLogs[0] || null;
  const latestAir = airLogs[0] || null;

  const { totalMati, totalKonsumsi } = sumKematianKonsumsi(kematianLogs);
  const jumlahBibitAwal = latestPopulasi?.jumlah_bibit ?? 0;
  const populasiAktif = hitungPopulasiAktif(jumlahBibitAwal, totalMati, totalKonsumsi);
  const sr = jumlahBibitAwal ? hitungSurvivalRate(jumlahBibitAwal, totalMati) : null;
  const beratTerakhir = latestSampling?.berat_rata_rata_gram ?? null;
  const biomassaGram = beratTerakhir != null ? hitungBiomassaTotalGram(populasiAktif, beratTerakhir) : 0;

  const komoditasPreset = kolam.jenis_komoditas ? getKomoditasPreset(kolam.jenis_komoditas) : null;
  const targetPanenEfektifGram = kolam.target_panen_gram || komoditasPreset?.targetBobotGram || null;

  const progressPercent =
    latestPopulasi && beratTerakhir != null && targetPanenEfektifGram
      ? hitungProgressPanenPersen({
          bobotAwalGram: latestPopulasi.bobot_awal_gram ?? 0,
          beratTerakhirGram: beratTerakhir,
          targetPanenGram: targetPanenEfektifGram,
        })
      : null;

  const sisaHari =
    latestPopulasi && targetPanenEfektifGram
      ? hitungEstimasiSisaHariPanen({
          tanggalTebar: latestPopulasi.tanggal_tebar,
          bobotAwalGram: latestPopulasi.bobot_awal_gram ?? 0,
          tanggalSamplingTerakhir: latestSampling?.tanggal ?? null,
          beratTerakhirGram: beratTerakhir,
          targetPanenGram: targetPanenEfektifGram,
          jenisKomoditas: kolam.jenis_komoditas,
        })
      : null;

  const kematianTerbaru = kematianLogs[0] || null;
  const kematianAlert = kematianTerbaru
    ? cekAlertKematianHarian(kematianTerbaru.jumlah_mati, populasiAktif + kematianTerbaru.jumlah_mati)
    : { isAlert: false, pesan: null };

  const phLevel = latestAir?.ph_air != null ? phToLevel(latestAir.ph_air) : null;

  const latestAerator = aeratorLogs[0] || null;
  const aeratorLevel = latestAerator ? aeratorStatusToLevel(latestAerator.status_aerator) : null;

  const isLobster = isKomoditasLobster(kolam.jenis_komoditas);
  const latestMolting = moltingLogs[0] || null;
  const moltingAlert = isLobster && latestMolting?.status_cangkang === 'Lunak/Karantina';
  const prediksiMolting = isLobster
    ? prediksiSiklusMolting({
        tanggalMoltingTerakhir: latestMolting?.tanggal_molting ?? null,
        beratGram: beratTerakhir,
      })
    : null;

  let level = 'aman';
  if ((sr != null && sr < 75) || kematianAlert.isAlert || phLevel === 'bahaya' || aeratorLevel === 'bahaya') {
    level = 'bahaya';
  } else if ((sr != null && sr < 90) || phLevel === 'waspada' || aeratorLevel === 'waspada' || moltingAlert) {
    level = 'waspada';
  }

  const totalPakanBiaya = pakanLogs.reduce((sum, p) => sum + (p.biaya || 0), 0);

  const specKolam = kalkulasiSpesifikasiKolam({
    bentuk: kolam.bentuk,
    panjang: kolam.panjang,
    lebar: kolam.lebar,
    diameter: kolam.diameter,
    tinggi: kolam.tinggi,
    ketinggianAirCm: kolam.ketinggian_air,
    tipeBudidaya: kolam.tipe_budidaya,
    beratRataRataGram: beratTerakhir,
    jenisKomoditas: kolam.jenis_komoditas,
    isBertingkat: !!kolam.is_bertingkat,
    jumlahTingkat: kolam.jumlah_tingkat,
    jumlahBoxPerTingkat: kolam.jumlah_box_per_tingkat,
  });
  const statusTebar = cekStatusKepadatanTebar(populasiAktif, specKolam.tebarMaksimalEkor.max);
  const jenisPelet = rekomendasiJenisPelet(beratTerakhir);
  const rekomendasiPakanHarianKg = hitungRekomendasiPakanHarianKg(biomassaGram);
  const porsiPakanHarian = hitungPorsiPakanHarian(rekomendasiPakanHarianKg.maxKg);

  // Harvest Progress Tracker: murni berbasis waktu (tanggal tebar & preset komoditas),
  // selalu tersedia sejak hari pertama tebar — melengkapi progressPercent/sisaHari
  // di atas yang butuh data sampling untuk akurat.
  const harvestProgress = latestPopulasi
    ? hitungProgressPanen(latestPopulasi.tanggal_tebar, kolam.jenis_komoditas)
    : null;
  const estimasiBeratSaatIniGram = latestPopulasi
    ? estimasiBobotSaatIni(
        latestPopulasi.tanggal_tebar,
        latestPopulasi.bobot_awal_gram ?? 0,
        kolam.jenis_komoditas,
        latestSampling
      )
    : null;

  // Field gabungan siap-pakai UI: pakai hasil berbasis sampling (lebih akurat) bila ada,
  // jatuh ke estimasi berbasis waktu supaya tracker tetap tampil sejak hari pertama tebar.
  const trackerProgressPercent = progressPercent ?? harvestProgress?.progressPercent ?? null;
  const trackerSisaHari = sisaHari ?? harvestProgress?.sisaHari ?? null;
  const trackerStatus =
    harvestProgress?.status ?? (trackerSisaHari != null && trackerSisaHari <= 0 ? 'Siap Panen!' : null);
  const trackerBeratSaatIniGram = beratTerakhir ?? estimasiBeratSaatIniGram ?? null;

  return {
    kolam,
    latestPopulasi,
    latestSampling,
    latestAir,
    populasiLogs,
    kematianLogs,
    samplingLogs,
    airLogs,
    pakanLogs,
    gradingLogs,
    moltingLogs,
    aeratorLogs,
    populasiAktif,
    sr,
    biomassaKg: biomassaGram / 1000,
    progressPercent,
    sisaHari,
    level,
    kematianAlert,
    phLevel,
    phLatest: latestAir?.ph_air ?? null,
    totalPakanBiaya,
    specKolam,
    statusTebar,
    jenisPelet,
    rekomendasiPakanHarianKg,
    porsiPakanHarian,
    komoditasPreset,
    isLobster,
    latestAerator,
    aeratorLevel,
    latestMolting,
    moltingAlert,
    prediksiMolting,
    targetPanenEfektifGram,
    harvestProgress,
    estimasiBeratSaatIniGram,
    trackerProgressPercent,
    trackerSisaHari,
    trackerStatus,
    trackerBeratSaatIniGram,
  };
}
