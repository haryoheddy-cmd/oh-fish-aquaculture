import FormModal, { FormChoice, FormInput } from './FormModal';
import { TIPS_KATEGORI } from '../constants/tips';

export default function TipFormModal({ visible, title = 'Tips Baru', form, setForm, onClose, onSubmit, submitDisabled }) {
  return (
    <FormModal visible={visible} title={title} onClose={onClose} onSubmit={onSubmit} submitDisabled={submitDisabled}>
      <FormInput
        label="Judul Tips/Trik"
        placeholder="Contoh: Resep Fermentasi Molase & Ragi"
        value={form.judul}
        onChangeText={(v) => setForm((f) => ({ ...f, judul: v }))}
      />
      <FormChoice
        label="Kategori"
        value={form.kategori}
        onChange={(v) => setForm((f) => ({ ...f, kategori: v }))}
        options={TIPS_KATEGORI.map((k) => ({ label: `${k.emoji} ${k.nama}`, value: k.id }))}
      />
      <FormInput
        label="Nama Peternak / Sumber (opsional)"
        placeholder="Contoh: Pak Haryo - Kediri, atau TikTok @PeternakLeleSukses"
        value={form.sumber}
        onChangeText={(v) => setForm((f) => ({ ...f, sumber: v }))}
      />
      <FormInput
        label="Isi Catatan / Tips / Nasihat"
        placeholder="Tuliskan langkah-langkah atau catatan tipsnya di sini..."
        value={form.isi}
        onChangeText={(v) => setForm((f) => ({ ...f, isi: v }))}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        style={{ minHeight: 120 }}
      />
    </FormModal>
  );
}
