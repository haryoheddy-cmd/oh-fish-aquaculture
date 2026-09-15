import FormModal, { FormInput } from './FormModal';

export default function QuoteFormModal({
  visible,
  title = 'Nasihat Baru',
  form,
  setForm,
  onClose,
  onSubmit,
  submitDisabled,
}) {
  return (
    <FormModal visible={visible} title={title} onClose={onClose} onSubmit={onSubmit} submitDisabled={submitDisabled}>
      <FormInput
        label="Kalimat Nasihat / Kutipan"
        placeholder='Contoh: "Olah air dulu sampai matang, baru tebar benih. Jangan kebalik!"'
        value={form.kalimat}
        onChangeText={(v) => setForm((f) => ({ ...f, kalimat: v }))}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={{ minHeight: 90 }}
      />
      <FormInput
        label="Nama Peternak / Sumber (opsional)"
        placeholder="Contoh: Pak Haryo - Kediri"
        value={form.sumber}
        onChangeText={(v) => setForm((f) => ({ ...f, sumber: v }))}
      />
    </FormModal>
  );
}
