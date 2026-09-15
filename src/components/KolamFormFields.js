import { StyleSheet, Switch, Text } from 'react-native';
import { FormInput, FormChoice, FormField } from './FormModal';
import { toNumber } from '../utils/format';
import { KOMODITAS_LIST, getKomoditasPreset, isKomoditasCustom } from '../constants/komoditas';
import { COLORS } from '../theme';

export function kolamFormToPayload(form) {
  const isBertingkat = !!form.isBertingkat;
  return {
    namaKolam: form.namaKolam,
    targetPanenGram: form.targetPanenGram ? toNumber(form.targetPanenGram) : null,
    bentuk: form.bentuk || null,
    panjang: form.bentuk === 'Persegi' && form.panjang ? toNumber(form.panjang) : null,
    lebar: form.bentuk === 'Persegi' && form.lebar ? toNumber(form.lebar) : null,
    diameter: form.bentuk === 'Bundar' && form.diameter ? toNumber(form.diameter) : null,
    tinggi: form.tinggi ? toNumber(form.tinggi) : null,
    tipeBudidaya: form.tipeBudidaya || null,
    ketinggianAir: form.ketinggianAir ? toNumber(form.ketinggianAir) : null,
    debitAir: form.debitAir ? toNumber(form.debitAir) : null,
    jenisKomoditas: form.jenisKomoditas || null,
    isBertingkat,
    jumlahTingkat: isBertingkat && form.jumlahTingkat ? toNumber(form.jumlahTingkat) : null,
    jumlahBoxPerTingkat: isBertingkat && form.jumlahBoxPerTingkat ? toNumber(form.jumlahBoxPerTingkat) : null,
    sistemAerasi: isBertingkat ? form.sistemAerasi || null : null,
    lokasiKolam: form.lokasiKolam || 'Outdoor',
  };
}

export function kolamToForm(kolam) {
  return {
    namaKolam: kolam.nama_kolam,
    targetPanenGram: kolam.target_panen_gram != null ? String(kolam.target_panen_gram) : '',
    bentuk: kolam.bentuk || 'Bundar',
    panjang: kolam.panjang != null ? String(kolam.panjang) : '',
    lebar: kolam.lebar != null ? String(kolam.lebar) : '',
    diameter: kolam.diameter != null ? String(kolam.diameter) : '',
    tinggi: kolam.tinggi != null ? String(kolam.tinggi) : '',
    tipeBudidaya: kolam.tipe_budidaya || 'Terpal',
    ketinggianAir: kolam.ketinggian_air != null ? String(kolam.ketinggian_air) : '',
    debitAir: kolam.debit_air != null ? String(kolam.debit_air) : '',
    jenisKomoditas: kolam.jenis_komoditas || 'lele',
    isBertingkat: !!kolam.is_bertingkat,
    jumlahTingkat: kolam.jumlah_tingkat != null ? String(kolam.jumlah_tingkat) : '',
    jumlahBoxPerTingkat: kolam.jumlah_box_per_tingkat != null ? String(kolam.jumlah_box_per_tingkat) : '',
    sistemAerasi: kolam.sistem_aerasi || 'Tanpa Aerator',
    lokasiKolam: kolam.lokasi_kolam || 'Outdoor',
  };
}

export const KOLAM_FORM_DEFAULTS = {
  bentuk: 'Bundar',
  tipeBudidaya: 'Terpal',
  jenisKomoditas: 'lele',
  isBertingkat: false,
  sistemAerasi: 'Tanpa Aerator',
  lokasiKolam: 'Outdoor',
};

export default function KolamFormFields({ form, setForm }) {
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleJenisKomoditasChange = (value) => {
    const preset = getKomoditasPreset(value);
    setForm((f) => ({
      ...f,
      jenisKomoditas: value,
      targetPanenGram: preset && !isKomoditasCustom(value) ? String(preset.targetBobotGram ?? '') : f.targetPanenGram,
    }));
  };

  const selectedPreset = getKomoditasPreset(form.jenisKomoditas);

  return (
    <>
      <FormInput label="Nama Kolam" value={form.namaKolam} onChangeText={set('namaKolam')} />

      <FormChoice
        label="Jenis Komoditas"
        value={form.jenisKomoditas}
        onChange={handleJenisKomoditasChange}
        options={KOMODITAS_LIST.map((k) => ({ label: `${k.emoji} ${k.nama}`, value: k.id }))}
      />
      {selectedPreset && !selectedPreset.isCustom && (
        <Text style={styles.hint}>
          Estimasi panen ±{selectedPreset.masaPanenHari} hari • target bobot {selectedPreset.targetBobotGram}g • padat
          tebar {selectedPreset.padatTebarPerM3} ekor/m³
        </Text>
      )}

      <FormChoice
        label="Bentuk Kolam"
        value={form.bentuk}
        onChange={set('bentuk')}
        options={[
          { label: 'Bundar', value: 'Bundar' },
          { label: 'Persegi', value: 'Persegi' },
        ]}
      />
      {form.bentuk === 'Persegi' ? (
        <>
          <FormInput label="Panjang (meter)" keyboardType="numeric" value={form.panjang} onChangeText={set('panjang')} />
          <FormInput label="Lebar (meter)" keyboardType="numeric" value={form.lebar} onChangeText={set('lebar')} />
        </>
      ) : (
        <FormInput label="Diameter (meter)" keyboardType="numeric" value={form.diameter} onChangeText={set('diameter')} />
      )}
      <FormInput label="Tinggi Dinding Kolam (meter)" keyboardType="numeric" value={form.tinggi} onChangeText={set('tinggi')} />
      <FormChoice
        label="Tipe Budidaya"
        value={form.tipeBudidaya}
        onChange={set('tipeBudidaya')}
        options={[
          { label: 'Bioflok', value: 'Bioflok' },
          { label: 'Kolam Tanah', value: 'Kolam Tanah' },
          { label: 'Terpal', value: 'Terpal' },
          { label: 'Beton', value: 'Beton' },
        ]}
      />
      <FormChoice
        label="Lokasi Kolam"
        helperText="Berpengaruh ke pertumbuhan plankton alami, fluktuasi suhu, dan jadwal pemberian probiotik."
        value={form.lokasiKolam}
        onChange={set('lokasiKolam')}
        options={[
          { label: '☀️ Outdoor', value: 'Outdoor' },
          { label: '🏠 Indoor', value: 'Indoor' },
        ]}
      />
      <FormInput
        label="Ketinggian Air Saat Ini (cm)"
        keyboardType="numeric"
        value={form.ketinggianAir}
        onChangeText={set('ketinggianAir')}
      />
      <FormInput
        label="Debit Air (Liter/Menit, opsional)"
        keyboardType="numeric"
        value={form.debitAir}
        onChangeText={set('debitAir')}
      />
      <FormInput
        label="Target Berat Panen per Ekor (gram, opsional)"
        keyboardType="numeric"
        value={form.targetPanenGram}
        onChangeText={set('targetPanenGram')}
      />

      <FormField label="Kolam Bertingkat / Rak Susun (Apartemen)">
        <Switch
          value={!!form.isBertingkat}
          onValueChange={set('isBertingkat')}
          trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
          thumbColor={form.isBertingkat ? COLORS.primary : '#FFFFFF'}
        />
      </FormField>

      {form.isBertingkat && (
        <>
          <FormInput
            label="Jumlah Tingkat"
            keyboardType="numeric"
            value={form.jumlahTingkat}
            onChangeText={set('jumlahTingkat')}
          />
          <FormInput
            label="Jumlah Box per Tingkat"
            keyboardType="numeric"
            value={form.jumlahBoxPerTingkat}
            onChangeText={set('jumlahBoxPerTingkat')}
          />
          <FormChoice
            label="Sistem Aerasi"
            value={form.sistemAerasi}
            onChange={set('sistemAerasi')}
            options={[
              { label: 'Blower Sentral', value: 'Blower Sentral' },
              { label: 'Aerator per Box', value: 'Aerator per Box' },
              { label: 'Venturi', value: 'Venturi' },
              { label: 'Tanpa Aerator', value: 'Tanpa Aerator' },
            ]}
          />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: -6,
    marginBottom: 12,
  },
});
