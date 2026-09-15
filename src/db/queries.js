import { getDatabase } from './schema';

// ---------- kolam ----------

export async function createKolam({
  namaKolam,
  targetPanenGram = null,
  status = 'aktif',
  panjang = null,
  lebar = null,
  diameter = null,
  tinggi = null,
  bentuk = null,
  tipeBudidaya = null,
  ketinggianAir = null,
  debitAir = null,
  jenisKomoditas = null,
  isBertingkat = false,
  jumlahTingkat = null,
  jumlahBoxPerTingkat = null,
  sistemAerasi = null,
  lokasiKolam = 'Outdoor',
}) {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO kolam
      (nama_kolam, target_panen_gram, status, panjang, lebar, diameter, tinggi, bentuk, tipe_budidaya, ketinggian_air, debit_air,
       jenis_komoditas, is_bertingkat, jumlah_tingkat, jumlah_box_per_tingkat, sistem_aerasi, lokasi_kolam)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    namaKolam,
    targetPanenGram,
    status,
    panjang,
    lebar,
    diameter,
    tinggi,
    bentuk,
    tipeBudidaya,
    ketinggianAir,
    debitAir,
    jenisKomoditas,
    isBertingkat ? 1 : 0,
    jumlahTingkat,
    jumlahBoxPerTingkat,
    sistemAerasi,
    lokasiKolam
  );
  return result.lastInsertRowId;
}

export async function getAllKolam() {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM kolam ORDER BY id DESC');
}

export async function getKolamById(id) {
  const db = getDatabase();
  return db.getFirstAsync('SELECT * FROM kolam WHERE id = ?', id);
}

export async function updateKolam(id, {
  namaKolam,
  targetPanenGram,
  status,
  panjang = null,
  lebar = null,
  diameter = null,
  tinggi = null,
  bentuk = null,
  tipeBudidaya = null,
  ketinggianAir = null,
  debitAir = null,
  jenisKomoditas = null,
  isBertingkat = false,
  jumlahTingkat = null,
  jumlahBoxPerTingkat = null,
  sistemAerasi = null,
  lokasiKolam = 'Outdoor',
}) {
  const db = getDatabase();
  const result = await db.runAsync(
    `UPDATE kolam
     SET nama_kolam = ?, target_panen_gram = ?, status = ?,
         panjang = ?, lebar = ?, diameter = ?, tinggi = ?, bentuk = ?, tipe_budidaya = ?, ketinggian_air = ?, debit_air = ?,
         jenis_komoditas = ?, is_bertingkat = ?, jumlah_tingkat = ?, jumlah_box_per_tingkat = ?, sistem_aerasi = ?, lokasi_kolam = ?
     WHERE id = ?`,
    namaKolam,
    targetPanenGram,
    status,
    panjang,
    lebar,
    diameter,
    tinggi,
    bentuk,
    tipeBudidaya,
    ketinggianAir,
    debitAir,
    jenisKomoditas,
    isBertingkat ? 1 : 0,
    jumlahTingkat,
    jumlahBoxPerTingkat,
    sistemAerasi,
    lokasiKolam,
    id
  );
  return result.changes;
}

export async function deleteKolam(id) {
  const db = getDatabase();
  const result = await db.runAsync('DELETE FROM kolam WHERE id = ?', id);
  return result.changes;
}

// Soft delete: kolam disembunyikan dari dashboard utama tapi riwayat tetap tersimpan.
export async function archiveKolam(id) {
  const db = getDatabase();
  const result = await db.runAsync("UPDATE kolam SET status = 'archived' WHERE id = ?", id);
  return result.changes;
}

export async function restoreKolam(id) {
  const db = getDatabase();
  const result = await db.runAsync("UPDATE kolam SET status = 'aktif' WHERE id = ?", id);
  return result.changes;
}

// ---------- populasi_log ----------

export async function createPopulasiLog({
  idKolam,
  tanggalTebar,
  jumlahBibit,
  ukuranBibitCm = null,
  bobotAwalGram = null,
  idPenjualBibit = null,
}) {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO populasi_log
      (id_kolam, tanggal_tebar, jumlah_bibit, ukuran_bibit_cm, bobot_awal_gram, id_penjual_bibit)
     VALUES (?, ?, ?, ?, ?, ?)`,
    idKolam,
    tanggalTebar,
    jumlahBibit,
    ukuranBibitCm,
    bobotAwalGram,
    idPenjualBibit
  );
  return result.lastInsertRowId;
}

export async function getPopulasiLogByKolam(idKolam) {
  const db = getDatabase();
  return db.getAllAsync(
    'SELECT * FROM populasi_log WHERE id_kolam = ? ORDER BY tanggal_tebar DESC',
    idKolam
  );
}

export async function getPopulasiLogById(id) {
  const db = getDatabase();
  return db.getFirstAsync('SELECT * FROM populasi_log WHERE id = ?', id);
}

export async function updatePopulasiLog(id, {
  tanggalTebar,
  jumlahBibit,
  ukuranBibitCm,
  bobotAwalGram,
  idPenjualBibit,
}) {
  const db = getDatabase();
  const result = await db.runAsync(
    `UPDATE populasi_log
     SET tanggal_tebar = ?, jumlah_bibit = ?, ukuran_bibit_cm = ?, bobot_awal_gram = ?, id_penjual_bibit = ?
     WHERE id = ?`,
    tanggalTebar,
    jumlahBibit,
    ukuranBibitCm,
    bobotAwalGram,
    idPenjualBibit,
    id
  );
  return result.changes;
}

export async function deletePopulasiLog(id) {
  const db = getDatabase();
  const result = await db.runAsync('DELETE FROM populasi_log WHERE id = ?', id);
  return result.changes;
}

export async function getAllPopulasiLog() {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM populasi_log ORDER BY tanggal_tebar DESC');
}

// ---------- pakan_log ----------

export async function createPakanLog({ idKolam, tanggal, jenisPakan = null, jumlahKg, biaya = null }) {
  const db = getDatabase();
  const result = await db.runAsync(
    'INSERT INTO pakan_log (id_kolam, tanggal, jenis_pakan, jumlah_kg, biaya) VALUES (?, ?, ?, ?, ?)',
    idKolam,
    tanggal,
    jenisPakan,
    jumlahKg,
    biaya
  );
  return result.lastInsertRowId;
}

export async function getPakanLogByKolam(idKolam) {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM pakan_log WHERE id_kolam = ? ORDER BY tanggal DESC', idKolam);
}

export async function getAllPakanLog() {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM pakan_log ORDER BY tanggal DESC');
}

export async function getPakanLogById(id) {
  const db = getDatabase();
  return db.getFirstAsync('SELECT * FROM pakan_log WHERE id = ?', id);
}

export async function updatePakanLog(id, { tanggal, jenisPakan, jumlahKg, biaya }) {
  const db = getDatabase();
  const result = await db.runAsync(
    'UPDATE pakan_log SET tanggal = ?, jenis_pakan = ?, jumlah_kg = ?, biaya = ? WHERE id = ?',
    tanggal,
    jenisPakan,
    jumlahKg,
    biaya,
    id
  );
  return result.changes;
}

export async function deletePakanLog(id) {
  const db = getDatabase();
  const result = await db.runAsync('DELETE FROM pakan_log WHERE id = ?', id);
  return result.changes;
}

// ---------- air_log ----------

export async function createAirLog({
  idKolam,
  tanggal,
  phAir = null,
  suhu = null,
  kejernihan = null,
  kondisiCuaca = null,
  tindakan = null,
}) {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO air_log (id_kolam, tanggal, ph_air, suhu, kejernihan, kondisi_cuaca, tindakan)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    idKolam,
    tanggal,
    phAir,
    suhu,
    kejernihan,
    kondisiCuaca,
    tindakan
  );
  return result.lastInsertRowId;
}

export async function getAirLogByKolam(idKolam) {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM air_log WHERE id_kolam = ? ORDER BY tanggal DESC', idKolam);
}

export async function getAllAirLog() {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM air_log ORDER BY tanggal DESC');
}

export async function getAirLogById(id) {
  const db = getDatabase();
  return db.getFirstAsync('SELECT * FROM air_log WHERE id = ?', id);
}

export async function updateAirLog(id, { tanggal, phAir, suhu, kejernihan, kondisiCuaca, tindakan }) {
  const db = getDatabase();
  const result = await db.runAsync(
    `UPDATE air_log
     SET tanggal = ?, ph_air = ?, suhu = ?, kejernihan = ?, kondisi_cuaca = ?, tindakan = ?
     WHERE id = ?`,
    tanggal,
    phAir,
    suhu,
    kejernihan,
    kondisiCuaca,
    tindakan,
    id
  );
  return result.changes;
}

export async function deleteAirLog(id) {
  const db = getDatabase();
  const result = await db.runAsync('DELETE FROM air_log WHERE id = ?', id);
  return result.changes;
}

// ---------- penjualan ----------

export async function createPenjualan({
  idKolam,
  namaPembeli = null,
  kontakPembeli = null,
  totalKg,
  hargaPerKg,
  statusBayar = 'belum_lunas',
  tanggal,
}) {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO penjualan
      (id_kolam, nama_pembeli, kontak_pembeli, total_kg, harga_per_kg, status_bayar, tanggal)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    idKolam,
    namaPembeli,
    kontakPembeli,
    totalKg,
    hargaPerKg,
    statusBayar,
    tanggal
  );
  return result.lastInsertRowId;
}

export async function getPenjualanByKolam(idKolam) {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM penjualan WHERE id_kolam = ? ORDER BY tanggal DESC', idKolam);
}

export async function getAllPenjualan() {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM penjualan ORDER BY tanggal DESC');
}

export async function getPenjualanById(id) {
  const db = getDatabase();
  return db.getFirstAsync('SELECT * FROM penjualan WHERE id = ?', id);
}

export async function updatePenjualan(id, {
  namaPembeli,
  kontakPembeli,
  totalKg,
  hargaPerKg,
  statusBayar,
  tanggal,
}) {
  const db = getDatabase();
  const result = await db.runAsync(
    `UPDATE penjualan
     SET nama_pembeli = ?, kontak_pembeli = ?, total_kg = ?, harga_per_kg = ?, status_bayar = ?, tanggal = ?
     WHERE id = ?`,
    namaPembeli,
    kontakPembeli,
    totalKg,
    hargaPerKg,
    statusBayar,
    tanggal,
    id
  );
  return result.changes;
}

export async function deletePenjualan(id) {
  const db = getDatabase();
  const result = await db.runAsync('DELETE FROM penjualan WHERE id = ?', id);
  return result.changes;
}

// ---------- stok_gudang ----------

export async function createStok({ namaBarang, jumlahStok = 0, satuan = null, batasMinimal = null }) {
  const db = getDatabase();
  const result = await db.runAsync(
    'INSERT INTO stok_gudang (nama_barang, jumlah_stok, satuan, batas_minimal) VALUES (?, ?, ?, ?)',
    namaBarang,
    jumlahStok,
    satuan,
    batasMinimal
  );
  return result.lastInsertRowId;
}

export async function getAllStok() {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM stok_gudang ORDER BY nama_barang ASC');
}

export async function getStokById(id) {
  const db = getDatabase();
  return db.getFirstAsync('SELECT * FROM stok_gudang WHERE id = ?', id);
}

export async function updateStok(id, { namaBarang, jumlahStok, satuan, batasMinimal }) {
  const db = getDatabase();
  const result = await db.runAsync(
    'UPDATE stok_gudang SET nama_barang = ?, jumlah_stok = ?, satuan = ?, batas_minimal = ? WHERE id = ?',
    namaBarang,
    jumlahStok,
    satuan,
    batasMinimal,
    id
  );
  return result.changes;
}

export async function deleteStok(id) {
  const db = getDatabase();
  const result = await db.runAsync('DELETE FROM stok_gudang WHERE id = ?', id);
  return result.changes;
}

// ---------- kematian_konsumsi_log ----------

export async function createKematianKonsumsiLog({
  idKolam,
  tanggal,
  jumlahMati = 0,
  jumlahKonsumsi = 0,
  keterangan = null,
}) {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO kematian_konsumsi_log (id_kolam, tanggal, jumlah_mati, jumlah_konsumsi, keterangan)
     VALUES (?, ?, ?, ?, ?)`,
    idKolam,
    tanggal,
    jumlahMati,
    jumlahKonsumsi,
    keterangan
  );
  return result.lastInsertRowId;
}

export async function getKematianKonsumsiLogByKolam(idKolam) {
  const db = getDatabase();
  return db.getAllAsync(
    'SELECT * FROM kematian_konsumsi_log WHERE id_kolam = ? ORDER BY tanggal DESC',
    idKolam
  );
}

// ---------- sampling_log ----------

export async function createSamplingLog({ idKolam, tanggal, beratRataRataGram }) {
  const db = getDatabase();
  const result = await db.runAsync(
    'INSERT INTO sampling_log (id_kolam, tanggal, berat_rata_rata_gram) VALUES (?, ?, ?)',
    idKolam,
    tanggal,
    beratRataRataGram
  );
  return result.lastInsertRowId;
}

export async function getSamplingLogByKolam(idKolam) {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM sampling_log WHERE id_kolam = ? ORDER BY tanggal DESC', idKolam);
}

// ---------- grading_log ----------

export async function createGradingLog({
  idKolamAsal,
  idKolamTujuan = null,
  tanggal,
  jumlahEkor,
  ukuran = null,
}) {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO grading_log (id_kolam_asal, id_kolam_tujuan, tanggal, jumlah_ekor, ukuran)
     VALUES (?, ?, ?, ?, ?)`,
    idKolamAsal,
    idKolamTujuan,
    tanggal,
    jumlahEkor,
    ukuran
  );
  return result.lastInsertRowId;
}

export async function getGradingLogByKolamAsal(idKolamAsal) {
  const db = getDatabase();
  return db.getAllAsync(
    'SELECT * FROM grading_log WHERE id_kolam_asal = ? ORDER BY tanggal DESC',
    idKolamAsal
  );
}

// ---------- penjual_bibit ----------

export async function createPenjualBibit({
  namaPenjual,
  alamat = null,
  kontak = null,
  isRekomended = 0,
  catatan = null,
}) {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO penjual_bibit (nama_penjual, alamat, kontak, is_rekomended, catatan)
     VALUES (?, ?, ?, ?, ?)`,
    namaPenjual,
    alamat,
    kontak,
    isRekomended ? 1 : 0,
    catatan
  );
  return result.lastInsertRowId;
}

export async function getAllPenjualBibit() {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM penjual_bibit ORDER BY nama_penjual ASC');
}

export async function updatePenjualBibit(id, { namaPenjual, alamat, kontak, isRekomended, catatan }) {
  const db = getDatabase();
  const result = await db.runAsync(
    `UPDATE penjual_bibit
     SET nama_penjual = ?, alamat = ?, kontak = ?, is_rekomended = ?, catatan = ?
     WHERE id = ?`,
    namaPenjual,
    alamat,
    kontak,
    isRekomended ? 1 : 0,
    catatan,
    id
  );
  return result.changes;
}

export async function deletePenjualBibit(id) {
  const db = getDatabase();
  const result = await db.runAsync('DELETE FROM penjual_bibit WHERE id = ?', id);
  return result.changes;
}

// ---------- inventory_alat ----------

export async function createInventoryAlat({
  namaAlat,
  hargaBeli = null,
  tanggalBeli = null,
  kondisi = 'baik',
  biayaPerbaikan = null,
}) {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO inventory_alat (nama_alat, harga_beli, tanggal_beli, kondisi, biaya_perbaikan)
     VALUES (?, ?, ?, ?, ?)`,
    namaAlat,
    hargaBeli,
    tanggalBeli,
    kondisi,
    biayaPerbaikan
  );
  return result.lastInsertRowId;
}

export async function getAllInventoryAlat() {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM inventory_alat ORDER BY nama_alat ASC');
}

export async function updateInventoryAlat(id, { namaAlat, hargaBeli, tanggalBeli, kondisi, biayaPerbaikan }) {
  const db = getDatabase();
  const result = await db.runAsync(
    `UPDATE inventory_alat
     SET nama_alat = ?, harga_beli = ?, tanggal_beli = ?, kondisi = ?, biaya_perbaikan = ?
     WHERE id = ?`,
    namaAlat,
    hargaBeli,
    tanggalBeli,
    kondisi,
    biayaPerbaikan,
    id
  );
  return result.changes;
}

export async function deleteInventoryAlat(id) {
  const db = getDatabase();
  const result = await db.runAsync('DELETE FROM inventory_alat WHERE id = ?', id);
  return result.changes;
}

// ---------- pengeluaran_lain ----------

export async function createPengeluaranLain({ kategori, jumlahBiaya, tanggal, keterangan = null }) {
  const db = getDatabase();
  const result = await db.runAsync(
    'INSERT INTO pengeluaran_lain (kategori, jumlah_biaya, tanggal, keterangan) VALUES (?, ?, ?, ?)',
    kategori,
    jumlahBiaya,
    tanggal,
    keterangan
  );
  return result.lastInsertRowId;
}

export async function getAllPengeluaranLain() {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM pengeluaran_lain ORDER BY tanggal DESC');
}

// ---------- molting_log ----------

export async function createMoltingLog({
  idKolam,
  nomorBox = null,
  tanggalMolting,
  statusCangkang,
  catatan = null,
}) {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO molting_log (id_kolam, nomor_box, tanggal_molting, status_cangkang, catatan)
     VALUES (?, ?, ?, ?, ?)`,
    idKolam,
    nomorBox,
    tanggalMolting,
    statusCangkang,
    catatan
  );
  return result.lastInsertRowId;
}

export async function getMoltingLogByKolam(idKolam) {
  const db = getDatabase();
  return db.getAllAsync(
    'SELECT * FROM molting_log WHERE id_kolam = ? ORDER BY tanggal_molting DESC',
    idKolam
  );
}

// ---------- aerator_log ----------

export async function createAeratorLog({
  idKolam,
  tanggal,
  statusAerator = 'Normal',
  nilaiDoPpm = null,
  suhuCelsius = null,
}) {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO aerator_log (id_kolam, tanggal, status_aerator, nilai_do_ppm, suhu_celsius)
     VALUES (?, ?, ?, ?, ?)`,
    idKolam,
    tanggal,
    statusAerator,
    nilaiDoPpm,
    suhuCelsius
  );
  return result.lastInsertRowId;
}

export async function getAeratorLogByKolam(idKolam) {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM aerator_log WHERE id_kolam = ? ORDER BY tanggal DESC', idKolam);
}

export async function getAllAeratorLog() {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM aerator_log ORDER BY tanggal DESC');
}

// ---------- profil_user ----------

export async function getProfilUser() {
  const db = getDatabase();
  return db.getFirstAsync('SELECT * FROM profil_user WHERE id = 1');
}

export async function updateProfilUser({ namaPanggilan = null, namaPeternakan = null, fotoProfilUri = null }) {
  const db = getDatabase();
  const result = await db.runAsync(
    'UPDATE profil_user SET nama_panggilan = ?, nama_peternakan = ?, foto_profil_uri = ? WHERE id = 1',
    namaPanggilan,
    namaPeternakan,
    fotoProfilUri
  );
  return result.changes;
}

// ---------- harga_pasaran_lokal ----------

export async function getHargaPasaranLokal(jenisKomoditas) {
  const db = getDatabase();
  return db.getFirstAsync(
    'SELECT * FROM harga_pasaran_lokal WHERE jenis_komoditas = ?',
    jenisKomoditas
  );
}

export async function setHargaPasaranLokal(jenisKomoditas, hargaPerKg) {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO harga_pasaran_lokal (jenis_komoditas, harga_per_kg, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(jenis_komoditas) DO UPDATE SET harga_per_kg = excluded.harga_per_kg, updated_at = excluded.updated_at`,
    jenisKomoditas,
    hargaPerKg,
    new Date().toISOString()
  );
  return result.changes;
}

// ---------- daily_checklist ----------

export async function getDailyChecklistByKolamAndTanggal(idKolam, tanggal) {
  const db = getDatabase();
  return db.getAllAsync(
    'SELECT * FROM daily_checklist WHERE id_kolam = ? AND tanggal = ?',
    idKolam,
    tanggal
  );
}

/**
 * Tandai satu sesi pakan (Pagi/Sore/Malam) selesai hari ini: simpan
 * timestamp jam saat ini + realisasi kg. Upsert per (id_kolam, tanggal,
 * sesi_pakan) supaya menekan checkbox yang sama dua kali hanya
 * memperbarui data, bukan menduplikasi baris.
 */
export async function upsertDailyChecklist({ idKolam, tanggal, sesiPakan, jumlahKg }) {
  const db = getDatabase();
  const existing = await db.getFirstAsync(
    'SELECT * FROM daily_checklist WHERE id_kolam = ? AND tanggal = ? AND sesi_pakan = ?',
    idKolam,
    tanggal,
    sesiPakan
  );
  const waktuSelesai = new Date().toISOString();

  if (existing) {
    await db.runAsync(
      'UPDATE daily_checklist SET is_completed = 1, waktu_selesai = ?, jumlah_kg = ? WHERE id = ?',
      waktuSelesai,
      jumlahKg,
      existing.id
    );
    return existing.id;
  }

  const result = await db.runAsync(
    `INSERT INTO daily_checklist (id_kolam, tanggal, sesi_pakan, is_completed, waktu_selesai, jumlah_kg)
     VALUES (?, ?, ?, 1, ?, ?)`,
    idKolam,
    tanggal,
    sesiPakan,
    waktuSelesai,
    jumlahKg
  );
  return result.lastInsertRowId;
}

// ---------- water_alerts ----------

export async function createWaterAlert({ idKolam, tanggal, jenisAlert, pesan, rekomendasi = null }) {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT INTO water_alerts (id_kolam, tanggal, jenis_alert, pesan, rekomendasi, status, waktu_dibuat)
     VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
    idKolam,
    tanggal,
    jenisAlert,
    pesan,
    rekomendasi,
    new Date().toISOString()
  );
  return result.lastInsertRowId;
}

export async function getWaterAlertsByKolam(idKolam) {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM water_alerts WHERE id_kolam = ? ORDER BY waktu_dibuat DESC', idKolam);
}

export async function resolveWaterAlert(id) {
  const db = getDatabase();
  const result = await db.runAsync(
    "UPDATE water_alerts SET status = 'Resolved', waktu_resolved = ? WHERE id = ?",
    new Date().toISOString(),
    id
  );
  return result.changes;
}

// ---------- custom_tips ----------

export async function getAllCustomTips() {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM custom_tips ORDER BY created_at DESC');
}

export async function createCustomTip({ judul, kategori, sumber = null, isi }) {
  const db = getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO custom_tips (judul, kategori, sumber, isi, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    judul,
    kategori,
    sumber,
    isi,
    now,
    now
  );
  return result.lastInsertRowId;
}

export async function updateCustomTip(id, { judul, kategori, sumber = null, isi }) {
  const db = getDatabase();
  const result = await db.runAsync(
    'UPDATE custom_tips SET judul = ?, kategori = ?, sumber = ?, isi = ?, updated_at = ? WHERE id = ?',
    judul,
    kategori,
    sumber,
    isi,
    new Date().toISOString(),
    id
  );
  return result.changes;
}

export async function deleteCustomTip(id) {
  const db = getDatabase();
  const result = await db.runAsync('DELETE FROM custom_tips WHERE id = ?', id);
  await db.runAsync("DELETE FROM tip_favorites WHERE tip_type = 'custom' AND tip_id = ?", String(id));
  return result.changes;
}

// ---------- quotes (Nasihat & Kutipan Peternak) ----------

export async function getAllQuotes() {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM quotes ORDER BY created_at DESC');
}

export async function createQuote({ kalimat, sumber = null }) {
  const db = getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO quotes (kalimat, sumber, created_at, updated_at) VALUES (?, ?, ?, ?)',
    kalimat,
    sumber,
    now,
    now
  );
  return result.lastInsertRowId;
}

export async function updateQuote(id, { kalimat, sumber = null }) {
  const db = getDatabase();
  const result = await db.runAsync(
    'UPDATE quotes SET kalimat = ?, sumber = ?, updated_at = ? WHERE id = ?',
    kalimat,
    sumber,
    new Date().toISOString(),
    id
  );
  return result.changes;
}

export async function deleteQuote(id) {
  const db = getDatabase();
  const result = await db.runAsync('DELETE FROM quotes WHERE id = ?', id);
  return result.changes;
}

// ---------- tip_favorites ----------

export async function getAllTipFavorites() {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM tip_favorites');
}

export async function addTipFavorite(tipType, tipId) {
  const db = getDatabase();
  const result = await db.runAsync(
    'INSERT OR IGNORE INTO tip_favorites (tip_type, tip_id, created_at) VALUES (?, ?, ?)',
    tipType,
    String(tipId),
    new Date().toISOString()
  );
  return result.changes;
}

export async function removeTipFavorite(tipType, tipId) {
  const db = getDatabase();
  const result = await db.runAsync(
    'DELETE FROM tip_favorites WHERE tip_type = ? AND tip_id = ?',
    tipType,
    String(tipId)
  );
  return result.changes;
}
