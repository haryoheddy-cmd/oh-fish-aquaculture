// Kumpulan fungsi kalkulasi budidaya lele. Semua fungsi bersifat pure
// (menerima angka/tanggal mentah, mengembalikan angka) agar mudah dipakai
// ulang dari query hasil database maupun dari komponen UI.

import { getKomoditasPreset } from '../constants/komoditas';

function toDays(dateStart, dateEnd) {
  const start = new Date(dateStart);
  const end = new Date(dateEnd);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

/**
 * Survival Rate (%) = (populasi aktif / jumlah bibit awal) x 100
 */
export function hitungSurvivalRate(jumlahBibitAwal, totalKematian) {
  if (!jumlahBibitAwal || jumlahBibitAwal <= 0) return 0;
  const populasiAktif = Math.max(jumlahBibitAwal - totalKematian, 0);
  return (populasiAktif / jumlahBibitAwal) * 100;
}

/**
 * Populasi aktif = bibit awal - total mati - total dikonsumsi/dipanen sebagian
 */
export function hitungPopulasiAktif(jumlahBibitAwal, totalKematian, totalKonsumsi = 0) {
  return Math.max(jumlahBibitAwal - totalKematian - totalKonsumsi, 0);
}

/**
 * Menjumlahkan jumlah_mati dan jumlah_konsumsi dari baris-baris kematian_konsumsi_log.
 */
export function sumKematianKonsumsi(logs = []) {
  return logs.reduce(
    (acc, log) => ({
      totalMati: acc.totalMati + (log.jumlah_mati || 0),
      totalKonsumsi: acc.totalKonsumsi + (log.jumlah_konsumsi || 0),
    }),
    { totalMati: 0, totalKonsumsi: 0 }
  );
}

/**
 * Biomassa total (gram) = populasi aktif x berat rata-rata hasil sampling terakhir
 */
export function hitungBiomassaTotalGram(populasiAktif, beratRataRataGram) {
  if (!populasiAktif || !beratRataRataGram) return 0;
  return populasiAktif * beratRataRataGram;
}

/**
 * Rekomendasi pakan harian (kg), default rentang 3%-5% dari biomassa total.
 */
export function hitungRekomendasiPakanHarianKg(biomassaTotalGram, persenMin = 0.03, persenMax = 0.05) {
  if (!biomassaTotalGram || biomassaTotalGram <= 0) {
    return { minKg: 0, maxKg: 0 };
  }
  return {
    minKg: (biomassaTotalGram * persenMin) / 1000,
    maxKg: (biomassaTotalGram * persenMax) / 1000,
  };
}

/**
 * Progress panen (%) berdasarkan pertumbuhan bobot dari bobot awal tebar
 * menuju target_panen_gram, diukur lewat sampling terakhir.
 */
export function hitungProgressPanenPersen({ bobotAwalGram, beratTerakhirGram, targetPanenGram }) {
  const totalKenaikanTarget = targetPanenGram - bobotAwalGram;
  if (!totalKenaikanTarget || totalKenaikanTarget <= 0) return 0;
  const kenaikanSaatIni = beratTerakhirGram - bobotAwalGram;
  const persen = (kenaikanSaatIni / totalKenaikanTarget) * 100;
  return Math.min(Math.max(persen, 0), 100);
}

/**
 * Estimasi sisa hari menuju panen berdasarkan laju pertumbuhan harian
 * (dari tanggal_tebar+bobot_awal_gram sampai tanggal sampling terakhir+berat terakhir).
 * targetPanenGram jatuh ke targetBobotGram preset jenisKomoditas bila kosong.
 * Jika laju pertumbuhan belum bisa dihitung (belum ada sampling/pertumbuhan positif),
 * jatuh ke estimasi kasar dari masaPanenHari preset komoditas dikurangi umur tebar.
 */
export function hitungEstimasiSisaHariPanen({
  tanggalTebar,
  bobotAwalGram,
  tanggalSamplingTerakhir,
  beratTerakhirGram,
  targetPanenGram,
  jenisKomoditas = null,
}) {
  const preset = jenisKomoditas ? getKomoditasPreset(jenisKomoditas) : null;
  const targetGram = targetPanenGram || preset?.targetBobotGram || null;

  if (targetGram && tanggalSamplingTerakhir && beratTerakhirGram != null) {
    const hariBerjalan = toDays(tanggalTebar, tanggalSamplingTerakhir);
    if (hariBerjalan > 0) {
      const lajuPertumbuhanPerHari = (beratTerakhirGram - bobotAwalGram) / hariBerjalan;
      if (lajuPertumbuhanPerHari > 0) {
        const sisaGram = targetGram - beratTerakhirGram;
        if (sisaGram <= 0) return 0;
        return Math.ceil(sisaGram / lajuPertumbuhanPerHari);
      }
    }
  }

  if (preset?.masaPanenHari) {
    const acuanTanggal = tanggalSamplingTerakhir || new Date().toISOString().slice(0, 10);
    const hariSejakTebar = toDays(tanggalTebar, acuanTanggal);
    const sisaDariPreset = preset.masaPanenHari - hariSejakTebar;
    return sisaDariPreset > 0 ? sisaDariPreset : 0;
  }

  return null;
}

/**
 * FCR (Feed Conversion Ratio) = total pakan (kg) / pertambahan biomassa (kg)
 */
export function hitungFCR({ totalPakanKg, biomassaAwalGram, biomassaAkhirGram }) {
  const pertambahanBiomassaKg = (biomassaAkhirGram - biomassaAwalGram) / 1000;
  if (!pertambahanBiomassaKg || pertambahanBiomassaKg <= 0) return null;
  return totalPakanKg / pertambahanBiomassaKg;
}

/**
 * HPP (Harga Pokok Penjualan) per Kg = total biaya produksi / total kg hasil panen
 */
export function hitungHPPPerKg(totalBiayaProduksi, totalKgPanen) {
  if (!totalKgPanen || totalKgPanen <= 0) return null;
  return totalBiayaProduksi / totalKgPanen;
}

/**
 * Neraca laba/rugi bersih = total pendapatan penjualan - total biaya produksi
 */
export function hitungLabaRugiBersih(totalPendapatan, totalBiayaProduksi) {
  return totalPendapatan - totalBiayaProduksi;
}

/**
 * Harga titik impas (BEP) per Kg: harga jual minimum agar tidak rugi.
 * Setara dengan HPP per kg selama seluruh biaya produksi diperhitungkan.
 */
export function hitungBEPHargaPerKg(totalBiayaProduksi, totalKgPanen) {
  return hitungHPPPerKg(totalBiayaProduksi, totalKgPanen);
}

/**
 * Auto-alert kematian harian: aktif jika jumlah mati hari ini melebihi
 * `thresholdPersen` (default 5%) dari populasi aktif sebelumnya.
 */
export function cekAlertKematianHarian(jumlahMatiHarian, populasiAktifSebelumnya, thresholdPersen = 0.05) {
  if (!populasiAktifSebelumnya || populasiAktifSebelumnya <= 0) {
    return { isAlert: false, persentase: 0, pesan: null };
  }

  const persentase = (jumlahMatiHarian / populasiAktifSebelumnya) * 100;
  const isAlert = persentase > thresholdPersen * 100;

  return {
    isAlert,
    persentase,
    pesan: isAlert
      ? `Kematian harian ${persentase.toFixed(1)}% melebihi ambang batas ${thresholdPersen * 100}% dari populasi.`
      : null,
  };
}

// ---------- Spesifikasi & kapasitas kolam ----------

const TEBAR_MAKSIMAL_PER_M3 = {
  Bioflok: { min: 500, max: 1000 },
  'Kolam Tanah': { min: 100, max: 200 },
  Terpal: { min: 100, max: 200 },
  Beton: { min: 100, max: 200 },
};

const KETINGGIAN_IDEAL_CM = {
  bibit: { min: 40, max: 50 },
  pembesaran: { min: 80, max: 120 },
};

const PERGANTIAN_AIR_PERSEN_HARIAN = {
  Bioflok: { min: 10, max: 20 },
  'Kolam Tanah': { min: 20, max: 30 },
  Terpal: { min: 20, max: 30 },
  Beton: { min: 20, max: 30 },
};

const DURASI_PERGANTIAN_AIR_MENIT = 60;

/**
 * Fase budidaya berdasarkan bobot rata-rata hasil sampling terakhir.
 * Bibit jika belum ada sampling atau bobot < 50 gram, selebihnya pembesaran.
 */
export function tentukanFaseBudidaya(beratRataRataGram) {
  if (beratRataRataGram == null) return 'bibit';
  return beratRataRataGram < 50 ? 'bibit' : 'pembesaran';
}

/**
 * Volume air (m3) kolam Bundar (pakai diameter) atau Persegi (pakai panjang x lebar),
 * dihitung dari ketinggian air saat ini (bukan tinggi total dinding kolam).
 */
export function hitungVolumeAirM3({ bentuk, panjang, lebar, diameter, ketinggianAirCm }) {
  const tinggiAirM = (ketinggianAirCm || 0) / 100;
  if (!tinggiAirM) return 0;

  if (bentuk === 'Bundar') {
    if (!diameter) return 0;
    const jariJari = diameter / 2;
    return Math.PI * jariJari * jariJari * tinggiAirM;
  }

  if (!panjang || !lebar) return 0;
  return panjang * lebar * tinggiAirM;
}

/**
 * Total box individual pada kolam bertingkat/apartemen (jumlah_tingkat x jumlah_box_per_tingkat).
 */
export function hitungKapasitasApartemen(jumlahTingkat, jumlahBoxPerTingkat) {
  const tingkat = jumlahTingkat || 0;
  const boxPerTingkat = jumlahBoxPerTingkat || 0;
  return tingkat * boxPerTingkat;
}

/**
 * Rangkuman spesifikasi & rekomendasi kolam: volume air, tebar maksimal,
 * ketinggian air ideal, serta debit/pergantian air harian.
 * Tebar maksimal memakai (urutan prioritas): kapasitas box bila kolam bertingkat/apartemen,
 * padat tebar preset jenisKomoditas bila tersedia, lalu fallback ke rasio tipeBudidaya generik.
 */
export function kalkulasiSpesifikasiKolam({
  bentuk,
  panjang,
  lebar,
  diameter,
  tinggi,
  ketinggianAirCm,
  tipeBudidaya,
  beratRataRataGram,
  jenisKomoditas = null,
  isBertingkat = false,
  jumlahTingkat = null,
  jumlahBoxPerTingkat = null,
}) {
  const volumeAirM3 = hitungVolumeAirM3({ bentuk, panjang, lebar, diameter, ketinggianAirCm });

  const presetKomoditas = jenisKomoditas ? getKomoditasPreset(jenisKomoditas) : null;

  let tebarMaksimalEkor;
  if (isBertingkat) {
    const totalBox = hitungKapasitasApartemen(jumlahTingkat, jumlahBoxPerTingkat);
    tebarMaksimalEkor = { min: totalBox, max: totalBox };
  } else if (presetKomoditas?.padatTebarPerM3) {
    const target = Math.round(volumeAirM3 * presetKomoditas.padatTebarPerM3);
    tebarMaksimalEkor = { min: target, max: target };
  } else {
    const rasioTebar = TEBAR_MAKSIMAL_PER_M3[tipeBudidaya] || TEBAR_MAKSIMAL_PER_M3.Terpal;
    tebarMaksimalEkor = {
      min: Math.round(volumeAirM3 * rasioTebar.min),
      max: Math.round(volumeAirM3 * rasioTebar.max),
    };
  }

  const fase = tentukanFaseBudidaya(beratRataRataGram);
  const ketinggianIdealCm = { ...KETINGGIAN_IDEAL_CM[fase], fase };

  const rasioPergantian = PERGANTIAN_AIR_PERSEN_HARIAN[tipeBudidaya] || PERGANTIAN_AIR_PERSEN_HARIAN.Terpal;
  const rekomendasiDebitLPM = {
    min: Math.round((volumeAirM3 * 1000 * (rasioPergantian.min / 100)) / DURASI_PERGANTIAN_AIR_MENIT),
    max: Math.round((volumeAirM3 * 1000 * (rasioPergantian.max / 100)) / DURASI_PERGANTIAN_AIR_MENIT),
  };

  return {
    volumeAirM3,
    tebarMaksimalEkor,
    ketinggianIdealCm,
    rekomendasiPergantianAirPersenHarian: rasioPergantian,
    rekomendasiDebitLPM,
  };
}

/**
 * Status kepadatan tebar: aman (<85% kapasitas maksimal), padat (85-100%),
 * overcrowded (>100% kapasitas maksimal).
 */
export function cekStatusKepadatanTebar(populasiAktif, tebarMaksimalEkor) {
  if (!tebarMaksimalEkor || tebarMaksimalEkor <= 0) return 'aman';
  const rasio = populasiAktif / tebarMaksimalEkor;
  if (rasio > 1) return 'overcrowded';
  if (rasio >= 0.85) return 'padat';
  return 'aman';
}

// ---------- Porsi & jenis pakan harian ----------

const JENIS_PELET_BY_BERAT = [
  { maxGram: 5, jenis: 'PF-800' },
  { maxGram: 20, jenis: 'LP-1' },
  { maxGram: 100, jenis: 'LP-2' },
  { maxGram: Infinity, jenis: 'LP-3' },
];

/**
 * Rekomendasi ukuran pelet berdasarkan bobot rata-rata sampling terakhir.
 */
export function rekomendasiJenisPelet(beratRataRataGram) {
  if (beratRataRataGram == null) return null;
  const found = JENIS_PELET_BY_BERAT.find((r) => beratRataRataGram <= r.maxGram);
  return found ? found.jenis : 'LP-3';
}

/**
 * Membagi total dosis pakan harian (kg) ke 3 sesi: Pagi 30%, Sore 30%, Malam 40%.
 */
export function hitungPorsiPakanHarian(totalDosisKg) {
  const dosis = totalDosisKg || 0;
  return {
    pagi: dosis * 0.3,
    sore: dosis * 0.3,
    malam: dosis * 0.4,
  };
}

// ---------- Siklus molting lobster ----------

const INTERVAL_MOLTING_HARI_BY_BERAT = [
  { maxGram: 10, intervalHari: 14 },
  { maxGram: 30, intervalHari: 21 },
  { maxGram: 60, intervalHari: 30 },
  { maxGram: Infinity, intervalHari: 45 },
];

/**
 * Interval molting (hari) makin panjang seiring bobot lobster membesar
 * (juvenil ganti cangkang lebih sering dibanding lobster mendekati ukuran panen).
 */
export function tentukanIntervalMoltingHari(beratGram) {
  const berat = beratGram ?? 0;
  const found = INTERVAL_MOLTING_HARI_BY_BERAT.find((r) => berat <= r.maxGram);
  return found ? found.intervalHari : 45;
}

/**
 * Prediksi tanggal molting berikutnya = tanggal molting terakhir + interval
 * berdasarkan bobot/fase pertumbuhan saat ini. Null jika belum ada riwayat molting.
 */
export function prediksiSiklusMolting({ tanggalMoltingTerakhir, beratGram }) {
  if (!tanggalMoltingTerakhir) return null;

  const tanggalTerakhir = new Date(tanggalMoltingTerakhir);
  if (Number.isNaN(tanggalTerakhir.getTime())) return null;

  const intervalHari = tentukanIntervalMoltingHari(beratGram);
  const msPerDay = 1000 * 60 * 60 * 24;
  const tanggalPrediksi = new Date(tanggalTerakhir.getTime() + intervalHari * msPerDay);

  return {
    intervalHari,
    tanggalPrediksiBerikutnya: tanggalPrediksi.toISOString().slice(0, 10),
  };
}

// ---------- Harvest Progress Tracker ----------

/**
 * Progress panen murni berdasarkan waktu (hari berjalan sejak tebar / masaPanenHari
 * preset jenisKomoditas), tidak butuh data sampling. Null jika belum ada tanggal tebar
 * atau komoditas tidak punya masaPanenHari (misal komoditas custom).
 */
export function hitungProgressPanen(tanggalTebar, jenisKomoditas) {
  if (!tanggalTebar) return null;

  const preset = jenisKomoditas ? getKomoditasPreset(jenisKomoditas) : null;
  const masaPanenHari = preset?.masaPanenHari;
  if (!masaPanenHari) return null;

  const hariIni = new Date().toISOString().slice(0, 10);
  const hariBerjalan = Math.max(toDays(tanggalTebar, hariIni), 0);
  const progressPercent = Math.min(Math.max((hariBerjalan / masaPanenHari) * 100, 0), 100);
  const sisaHari = Math.max(masaPanenHari - hariBerjalan, 0);

  let status;
  if (sisaHari <= 0 || progressPercent >= 100) status = 'Siap Panen!';
  else if (progressPercent < 30) status = 'Fase Awal/Benih';
  else status = 'Fase Pembesaran';

  return { progressPercent, sisaHari, status, hariBerjalan, masaPanenHari };
}

/**
 * Estimasi bobot rata-rata per ekor saat ini. Memakai laju pertumbuhan aktual dari
 * sampling terakhir bila tersedia (lebih akurat); jika belum ada sampling, memakai
 * interpolasi linear waktu-tebar antara beratAwal menuju targetBobotGram preset komoditas.
 */
export function estimasiBobotSaatIni(tanggalTebar, beratAwal, jenisKomoditas, dataSamplingTerakhir = null) {
  const awal = beratAwal || 0;
  if (!tanggalTebar) return awal;

  const hariIni = new Date().toISOString().slice(0, 10);

  if (dataSamplingTerakhir?.tanggal && dataSamplingTerakhir?.berat_rata_rata_gram != null) {
    const hariTebarKeSampling = toDays(tanggalTebar, dataSamplingTerakhir.tanggal);
    const hariSamplingKeSekarang = toDays(dataSamplingTerakhir.tanggal, hariIni);
    if (hariTebarKeSampling > 0) {
      const lajuPerHari = (dataSamplingTerakhir.berat_rata_rata_gram - awal) / hariTebarKeSampling;
      if (lajuPerHari > 0 && hariSamplingKeSekarang >= 0) {
        return dataSamplingTerakhir.berat_rata_rata_gram + lajuPerHari * hariSamplingKeSekarang;
      }
    }
    return dataSamplingTerakhir.berat_rata_rata_gram;
  }

  const preset = jenisKomoditas ? getKomoditasPreset(jenisKomoditas) : null;
  const targetBobot = preset?.targetBobotGram;
  const masaPanenHari = preset?.masaPanenHari;
  if (!targetBobot || !masaPanenHari) return awal;

  const hariBerjalan = toDays(tanggalTebar, hariIni);
  const progresWaktu = Math.min(Math.max(hariBerjalan / masaPanenHari, 0), 1);
  return awal + (targetBobot - awal) * progresWaktu;
}

// ---------- Kalkulator pakan alternatif ----------

/**
 * Membandingkan biaya pakan campuran (pelet + alternatif) terhadap baseline 100% pelet,
 * berdasarkan rasio kombinasi persenAlternatif (0-100). Mengembalikan kebutuhan kg & biaya
 * masing-masing jenis pakan per hari, serta penghematan harian dan bulanan (30 hari).
 */
export function hitungPakanAlternatif({
  totalPakanKgHarian,
  persenAlternatif,
  hargaPeletPerKg,
  hargaAlternatifPerKg,
}) {
  const totalKg = totalPakanKgHarian || 0;
  const persenAlt = Math.min(Math.max(persenAlternatif || 0, 0), 100);
  const persenPelet = 100 - persenAlt;
  const hargaPelet = hargaPeletPerKg || 0;
  const hargaAlternatif = hargaAlternatifPerKg || 0;

  const kebutuhanPeletKg = totalKg * (persenPelet / 100);
  const kebutuhanAlternatifKg = totalKg * (persenAlt / 100);

  const biayaPeletHarian = kebutuhanPeletKg * hargaPelet;
  const biayaAlternatifHarian = kebutuhanAlternatifKg * hargaAlternatif;
  const totalBiayaCampuranHarian = biayaPeletHarian + biayaAlternatifHarian;

  const baselineBiayaPeletMurniHarian = totalKg * hargaPelet;
  const penghematanHarian = baselineBiayaPeletMurniHarian - totalBiayaCampuranHarian;

  return {
    kebutuhanPeletKg,
    kebutuhanAlternatifKg,
    biayaPeletHarian,
    biayaAlternatifHarian,
    totalBiayaCampuranHarian,
    baselineBiayaPeletMurniHarian,
    penghematanHarian,
    penghematanBulanan: penghematanHarian * 30,
  };
}

// ---------- Kalkulator analisis harga jual & pasaran ----------

const MARGIN_HARGA_MINIMUM = 0.2;
const MARGIN_HARGA_IDEAL = 0.4;

/**
 * Rekomendasi harga jual berdasarkan modal produksi (biaya pakan + biaya lain)
 * dan total biomassa/hasil panen (kg). BEP per kg dipakai sebagai dasar margin:
 * Harga Minimum Anti-Rugi = BEP + 20%, Harga Jual Ideal = BEP + 40%.
 * Benchmark harga pasaran diambil dari preset jenisKomoditas bila tersedia.
 */
export function hitungRekomendasiHargaJual(totalModal, totalBiomassKg, jenisKomoditas = null) {
  const bepPerKg = hitungHPPPerKg(totalModal, totalBiomassKg);
  const preset = jenisKomoditas ? getKomoditasPreset(jenisKomoditas) : null;

  return {
    bepPerKg,
    hargaMinimumAntiRugi: bepPerKg != null ? bepPerKg * (1 + MARGIN_HARGA_MINIMUM) : null,
    hargaJualIdeal: bepPerKg != null ? bepPerKg * (1 + MARGIN_HARGA_IDEAL) : null,
    benchmarkPasaranPerKg: preset?.hargaPasaranRataRata ?? null,
  };
}

// ---------- Kualitas air & smart alert ----------

const DOSIS_DOLOMIT_GRAM_PER_M3 = 25;

/**
 * Analisa parameter air (pH, suhu, kejernihan) dan hasilkan level status
 * beserta daftar alert terstruktur (pesan + rekomendasi aksi singkat siap
 * dipakai sebagai label tombol "Sudah [rekomendasi]" & disimpan ke
 * tabel water_alerts):
 * - pH < 6.5: air asam, sarankan penambahan Dolomit (dosis dihitung dari
 *   volumeAirM3 bila tersedia, ±25 gram/m3).
 * - pH > 8.5: air basa, sarankan pergantian air 20%.
 * - Kejernihan 'Keruh': naikkan level ke minimal waspada, sarankan sifon dasar kolam.
 */
export function analisaKualitasAir({ phAir = null, suhu = null, kejernihan = null, volumeAirM3 = null } = {}) {
  const alerts = [];
  let level = 'aman';

  if (phAir != null) {
    if (phAir < 6.5) {
      const dosisGram = volumeAirM3 > 0 ? Math.round(volumeAirM3 * DOSIS_DOLOMIT_GRAM_PER_M3) : null;
      alerts.push({
        kode: 'ph_asam',
        pesan:
          dosisGram != null
            ? `Air Asam! Sarankan penambahan Dolomit ±${dosisGram} gram.`
            : 'Air Asam! Sarankan penambahan Dolomit.',
        rekomendasi: 'Beri Dolomit',
      });
      level = 'bahaya';
    } else if (phAir > 8.5) {
      alerts.push({
        kode: 'ph_basa',
        pesan: 'Air Basa! Sarankan pergantian air 20%.',
        rekomendasi: 'Ganti Air 20%',
      });
      level = 'bahaya';
    } else if (phAir < 6.8 || phAir > 8.2) {
      level = level === 'bahaya' ? level : 'waspada';
    }
  }

  if (kejernihan === 'Keruh') {
    alerts.push({
      kode: 'keruh',
      pesan: 'Air Keruh! Perhatikan sisa pakan & lakukan sifon dasar kolam.',
      rekomendasi: 'Sifon Kolam',
    });
    level = level === 'bahaya' ? level : 'waspada';
  } else if (kejernihan === 'Agak Keruh') {
    level = level === 'bahaya' ? level : 'waspada';
  }

  const label = level === 'bahaya' ? 'Kualitas Air Bahaya' : level === 'waspada' ? 'Kualitas Air Waspada' : 'Kualitas Air Aman';

  return { level, label, alerts, phAir, suhu, kejernihan };
}

/**
 * Status posisi harga pasaran terhadap analisis BEP/harga ideal:
 * 'rugi' (pasaran < BEP), 'untung_tinggi' (pasaran > harga ideal),
 * selebihnya 'margin_tipis'. Null bila data belum cukup.
 */
export function tentukanStatusHargaPasaran(hargaPasaran, { bepPerKg, hargaJualIdeal } = {}) {
  if (hargaPasaran == null || bepPerKg == null) return null;
  if (hargaPasaran < bepPerKg) return 'rugi';
  if (hargaJualIdeal != null && hargaPasaran > hargaJualIdeal) return 'untung_tinggi';
  return 'margin_tipis';
}
