import FormModal, { FormChoice, FormInput } from './FormModal';

export default function PakanFormModal({
  visible,
  title = 'Pakan Harian',
  form,
  setForm,
  onClose,
  onSubmit,
  submitDisabled,
  kolamOptions = null,
}) {
  return (
    <FormModal visible={visible} title={title} onClose={onClose} onSubmit={onSubmit} submitDisabled={submitDisabled}>
      {kolamOptions ? (
        <FormChoice
          label="Kolam"
          value={form.idKolam}
          onChange={(v) => setForm((f) => ({ ...f, idKolam: v }))}
          options={kolamOptions}
        />
      ) : null}
      <FormInput label="Tanggal" value={form.tanggal} onChangeText={(v) => setForm((f) => ({ ...f, tanggal: v }))} />
      <FormInput
        label="Jenis Pakan"
        placeholder="Contoh: Pelet LP-2"
        value={form.jenisPakan}
        onChangeText={(v) => setForm((f) => ({ ...f, jenisPakan: v }))}
      />
      <FormInput
        label="Jumlah (kg)"
        keyboardType="numeric"
        placeholder="Contoh: 3.5"
        helperText="Pakan yang diberikan saat ini"
        value={form.jumlahKg}
        onChangeText={(v) => setForm((f) => ({ ...f, jumlahKg: v }))}
      />
      <FormInput
        label="Biaya (Rp, opsional)"
        keyboardType="numeric"
        placeholder="Contoh: 45000"
        helperText="Biaya pakan yang dikonsumsi hari ini saja. Untuk pembelian karung/stok, catat di menu Stok."
        value={form.biaya}
        onChangeText={(v) => setForm((f) => ({ ...f, biaya: v }))}
      />
    </FormModal>
  );
}
