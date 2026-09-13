import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

import { formatRupiah, formatTanggal } from './format';

const LEBAR_KERTAS_58MM = 32;

function escapeHtml(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, (c) => map[c]);
}

/**
 * Membangun data struk generik untuk transaksi Penjualan (panen) atau
 * Pembelian Stok. `items` berisi baris-baris nota (biasanya satu baris).
 */
export function buildStrukData({
  jenisTransaksi,
  namaPeternakan,
  namaPihak,
  tanggal,
  items,
  catatan = null,
}) {
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  return { jenisTransaksi, namaPeternakan, namaPihak, tanggal, items, catatan, total };
}

// ---------- Struk PDF/Digital (expo-print + expo-sharing) ----------

export function buildStrukHtml(data) {
  const { jenisTransaksi, namaPeternakan, namaPihak, tanggal, items, catatan, total } = data;

  const barisItem = items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.nama)}</td>
          <td style="text-align:center">${item.qty} ${escapeHtml(item.satuan || '')}</td>
          <td style="text-align:right">${formatRupiah(item.hargaSatuan)}</td>
          <td style="text-align:right">${formatRupiah(item.subtotal)}</td>
        </tr>`
    )
    .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Roboto, Arial, sans-serif; color:#1F2937; padding: 24px; }
          .receipt { max-width: 380px; margin: 0 auto; border: 1px dashed #CBD5D1; padding: 20px; border-radius: 12px; }
          .logo-row { text-align:center; margin-bottom: 8px; }
          .logo-mark { font-size: 32px; }
          h1 { color:#0F766E; font-size:16px; margin:6px 0 0; text-align:center; }
          .muted { color:#6B7280; font-size:11px; text-align:center; margin-top:2px; }
          .divider { border-top: 1px dashed #CBD5D1; margin: 12px 0; }
          .meta-row { display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px; }
          table { width:100%; border-collapse: collapse; margin-top: 8px; font-size:12px; }
          th, td { padding:4px 2px; }
          th { text-align:left; border-bottom: 1px solid #E2E8E5; font-size:11px; color:#6B7280; }
          .total-row { display:flex; justify-content:space-between; font-size:15px; font-weight:800; margin-top:8px; }
          .footer { margin-top:20px; text-align:center; font-size:10px; color:#6B7280; opacity:0.8; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="logo-row">
            <div class="logo-mark">🐟</div>
            <h1>${escapeHtml(namaPeternakan || 'Mister Lele')}</h1>
            <div class="muted">Struk ${escapeHtml(jenisTransaksi)}</div>
          </div>

          <div class="divider"></div>

          <div class="meta-row"><span>Tanggal</span><span>${formatTanggal(tanggal)}</span></div>
          <div class="meta-row"><span>${jenisTransaksi === 'Pembelian Stok' ? 'Toko/Vendor' : 'Pembeli'}</span><span>${escapeHtml(namaPihak || '-')}</span></div>
          ${catatan ? `<div class="meta-row"><span>Catatan</span><span>${escapeHtml(catatan)}</span></div>` : ''}

          <table>
            <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Harga</th><th style="text-align:right">Subtotal</th></tr></thead>
            <tbody>${barisItem}</tbody>
          </table>

          <div class="divider"></div>
          <div class="total-row"><span>TOTAL</span><span>${formatRupiah(total)}</span></div>

          <div class="footer">
            Dicetak melalui Mister Lele App<br/>
            Developed by Haryo Heddy N.
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function cetakStrukPdf(data) {
  const html = buildStrukHtml(data);
  const { uri } = await Print.printToFileAsync({ html });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Bagikan Struk ${data.jenisTransaksi}`,
    });
  }

  return uri;
}

// ---------- Struk Bluetooth Thermal (58mm, teks siap ESC/POS) ----------

function rataKiriKanan(kiri, kanan, lebar = LEBAR_KERTAS_58MM) {
  const sisa = Math.max(lebar - kiri.length - kanan.length, 1);
  return `${kiri}${' '.repeat(sisa)}${kanan}`;
}

function tengah(teks, lebar = LEBAR_KERTAS_58MM) {
  const bersih = teks.slice(0, lebar);
  const sisaKiri = Math.max(Math.floor((lebar - bersih.length) / 2), 0);
  return `${' '.repeat(sisaKiri)}${bersih}`;
}

function garis(lebar = LEBAR_KERTAS_58MM) {
  return '-'.repeat(lebar);
}

const ESC_INIT = '\x1B\x40';
const ESC_BOLD_ON = '\x1B\x45\x01';
const ESC_BOLD_OFF = '\x1B\x45\x00';
const ESC_FEED_CUT = '\n\n\n\x1D\x56\x42\x00';

/**
 * Menghasilkan teks struk siap kirim ke printer thermal 58mm (± 32 kolom)
 * via koneksi Bluetooth Serial (SPP), dibungkus perintah inisialisasi &
 * potong kertas ESC/POS. String ini bisa langsung di-stream sebagai bytes
 * (encode ke Latin1/ASCII) ke printer, atau dibagikan lewat share sheet ke
 * aplikasi jembatan Bluetooth ESC/POS (mis. RawBT) di Android.
 */
export function buildStrukEscPosText(data) {
  const { jenisTransaksi, namaPeternakan, namaPihak, tanggal, items, catatan, total } = data;

  const baris = [];
  baris.push(tengah(namaPeternakan || 'Mister Lele'));
  baris.push(tengah(`Struk ${jenisTransaksi}`));
  baris.push(garis());
  baris.push(rataKiriKanan('Tanggal', formatTanggal(tanggal)));
  baris.push(rataKiriKanan(jenisTransaksi === 'Pembelian Stok' ? 'Toko/Vendor' : 'Pembeli', namaPihak || '-'));
  if (catatan) baris.push(rataKiriKanan('Catatan', catatan));
  baris.push(garis());

  items.forEach((item) => {
    baris.push(`${item.nama}`);
    baris.push(
      rataKiriKanan(
        `${item.qty} ${item.satuan || ''} x ${formatRupiah(item.hargaSatuan)}`,
        formatRupiah(item.subtotal)
      )
    );
  });

  baris.push(garis());
  baris.push(rataKiriKanan('TOTAL', formatRupiah(total)));
  baris.push(garis());
  baris.push(tengah('Developed by Haryo Heddy N.'));

  const isiStruk = baris.join('\n');
  return `${ESC_INIT}${ESC_BOLD_ON}${isiStruk.split('\n')[0]}\n${ESC_BOLD_OFF}${isiStruk.split('\n').slice(1).join('\n')}${ESC_FEED_CUT}`;
}

/**
 * Menyiapkan file teks ESC/POS lalu membuka share sheet, sehingga bisa
 * dikirim ke aplikasi jembatan Bluetooth thermal printer (mis. RawBT di
 * Android) yang akan men-stream isinya ke printer via Bluetooth Serial.
 */
export async function cetakStrukBluetooth(data) {
  const teks = buildStrukEscPosText(data);
  const file = new File(Paths.cache, `struk-${Date.now()}.txt`);
  file.write(teks);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/plain',
      dialogTitle: 'Print via Bluetooth Thermal Printer',
    });
  }

  return file.uri;
}
