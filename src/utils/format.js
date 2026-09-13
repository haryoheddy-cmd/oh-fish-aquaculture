export function formatRupiah(value) {
  const number = Number(value) || 0;
  return `Rp${number.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
}

export function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export function formatTanggal(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function toNumber(value, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}
