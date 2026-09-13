export const KOMODITAS_PRESETS = {
  lele: {
    id: 'lele',
    nama: 'Lele',
    emoji: '🐟',
    kategori: 'ikan',
    masaPanenHari: 90,
    targetBobotGram: 110,
    padatTebarPerM3: 150,
    hargaPasaranRataRata: 22000,
  },
  nila_merah: {
    id: 'nila_merah',
    nama: 'Nila Merah',
    emoji: '🐟',
    kategori: 'ikan',
    masaPanenHari: 135,
    targetBobotGram: 250,
    padatTebarPerM3: 40,
    hargaPasaranRataRata: 35000,
  },
  nila_hitam: {
    id: 'nila_hitam',
    nama: 'Nila Hitam',
    emoji: '🐟',
    kategori: 'ikan',
    masaPanenHari: 135,
    targetBobotGram: 250,
    padatTebarPerM3: 40,
    hargaPasaranRataRata: 35000,
  },
  gurame: {
    id: 'gurame',
    nama: 'Gurame',
    emoji: '🐟',
    kategori: 'ikan',
    masaPanenHari: 330,
    targetBobotGram: 600,
    padatTebarPerM3: 12,
    hargaPasaranRataRata: 50000,
  },
  gurame_padang: {
    id: 'gurame_padang',
    nama: 'Gurame Padang',
    emoji: '🐟',
    kategori: 'ikan',
    masaPanenHari: 330,
    targetBobotGram: 600,
    padatTebarPerM3: 12,
    hargaPasaranRataRata: 50000,
  },
  patin: {
    id: 'patin',
    nama: 'Patin',
    emoji: '🐟',
    kategori: 'ikan',
    masaPanenHari: 165,
    targetBobotGram: 600,
    padatTebarPerM3: 25,
    hargaPasaranRataRata: 25000,
  },
  lobster_red_claw: {
    id: 'lobster_red_claw',
    nama: 'Lobster Red Claw',
    emoji: '🦞',
    kategori: 'lobster',
    catatan: 'Konsumsi Utama',
    masaPanenHari: 180,
    targetBobotGram: 90,
    padatTebarPerM3: 20,
    bisaMolting: true,
    hargaPasaranRataRata: 140000,
  },
  lobster_blue_claw: {
    id: 'lobster_blue_claw',
    nama: 'Lobster Blue Claw / Walkamin',
    emoji: '🦞',
    kategori: 'lobster',
    masaPanenHari: 210,
    targetBobotGram: 80,
    padatTebarPerM3: 15,
    bisaMolting: true,
    hargaPasaranRataRata: 140000,
  },
  lobster_papuan: {
    id: 'lobster_papuan',
    nama: 'Lobster Papuan / Yabby',
    emoji: '🦞',
    kategori: 'lobster',
    masaPanenHari: 240,
    targetBobotGram: 75,
    padatTebarPerM3: 15,
    bisaMolting: true,
    hargaPasaranRataRata: 140000,
  },
  custom: {
    id: 'custom',
    nama: 'Ikan Hias / Lainnya',
    emoji: '🐠',
    kategori: 'custom',
    isCustom: true,
    masaPanenHari: null,
    targetBobotGram: null,
    padatTebarPerM3: null,
    hargaPasaranRataRata: null,
  },
};

export const KOMODITAS_LIST = Object.values(KOMODITAS_PRESETS);

export function getKomoditasPreset(id) {
  return KOMODITAS_PRESETS[id] || null;
}

export function isKomoditasLobster(id) {
  return getKomoditasPreset(id)?.kategori === 'lobster';
}

export function isKomoditasCustom(id) {
  return getKomoditasPreset(id)?.isCustom === true;
}

export function formatKomoditasLabel(id) {
  const preset = getKomoditasPreset(id);
  if (!preset) return null;
  return `${preset.emoji} ${preset.nama}`;
}
