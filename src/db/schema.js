import * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'misterlele.db';

export const CREATE_TABLES_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS kolam (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_kolam TEXT NOT NULL,
  target_panen_gram REAL,
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'panen', 'kosong', 'archived')),
  panjang REAL,
  lebar REAL,
  diameter REAL,
  tinggi REAL,
  bentuk TEXT CHECK (bentuk IN ('Bundar', 'Persegi')),
  tipe_budidaya TEXT CHECK (tipe_budidaya IN ('Bioflok', 'Kolam Tanah', 'Terpal', 'Beton')),
  ketinggian_air REAL,
  debit_air REAL,
  jenis_komoditas TEXT,
  is_bertingkat INTEGER NOT NULL DEFAULT 0 CHECK (is_bertingkat IN (0, 1)),
  jumlah_tingkat INTEGER,
  jumlah_box_per_tingkat INTEGER,
  sistem_aerasi TEXT CHECK (sistem_aerasi IN ('Blower Sentral', 'Aerator per Box', 'Venturi', 'Tanpa Aerator'))
);

CREATE TABLE IF NOT EXISTS penjual_bibit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_penjual TEXT NOT NULL,
  alamat TEXT,
  kontak TEXT,
  is_rekomended INTEGER NOT NULL DEFAULT 0 CHECK (is_rekomended IN (0, 1)),
  catatan TEXT
);

CREATE TABLE IF NOT EXISTS populasi_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_kolam INTEGER NOT NULL REFERENCES kolam(id) ON DELETE CASCADE,
  tanggal_tebar TEXT NOT NULL,
  jumlah_bibit INTEGER NOT NULL,
  ukuran_bibit_cm REAL,
  bobot_awal_gram REAL,
  id_penjual_bibit INTEGER REFERENCES penjual_bibit(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS kematian_konsumsi_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_kolam INTEGER NOT NULL REFERENCES kolam(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL,
  jumlah_mati INTEGER NOT NULL DEFAULT 0,
  jumlah_konsumsi INTEGER NOT NULL DEFAULT 0,
  keterangan TEXT
);

CREATE TABLE IF NOT EXISTS sampling_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_kolam INTEGER NOT NULL REFERENCES kolam(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL,
  berat_rata_rata_gram REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS pakan_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_kolam INTEGER NOT NULL REFERENCES kolam(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL,
  jenis_pakan TEXT,
  jumlah_kg REAL NOT NULL,
  biaya REAL
);

CREATE TABLE IF NOT EXISTS stok_gudang (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_barang TEXT NOT NULL,
  jumlah_stok REAL NOT NULL DEFAULT 0,
  satuan TEXT,
  batas_minimal REAL
);

CREATE TABLE IF NOT EXISTS air_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_kolam INTEGER NOT NULL REFERENCES kolam(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL,
  ph_air REAL,
  suhu REAL,
  kondisi_cuaca TEXT,
  tindakan TEXT
);

CREATE TABLE IF NOT EXISTS grading_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_kolam_asal INTEGER NOT NULL REFERENCES kolam(id) ON DELETE CASCADE,
  id_kolam_tujuan INTEGER REFERENCES kolam(id) ON DELETE SET NULL,
  tanggal TEXT NOT NULL,
  jumlah_ekor INTEGER NOT NULL,
  ukuran TEXT
);

CREATE TABLE IF NOT EXISTS molting_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_kolam INTEGER NOT NULL REFERENCES kolam(id) ON DELETE CASCADE,
  nomor_box TEXT,
  tanggal_molting TEXT NOT NULL,
  status_cangkang TEXT NOT NULL CHECK (status_cangkang IN ('Lunak/Karantina', 'Mulai Mengkeras', 'Keras/Normal')),
  catatan TEXT
);

CREATE TABLE IF NOT EXISTS aerator_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_kolam INTEGER NOT NULL REFERENCES kolam(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL,
  status_aerator TEXT NOT NULL DEFAULT 'Normal' CHECK (status_aerator IN ('Normal', 'Maintenance', 'Rusak')),
  nilai_do_ppm REAL,
  suhu_celsius REAL
);

CREATE TABLE IF NOT EXISTS inventory_alat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_alat TEXT NOT NULL,
  harga_beli REAL,
  tanggal_beli TEXT,
  kondisi TEXT NOT NULL DEFAULT 'baik' CHECK (kondisi IN ('baik', 'rusak', 'perbaikan')),
  biaya_perbaikan REAL
);

CREATE TABLE IF NOT EXISTS penjualan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_kolam INTEGER NOT NULL REFERENCES kolam(id) ON DELETE CASCADE,
  nama_pembeli TEXT,
  kontak_pembeli TEXT,
  total_kg REAL NOT NULL,
  harga_per_kg REAL NOT NULL,
  status_bayar TEXT NOT NULL DEFAULT 'belum_lunas' CHECK (status_bayar IN ('lunas', 'belum_lunas', 'dp')),
  tanggal TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pengeluaran_lain (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kategori TEXT NOT NULL,
  jumlah_biaya REAL NOT NULL,
  tanggal TEXT NOT NULL,
  keterangan TEXT
);

CREATE TABLE IF NOT EXISTS profil_user (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  nama_panggilan TEXT,
  nama_peternakan TEXT,
  foto_profil_uri TEXT
);

INSERT OR IGNORE INTO profil_user (id) VALUES (1);

CREATE TABLE IF NOT EXISTS harga_pasaran_lokal (
  jenis_komoditas TEXT PRIMARY KEY,
  harga_per_kg REAL NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS daily_checklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_kolam INTEGER NOT NULL REFERENCES kolam(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL,
  sesi_pakan TEXT NOT NULL CHECK (sesi_pakan IN ('Pagi', 'Sore', 'Malam')),
  is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
  waktu_selesai TEXT,
  jumlah_kg REAL
);

CREATE TABLE IF NOT EXISTS water_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_kolam INTEGER NOT NULL REFERENCES kolam(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL,
  jenis_alert TEXT NOT NULL,
  pesan TEXT NOT NULL,
  rekomendasi TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Resolved')),
  waktu_dibuat TEXT,
  waktu_resolved TEXT
);

CREATE TABLE IF NOT EXISTS custom_tips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judul TEXT NOT NULL,
  kategori TEXT NOT NULL,
  sumber TEXT,
  isi TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kalimat TEXT NOT NULL,
  sumber TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tip_favorites (
  tip_type TEXT NOT NULL CHECK (tip_type IN ('builtin', 'custom')),
  tip_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (tip_type, tip_id)
);

CREATE INDEX IF NOT EXISTS idx_populasi_log_id_kolam ON populasi_log(id_kolam);
CREATE INDEX IF NOT EXISTS idx_kematian_konsumsi_log_id_kolam ON kematian_konsumsi_log(id_kolam);
CREATE INDEX IF NOT EXISTS idx_sampling_log_id_kolam ON sampling_log(id_kolam);
CREATE INDEX IF NOT EXISTS idx_pakan_log_id_kolam ON pakan_log(id_kolam);
CREATE INDEX IF NOT EXISTS idx_air_log_id_kolam ON air_log(id_kolam);
CREATE INDEX IF NOT EXISTS idx_grading_log_id_kolam_asal ON grading_log(id_kolam_asal);
CREATE INDEX IF NOT EXISTS idx_grading_log_id_kolam_tujuan ON grading_log(id_kolam_tujuan);
CREATE INDEX IF NOT EXISTS idx_penjualan_id_kolam ON penjualan(id_kolam);
CREATE INDEX IF NOT EXISTS idx_molting_log_id_kolam ON molting_log(id_kolam);
CREATE INDEX IF NOT EXISTS idx_aerator_log_id_kolam ON aerator_log(id_kolam);
CREATE INDEX IF NOT EXISTS idx_daily_checklist_id_kolam ON daily_checklist(id_kolam);
CREATE INDEX IF NOT EXISTS idx_water_alerts_id_kolam ON water_alerts(id_kolam);
`;

const KOLAM_NEW_COLUMNS = [
  { name: 'panjang', ddl: 'REAL' },
  { name: 'lebar', ddl: 'REAL' },
  { name: 'diameter', ddl: 'REAL' },
  { name: 'tinggi', ddl: 'REAL' },
  { name: 'bentuk', ddl: "TEXT CHECK (bentuk IN ('Bundar', 'Persegi'))" },
  { name: 'tipe_budidaya', ddl: "TEXT CHECK (tipe_budidaya IN ('Bioflok', 'Kolam Tanah', 'Terpal', 'Beton'))" },
  { name: 'ketinggian_air', ddl: 'REAL' },
  { name: 'debit_air', ddl: 'REAL' },
  { name: 'jenis_komoditas', ddl: 'TEXT' },
  { name: 'is_bertingkat', ddl: "INTEGER NOT NULL DEFAULT 0 CHECK (is_bertingkat IN (0, 1))" },
  { name: 'jumlah_tingkat', ddl: 'INTEGER' },
  { name: 'jumlah_box_per_tingkat', ddl: 'INTEGER' },
  {
    name: 'sistem_aerasi',
    ddl: "TEXT CHECK (sistem_aerasi IN ('Blower Sentral', 'Aerator per Box', 'Venturi', 'Tanpa Aerator'))",
  },
];

const AIR_LOG_NEW_COLUMNS = [
  { name: 'kejernihan', ddl: "TEXT CHECK (kejernihan IN ('Jernih', 'Agak Keruh', 'Keruh'))" },
];

async function migrateTableColumns(db, table, columns) {
  const existingColumns = await db.getAllAsync(`PRAGMA table_info(${table})`);
  const existingNames = new Set(existingColumns.map((c) => c.name));
  for (const column of columns) {
    if (!existingNames.has(column.name)) {
      await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column.name} ${column.ddl}`);
    }
  }
}

/**
 * SQLite tidak mendukung ALTER TABLE untuk mengubah CHECK constraint, jadi
 * status kolam 'archived' (ditambahkan setelah rilis awal) butuh rebuild
 * tabel kolam pada database lama yang constraint-nya belum memuat 'archived'.
 */
async function migrateKolamStatusArchived(db) {
  const tableInfo = await db.getFirstAsync(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'kolam'"
  );
  if (!tableInfo || tableInfo.sql.includes('archived')) {
    return;
  }

  const columns = await db.getAllAsync('PRAGMA table_info(kolam)');
  const columnNames = columns.map((c) => c.name).join(', ');

  await db.execAsync('PRAGMA foreign_keys = OFF;');
  try {
    await db.execAsync('BEGIN TRANSACTION;');
    await db.execAsync('ALTER TABLE kolam RENAME TO kolam_old_migration;');
    await db.execAsync(`
      CREATE TABLE kolam (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_kolam TEXT NOT NULL,
        target_panen_gram REAL,
        status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'panen', 'kosong', 'archived')),
        panjang REAL,
        lebar REAL,
        diameter REAL,
        tinggi REAL,
        bentuk TEXT CHECK (bentuk IN ('Bundar', 'Persegi')),
        tipe_budidaya TEXT CHECK (tipe_budidaya IN ('Bioflok', 'Kolam Tanah', 'Terpal', 'Beton')),
        ketinggian_air REAL,
        debit_air REAL,
        jenis_komoditas TEXT,
        is_bertingkat INTEGER NOT NULL DEFAULT 0 CHECK (is_bertingkat IN (0, 1)),
        jumlah_tingkat INTEGER,
        jumlah_box_per_tingkat INTEGER,
        sistem_aerasi TEXT CHECK (sistem_aerasi IN ('Blower Sentral', 'Aerator per Box', 'Venturi', 'Tanpa Aerator'))
      );
    `);
    await db.execAsync(`INSERT INTO kolam (${columnNames}) SELECT ${columnNames} FROM kolam_old_migration;`);
    await db.execAsync('DROP TABLE kolam_old_migration;');
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }
}

let dbInstance = null;

export async function initDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync(CREATE_TABLES_SQL);
  await migrateTableColumns(db, 'kolam', KOLAM_NEW_COLUMNS);
  await migrateTableColumns(db, 'air_log', AIR_LOG_NEW_COLUMNS);
  await migrateKolamStatusArchived(db);

  dbInstance = db;
  return dbInstance;
}

export function getDatabase() {
  if (!dbInstance) {
    throw new Error('Database has not been initialized. Call initDatabase() first.');
  }
  return dbInstance;
}
