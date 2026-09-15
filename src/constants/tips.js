export const TIPS_KATEGORI = [
  { id: 'air_probiotik', nama: 'Perawatan Air & Probiotik', emoji: '🧪' },
  { id: 'pakan_fcr', nama: 'Manajemen Pakan & FCR', emoji: '🐟' },
  { id: 'penyakit', nama: 'Pencegahan & Pengobatan Penyakit', emoji: '💊' },
  { id: 'konstruksi', nama: 'Konstruksi & Persiapan Kolam', emoji: '🏗️' },
  { id: 'pengalaman', nama: 'Nasihat & Pengalaman', emoji: '🗣️' },
];

export function getKategoriTips(id) {
  return TIPS_KATEGORI.find((k) => k.id === id) || null;
}

// Sumber tips: bawaan aplikasi (read-only) vs buatan user (bisa diedit/dihapus).
export const TIP_SOURCE_BUILTIN = 'builtin';
export const TIP_SOURCE_CUSTOM = 'custom';

export const TIPS_LIST = [
  {
    id: 'fermentasi-molase-ragi',
    kategori: 'air_probiotik',
    judul: 'Resep Fermentasi Molase & Ragi untuk Air Hijau/Floc',
    ringkasan: 'Bikin starter probiotik sendiri untuk memancing air hijau (fitoplankton) atau bioflok tanpa beli produk mahal.',
    isi:
      'Bahan: 1 liter molase/tetes tebu, 5 gram ragi roti (fermipan), 10 liter air bersih tanpa kaporit.\n\n' +
      '1. Larutkan molase ke dalam air, aduk rata.\n' +
      '2. Taburkan ragi, aduk perlahan, lalu tutup wadah tapi jangan rapat (beri celah udara).\n' +
      '3. Fermentasi 24-48 jam di tempat teduh sampai muncul busa dan bau asam-manis khas fermentasi.\n' +
      '4. Siramkan ke kolam pada pagi hari, dosis ± 1 liter larutan per 1-2 m³ air, ulangi setiap 3-5 hari.\n\n' +
      'Tips: hentikan pemberian jika air sudah cukup hijau/pekat (kecerahan 20-30 cm) agar oksigen malam hari tidak anjlok.',
  },
  {
    id: 'ph-drop-hujan',
    kategori: 'air_probiotik',
    judul: 'Penanganan pH Drop Saat Hujan',
    ringkasan: 'Air hujan bersifat asam dan bisa menurunkan pH kolam secara drastis dalam semalam. Begini cara mengantisipasinya.',
    isi:
      '1. Sebelum musim hujan, siapkan kapur dolomit atau kapur pertanian (CaCO₃/CaMg(CO₃)₂) sebagai stok darurat.\n' +
      '2. Saat hujan deras turun ke kolam terbuka, cek pH 1-2 jam setelah hujan reda.\n' +
      '3. Jika pH turun di bawah 6.5, taburkan kapur dolomit dosis ± 20-50 gram per m³ air, sebarkan merata di permukaan.\n' +
      '4. Nyalakan aerator/kincir ekstra untuk membantu mengaduk lapisan air atas yang lebih asam dengan air bawah.\n' +
      '5. Tunda pemberian pakan porsi besar sampai pH stabil kembali di 6.5-8.5, karena ikan stres akan malas makan.\n\n' +
      'Pencegahan jangka panjang: buat atap terpal/paranet parsial di atas kolam terpal supaya air hujan tidak langsung masuk dalam jumlah besar.',
  },
  {
    id: 'puasa-sebelum-kuras',
    kategori: 'pakan_fcr',
    judul: 'Teknik Puasa Ikan Sebelum Kuras',
    ringkasan: 'Memuasakan ikan sebelum kuras/panen mengurangi stres, muntah, dan kematian saat proses penanganan.',
    isi:
      '1. Hentikan pemberian pakan 12-24 jam sebelum jadwal kuras atau panen.\n' +
      '2. Tujuannya agar saluran pencernaan ikan kosong, sehingga ikan tidak muntah/stres berat saat ditangkap, disortir, atau dipindah.\n' +
      '3. Air kolam juga jadi lebih bersih karena tidak ada sisa pakan yang membusuk selama proses puasa.\n' +
      '4. Setelah kuras/panen selesai dan ikan sudah tenang di kolam baru (minimal 6-12 jam), baru berikan pakan lagi dengan porsi lebih sedikit dari biasanya.\n\n' +
      'Catatan: puasa maksimal 24 jam, jangan lebih, agar pertumbuhan tidak terganggu dan ikan tidak kanibal terutama untuk lele.',
  },
  {
    id: 'bibit-mengambang',
    kategori: 'pakan_fcr',
    judul: 'Trik Mengatasi Bibit Mengambang',
    ringkasan: 'Bibit yang mengambang/megap-megap di permukaan biasanya tanda stres, kurang oksigen, atau masalah swim bladder.',
    isi:
      '1. Cek dulu kadar oksigen terlarut (DO) dan suhu air — bibit sering mengambang saat DO rendah (subuh/malam) atau suhu air naik drastis siang hari.\n' +
      '2. Nyalakan aerator tambahan segera, terutama pada kepadatan tebar tinggi.\n' +
      '3. Jika air baru diisi/ganti air, pastikan sudah diendapkan minimal 24 jam dan pH sudah stabil sebelum bibit dimasukkan (proses aklimatisasi suhu & pH).\n' +
      '4. Periksa juga apakah ada gelembung udara di perut bibit (swim bladder disorder) — biasanya karena pakan terlalu banyak udara terperangkap atau kualitas air buruk; kurangi porsi pakan dan perbaiki kualitas air.\n' +
      '5. Pisahkan bibit yang lemah ke wadah karantina supaya tidak jadi sumber penyakit untuk yang sehat.',
  },
  {
    id: 'herbal-kumis-putih',
    kategori: 'penyakit',
    judul: 'Pengobatan Herbal Daun Pepaya & Garam Krosok untuk Kumis Putih/Aeromonas',
    ringkasan: 'Alternatif herbal murah untuk gejala kumis/sirip memutih akibat infeksi bakteri Aeromonas pada lele.',
    isi:
      'Bahan: 10-15 lembar daun pepaya tua, garam krosok (garam kasar non-yodium) secukupnya, air.\n\n' +
      '1. Tumbuk/rebus daun pepaya dengan sedikit air hingga layu dan keluar sarinya.\n' +
      '2. Campurkan air rebusan/sari daun pepaya ke kolam dengan dosis ± 1 genggam daun per m³ air.\n' +
      '3. Tambahkan garam krosok dosis ± 3-5 gram per liter air (khusus kolam/wadah karantina, bukan kolam besar) untuk membantu kerja osmoregulasi ikan yang sakit.\n' +
      '4. Ulangi selama 3 hari berturut-turut sambil pantau nafsu makan dan kondisi luka.\n' +
      '5. Kurangi padat tebar dan perbaiki kualitas air (ganti sebagian air, tambah aerasi) karena penyakit ini biasanya muncul saat air kotor dan ikan stres.\n\n' +
      'Catatan: jika gejala parah (luka melebar, banyak kematian mendadak), segera konsultasi ke penyuluh perikanan/dokter hewan ikan untuk penanganan antibiotik yang tepat.',
  },
  {
    id: 'sterilisasi-kolam-terpal-baru',
    kategori: 'konstruksi',
    judul: 'Sterilisasi Kolam Terpal Baru',
    ringkasan: 'Kolam terpal baru mengandung bau plastik dan zat kimia sisa produksi yang berbahaya untuk bibit jika tidak dibersihkan dulu.',
    isi:
      '1. Isi kolam terpal baru dengan air penuh, rendam selama 2-3 hari untuk melunturkan bau dan zat kimia dari terpal.\n' +
      '2. Buang air rendaman pertama, bilas dinding terpal, lalu isi ulang dengan air bersih.\n' +
      '3. Tambahkan kapur pertanian dosis ± 100-150 gram per m³ untuk menstabilkan pH dan membunuh bibit penyakit yang mungkin terbawa.\n' +
      '4. Diamkan air 5-7 hari agar plankton alami tumbuh (air mulai kehijauan), atau bantu dengan pupuk organik/probiotik agar prosesnya lebih cepat.\n' +
      '5. Cek pH (target 6.5-8.5) dan suhu sebelum bibit ditebar. Lakukan proses aklimatisasi bibit (samakan suhu kantong dengan air kolam) minimal 15-30 menit sebelum dilepas.',
  },
  {
    id: 'kepadatan-tebar-ideal',
    kategori: 'konstruksi',
    judul: 'Kepadatan Tebar Ideal per m³',
    ringkasan: 'Panduan umum padat tebar supaya pertumbuhan optimal dan risiko kematian akibat overcrowding lebih rendah.',
    isi:
      'Perkiraan kepadatan tebar bibit ukuran 5-7 cm per m³ air kolam (sesuaikan dengan sistem aerasi dan pergantian air):\n\n' +
      '• Lele (kolam terpal/tanah, aerasi standar): 100-200 ekor/m³\n' +
      '• Lele (bioflok, aerasi kuat): 150-300 ekor/m³\n' +
      '• Nila: 30-50 ekor/m³\n' +
      '• Gurame: 10-15 ekor/m³\n\n' +
      'Semakin tinggi padat tebar, semakin besar kebutuhan oksigen dan semakin cepat air kotor — pastikan sistem aerasi dan jadwal kuras/ganti air disesuaikan. Untuk pemula, lebih aman mulai dari batas bawah kisaran lalu naikkan bertahap di siklus berikutnya setelah terbiasa membaca kondisi kolam.',
  },
  {
    id: 'probiotik-rutin-bioflok',
    kategori: 'air_probiotik',
    judul: 'Jadwal Pemberian Probiotik Rutin untuk Sistem Bioflok',
    ringkasan: 'Konsistensi jadwal probiotik lebih penting daripada dosis besar sekali-sekali untuk menjaga floc tetap sehat.',
    isi:
      '1. Berikan probiotik (komersial atau hasil fermentasi sendiri) setiap 3-5 hari sekali, bukan menunggu air terlihat kotor.\n' +
      '2. Berikan pada pagi hari saat oksigen terlarut sedang tinggi, agar bakteri baik bisa berkembang optimal.\n' +
      '3. Pastikan sumber karbon (molase/tepung tapioka) juga diberikan seimbang dengan probiotik agar bakteri heterotrof bisa membentuk floc dengan baik (rasio C:N dijaga).\n' +
      '4. Amati warna dan bau air: floc yang sehat berwarna coklat kehijauan, tidak berbau busuk. Jika air mulai berbau menyengat, tambah aerasi dan kurangi pakan sementara.',
  },
  {
    id: 'fcr-efisien',
    kategori: 'pakan_fcr',
    judul: 'Cara Menghitung dan Menekan Angka FCR',
    ringkasan: 'FCR (Feed Conversion Ratio) yang tinggi berarti biaya pakan boros. Berikut cara menghitung dan menekannya.',
    isi:
      'FCR = Total pakan yang dihabiskan (kg) ÷ Total pertambahan berat ikan (kg).\n\n' +
      'Contoh: habiskan 100 kg pakan untuk menambah bobot ikan 80 kg → FCR = 1.25 (semakin kecil semakin efisien).\n\n' +
      'Cara menekan FCR:\n' +
      '1. Beri pakan sesuai porsi (3-5% dari biomassa per hari), jangan berlebihan karena sisa pakan justru mencemari air tanpa menambah bobot.\n' +
      '2. Beri pakan di waktu yang tepat (pagi & sore saat suhu air stabil) dan sebar merata agar semua ikan kebagian, mengurangi kompetisi dan pakan terbuang.\n' +
      '3. Jaga kualitas air tetap baik — ikan yang stres karena air jelek nafsu makannya turun dan konversi pakannya memburuk.\n' +
      '4. Lakukan sampling berat rutin (mingguan) untuk menyesuaikan dosis pakan dengan pertumbuhan aktual, jangan asal tebak.',
  },
];
