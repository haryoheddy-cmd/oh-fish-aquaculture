import { StyleSheet, Text } from 'react-native';

import FormModal, { FormChoice, FormField, FormInput } from './FormModal';
import { COLORS } from '../theme';

export default function GradingModal({
  visible,
  form,
  setForm,
  onClose,
  onSubmit,
  submitDisabled,
  kolamAsalLabel = null,
  kolamAsalOptions = null,
  kolamTujuanOptions,
}) {
  return (
    <FormModal
      visible={visible}
      title="Catat Grading / Pindah Kolam"
      onClose={onClose}
      onSubmit={onSubmit}
      submitDisabled={submitDisabled}
    >
      {kolamAsalOptions ? (
        <FormChoice
          label="Kolam Asal"
          value={form.idKolamAsal}
          onChange={(v) => setForm((f) => ({ ...f, idKolamAsal: v }))}
          options={kolamAsalOptions}
        />
      ) : kolamAsalLabel ? (
        <FormField label="Kolam Asal">
          <Text style={styles.readonlyValue}>{kolamAsalLabel}</Text>
        </FormField>
      ) : null}

      <FormChoice
        label="Kolam Tujuan"
        value={form.idKolamTujuan}
        onChange={(v) => setForm((f) => ({ ...f, idKolamTujuan: v }))}
        options={kolamTujuanOptions}
      />

      <FormInput label="Tanggal" value={form.tanggal} onChangeText={(v) => setForm((f) => ({ ...f, tanggal: v }))} />
      <FormInput
        label="Jumlah Ekor Dipindah"
        keyboardType="numeric"
        placeholder="Contoh: 100"
        value={form.jumlahEkor}
        onChangeText={(v) => setForm((f) => ({ ...f, jumlahEkor: v }))}
      />
      <FormInput
        label="Ukuran / Grade (cm, opsional)"
        placeholder="Contoh: 7-9 cm"
        value={form.ukuran}
        onChangeText={(v) => setForm((f) => ({ ...f, ukuran: v }))}
      />
    </FormModal>
  );
}

const styles = StyleSheet.create({
  readonlyValue: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: '#F1F3F2',
  },
});
