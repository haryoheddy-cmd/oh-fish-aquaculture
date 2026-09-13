import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { formatRupiah, formatTanggal, todayISODate } from './format';
import { buildKolamSummary } from './kolamSummary';
import {
  getAllKolam,
  getAllPakanLog,
  getAllPenjualan,
  getAllPengeluaranLain,
  getProfilUser,
} from '../db/queries';

const ALTERNATIF_KEYWORDS = ['maggot', 'azolla', 'rucah', 'cacing', 'bsf'];

function isJenisPakanAlternatif(jenisPakan) {
  if (!jenisPakan) return false;
  const lower = jenisPakan.toLowerCase();
  return ALTERNATIF_KEYWORDS.some((k) => lower.includes(k));
}

function isTanggalBulanIni(tanggal) {
  if (!tanggal) return false;
  const now = new Date();
  const bulanIni = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return String(tanggal).startsWith(bulanIni);
}

function namaBulanTahunIni() {
  return new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function escapeHtml(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, (c) => map[c]);
}

async function kumpulkanDataLaporan() {
  const [kolamList, pakanLogs, penjualanList, pengeluaranList, profil] = await Promise.all([
    getAllKolam(),
    getAllPakanLog(),
    getAllPenjualan(),
    getAllPengeluaranLain(),
    getProfilUser(),
  ]);

  const summaries = await Promise.all(kolamList.map(buildKolamSummary));

  const pakanBulanIni = pakanLogs.filter((p) => isTanggalBulanIni(p.tanggal));
  const penjualanBulanIni = penjualanList.filter((p) => isTanggalBulanIni(p.tanggal));
  const pengeluaranBulanIni = pengeluaranList.filter((p) => isTanggalBulanIni(p.tanggal));

  const biayaPelet = pakanBulanIni
    .filter((p) => !isJenisPakanAlternatif(p.jenis_pakan))
    .reduce((sum, p) => sum + (p.biaya || 0), 0);
  const biayaAlternatif = pakanBulanIni
    .filter((p) => isJenisPakanAlternatif(p.jenis_pakan))
    .reduce((sum, p) => sum + (p.biaya || 0), 0);
  const totalBiayaPakan = biayaPelet + biayaAlternatif;

  const totalPengeluaranLain = pengeluaranBulanIni.reduce((sum, p) => sum + p.jumlah_biaya, 0);
  const totalPengeluaran = totalBiayaPakan + totalPengeluaranLain;

  const totalKgPanen = penjualanBulanIni.reduce((sum, p) => sum + p.total_kg, 0);
  const totalOmsetPanen = penjualanBulanIni.reduce((sum, p) => sum + p.total_kg * p.harga_per_kg, 0);

  const labaRugi = totalOmsetPanen - totalPengeluaran;

  return {
    profil,
    summaries,
    biayaPelet,
    biayaAlternatif,
    totalBiayaPakan,
    totalPengeluaranLain,
    totalPengeluaran,
    totalKgPanen,
    totalOmsetPanen,
    labaRugi,
  };
}

export async function buildLaporanBulananHtml() {
  const data = await kumpulkanDataLaporan();
  const namaPeternakan = data.profil?.nama_peternakan || data.profil?.nama_panggilan || 'Peternakan Mister Lele';

  const barisKolam = data.summaries
    .map(
      (s) => `
        <tr>
          <td>${escapeHtml(s.kolam.nama_kolam)}</td>
          <td style="text-align:center">${s.populasiAktif ?? '-'}</td>
          <td style="text-align:center">${s.sr != null ? s.sr.toFixed(0) + '%' : '-'}</td>
          <td style="text-align:center">${s.biomassaKg != null ? s.biomassaKg.toFixed(1) + ' kg' : '-'}</td>
        </tr>`
    )
    .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Roboto, Arial, sans-serif; color:#1F2937; padding: 24px; }
          h1 { color:#0F766E; font-size:20px; margin:0; }
          h2 { font-size:14px; color:#0F766E; margin-top:24px; border-bottom:2px solid #CCFBEF; padding-bottom:4px; }
          .logo-row { display:flex; align-items:center; gap:12px; margin-bottom:4px; }
          .logo-mark {
            width:44px; height:44px; border-radius:12px; background:#CCFBEF; color:#0F766E;
            font-size:24px; display:flex; align-items:center; justify-content:center; flex-shrink:0;
          }
          .muted { color:#6B7280; font-size:12px; margin-top:2px; }
          table { width:100%; border-collapse: collapse; margin-top: 8px; font-size:12px; }
          th, td { border:1px solid #E2E8E5; padding:6px 8px; }
          th { background:#F4F6F5; text-align:left; }
          .summary-grid { display:flex; gap:12px; margin-top:8px; flex-wrap: wrap; }
          .summary-box { flex:1; min-width:150px; background:#F4F6F5; border-radius:10px; padding:10px 12px; }
          .summary-label { font-size:11px; color:#6B7280; }
          .summary-value { font-size:16px; font-weight:700; margin-top:2px; }
          .footer { margin-top:36px; text-align:center; font-size:11px; color:#6B7280; opacity:0.7; }
        </style>
      </head>
      <body>
        <div class="logo-row">
          <div class="logo-mark">🐟</div>
          <div>
            <h1>Laporan Budidaya Bulanan - ${escapeHtml(namaPeternakan)}</h1>
            <div class="muted">Periode: ${namaBulanTahunIni()}</div>
          </div>
        </div>

        <h2>Ringkasan Populasi & Survival Rate</h2>
        <table>
          <thead><tr><th>Kolam</th><th>Populasi Aktif</th><th>Survival Rate</th><th>Biomassa</th></tr></thead>
          <tbody>${barisKolam || '<tr><td colspan="4" style="text-align:center">Belum ada data kolam</td></tr>'}</tbody>
        </table>

        <h2>Rincian Biaya Pakan (Pelet vs Alternatif)</h2>
        <div class="summary-grid">
          <div class="summary-box">
            <div class="summary-label">Pakan Pabrik/Pelet</div>
            <div class="summary-value">${formatRupiah(data.biayaPelet)}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Pakan Alternatif</div>
            <div class="summary-value">${formatRupiah(data.biayaAlternatif)}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Total Biaya Pakan</div>
            <div class="summary-value">${formatRupiah(data.totalBiayaPakan)}</div>
          </div>
        </div>

        <h2>Ringkasan Keuangan</h2>
        <div class="summary-grid">
          <div class="summary-box">
            <div class="summary-label">Total Pengeluaran</div>
            <div class="summary-value">${formatRupiah(data.totalPengeluaran)}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Estimasi Omset Panen (${data.totalKgPanen.toFixed(1)} kg)</div>
            <div class="summary-value">${formatRupiah(data.totalOmsetPanen)}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">Laba/Rugi Bersih</div>
            <div class="summary-value" style="color:${data.labaRugi >= 0 ? '#1B8A5A' : '#C0392B'}">
              ${formatRupiah(data.labaRugi)}
            </div>
          </div>
        </div>

        <div class="footer">
          Dibuat melalui Mister Lele App • Developed by Haryo Heddy N.<br/>
          Dicetak pada ${formatTanggal(todayISODate())}
        </div>
      </body>
    </html>
  `;
}

export async function exportLaporanBulananPdf() {
  const html = await buildLaporanBulananHtml();
  const { uri } = await Print.printToFileAsync({ html });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Bagikan Laporan Budidaya Bulanan',
    });
  }

  return uri;
}
