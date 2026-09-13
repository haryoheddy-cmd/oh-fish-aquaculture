import { StyleSheet, Text, View } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';

import FormModal, { FormChoice, FormInput } from './FormModal';
import { COLORS, SPACING } from '../theme';
import { toNumber } from '../utils/format';
import { analisaKualitasAir } from '../utils/leleCalculators';

export default function WaterQualityModal({ visible, form, setForm, onClose, onSubmit, submitDisabled, volumeAirM3 = null }) {
  const hasil = analisaKualitasAir({
    phAir: form.phAir ? toNumber(form.phAir) : null,
    suhu: form.suhu ? toNumber(form.suhu) : null,
    kejernihan: form.kejernihan || null,
    volumeAirM3,
  });

  return (
    <FormModal visible={visible} title="Log Kualitas Air" onClose={onClose} onSubmit={onSubmit} submitDisabled={submitDisabled}>
      <FormInput label="Tanggal" value={form.tanggal} onChangeText={(v) => setForm((f) => ({ ...f, tanggal: v }))} />
      <FormInput
        label="pH Air"
        keyboardType="numeric"
        placeholder="Contoh: 7.2"
        value={form.phAir}
        onChangeText={(v) => setForm((f) => ({ ...f, phAir: v }))}
      />
      <FormInput
        label="Suhu (°C)"
        keyboardType="numeric"
        placeholder="Contoh: 28"
        value={form.suhu}
        onChangeText={(v) => setForm((f) => ({ ...f, suhu: v }))}
      />
      <FormChoice
        label="Kejernihan / Tingkat Keruh"
        value={form.kejernihan}
        onChange={(v) => setForm((f) => ({ ...f, kejernihan: v }))}
        options={[
          { label: 'Jernih', value: 'Jernih' },
          { label: 'Agak Keruh', value: 'Agak Keruh' },
          { label: 'Keruh', value: 'Keruh' },
        ]}
      />

      {hasil.alerts.length > 0 ? (
        <View style={styles.alertBox}>
          {hasil.alerts.map((alert) => (
            <View key={alert.kode} style={styles.alertRow}>
              <TriangleAlert size={16} color={COLORS.danger} />
              <Text style={styles.alertText}>{alert.pesan}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <FormChoice
        label="Kondisi Cuaca"
        value={form.kondisiCuaca}
        onChange={(v) => setForm((f) => ({ ...f, kondisiCuaca: v }))}
        options={[
          { label: '☀️ Cerah', value: 'Cerah' },
          { label: '🌧️ Hujan', value: 'Hujan' },
        ]}
      />
      <FormInput
        label="Tindakan yang Dilakukan (opsional)"
        value={form.tindakan}
        onChangeText={(v) => setForm((f) => ({ ...f, tindakan: v }))}
      />
    </FormModal>
  );
}

const styles = StyleSheet.create({
  alertBox: {
    backgroundColor: COLORS.dangerBg,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: -4,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
});
