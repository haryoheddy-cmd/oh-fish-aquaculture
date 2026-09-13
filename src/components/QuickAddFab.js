import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Utensils, Skull, Scale, Fish, Shell, Wind } from 'lucide-react-native';

import FormModal, { FormInput, FormChoice } from './FormModal';
import PakanFormModal from './PakanFormModal';
import KolamFormFields, { kolamFormToPayload, KOLAM_FORM_DEFAULTS } from './KolamFormFields';
import { COLORS, SPACING } from '../theme';
import { todayISODate, toNumber } from '../utils/format';
import { emitDataChanged } from '../utils/eventBus';
import {
  getAllKolam,
  createPakanLog,
  createKematianKonsumsiLog,
  createSamplingLog,
  createKolam,
  createMoltingLog,
  createAeratorLog,
} from '../db/queries';

const QUICK_ACTIONS = [
  { key: 'pakan', label: 'Catat Pakan', icon: Utensils, color: COLORS.primary },
  { key: 'mati', label: 'Catat Kematian', icon: Skull, color: COLORS.danger },
  { key: 'sampling', label: 'Sampling Berat', icon: Scale, color: COLORS.warning },
  { key: 'molting', label: 'Catat Molting', icon: Shell, color: COLORS.warning },
  { key: 'aerator', label: 'Log Aerator/Suhu', icon: Wind, color: COLORS.primary },
  { key: 'tambahKolam', label: 'Tambah Kolam', icon: Fish, color: COLORS.primary },
];

export default function QuickAddFab() {
  const insets = useSafeAreaInsets();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [kolamList, setKolamList] = useState([]);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const openSheet = async () => {
    const list = await getAllKolam();
    setKolamList(list);
    setSheetVisible(true);
  };

  const chooseAction = (key) => {
    setSheetVisible(false);
    if (key === 'tambahKolam') {
      setForm({ ...KOLAM_FORM_DEFAULTS });
    } else if (key === 'molting') {
      setForm({ tanggalMolting: todayISODate(), statusCangkang: 'Lunak/Karantina', idKolam: kolamList[0]?.id ?? null });
    } else if (key === 'aerator') {
      setForm({ tanggal: todayISODate(), statusAerator: 'Normal', idKolam: kolamList[0]?.id ?? null });
    } else {
      setForm({ tanggal: todayISODate(), idKolam: kolamList[0]?.id ?? null });
    }
    setActiveAction(key);
  };

  const closeForm = () => {
    setActiveAction(null);
    setForm({});
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (activeAction === 'pakan') {
        await createPakanLog({
          idKolam: form.idKolam,
          tanggal: form.tanggal || todayISODate(),
          jenisPakan: form.jenisPakan || null,
          jumlahKg: toNumber(form.jumlahKg),
          biaya: form.biaya ? toNumber(form.biaya) : null,
        });
      } else if (activeAction === 'mati') {
        await createKematianKonsumsiLog({
          idKolam: form.idKolam,
          tanggal: form.tanggal || todayISODate(),
          jumlahMati: toNumber(form.jumlahMati),
          jumlahKonsumsi: toNumber(form.jumlahKonsumsi),
          keterangan: form.keterangan || null,
        });
      } else if (activeAction === 'sampling') {
        await createSamplingLog({
          idKolam: form.idKolam,
          tanggal: form.tanggal || todayISODate(),
          beratRataRataGram: toNumber(form.beratRataRataGram),
        });
      } else if (activeAction === 'molting') {
        await createMoltingLog({
          idKolam: form.idKolam,
          nomorBox: form.nomorBox || null,
          tanggalMolting: form.tanggalMolting || todayISODate(),
          statusCangkang: form.statusCangkang || 'Lunak/Karantina',
          catatan: form.catatan || null,
        });
      } else if (activeAction === 'aerator') {
        await createAeratorLog({
          idKolam: form.idKolam,
          tanggal: form.tanggal || todayISODate(),
          statusAerator: form.statusAerator || 'Normal',
          nilaiDoPpm: form.nilaiDoPpm ? toNumber(form.nilaiDoPpm) : null,
          suhuCelsius: form.suhuCelsius ? toNumber(form.suhuCelsius) : null,
        });
      } else if (activeAction === 'tambahKolam') {
        await createKolam({ ...kolamFormToPayload(form), status: 'aktif' });
      }
      closeForm();
      emitDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const kolamOptions = kolamList.map((k) => ({ label: k.nama_kolam, value: k.id }));
  const needsKolamPicker = !!activeAction && activeAction !== 'tambahKolam';
  const activeActionMeta = QUICK_ACTIONS.find((a) => a.key === activeAction);
  const submitDisabled =
    saving ||
    (needsKolamPicker && !form.idKolam) ||
    (activeAction === 'tambahKolam' && !form.namaKolam);

  return (
    <>
      <Pressable style={[styles.fab, { bottom: insets.bottom + 80 }]} onPress={openSheet} hitSlop={8}>
        <Plus size={26} color="#FFFFFF" />
      </Pressable>

      <Modal visible={sheetVisible} transparent animationType="fade" onRequestClose={() => setSheetVisible(false)}>
        <View style={styles.backdropContainer}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheetVisible(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.lg }]}>
            <Text style={styles.sheetTitle}>Catat Cepat</Text>
            {QUICK_ACTIONS.map((action, index) => (
              <Pressable
                key={action.key}
                style={[styles.sheetItem, index === 0 && styles.sheetItemFirst]}
                onPress={() => chooseAction(action.key)}
              >
                <action.icon size={20} color={action.color} />
                <Text style={styles.sheetItemText}>+ {action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      <PakanFormModal
        visible={activeAction === 'pakan'}
        title={activeActionMeta?.label ?? ''}
        form={form}
        setForm={setForm}
        onClose={closeForm}
        onSubmit={handleSubmit}
        submitDisabled={submitDisabled}
        kolamOptions={kolamOptions}
      />

      <FormModal
        visible={!!activeAction && activeAction !== 'pakan'}
        title={activeActionMeta?.label ?? ''}
        onClose={closeForm}
        onSubmit={handleSubmit}
        submitDisabled={submitDisabled}
      >
        {needsKolamPicker && (
          <FormChoice
            label="Kolam"
            value={form.idKolam}
            onChange={(v) => setForm((f) => ({ ...f, idKolam: v }))}
            options={kolamOptions}
          />
        )}
        {activeAction === 'mati' && (
          <>
            <FormInput label="Tanggal" value={form.tanggal} onChangeText={(v) => setForm((f) => ({ ...f, tanggal: v }))} />
            <FormInput label="Jumlah Mati (ekor)" keyboardType="numeric" value={form.jumlahMati} onChangeText={(v) => setForm((f) => ({ ...f, jumlahMati: v }))} />
            <FormInput
              label="Jumlah Dikonsumsi/Dipanen Sebagian (ekor)"
              keyboardType="numeric"
              value={form.jumlahKonsumsi}
              onChangeText={(v) => setForm((f) => ({ ...f, jumlahKonsumsi: v }))}
            />
            <FormInput label="Keterangan (opsional)" value={form.keterangan} onChangeText={(v) => setForm((f) => ({ ...f, keterangan: v }))} />
          </>
        )}
        {activeAction === 'sampling' && (
          <>
            <FormInput label="Tanggal" value={form.tanggal} onChangeText={(v) => setForm((f) => ({ ...f, tanggal: v }))} />
            <FormInput
              label="Berat Rata-rata (gram)"
              keyboardType="numeric"
              value={form.beratRataRataGram}
              onChangeText={(v) => setForm((f) => ({ ...f, beratRataRataGram: v }))}
            />
          </>
        )}
        {activeAction === 'molting' && (
          <>
            <FormInput label="Nomor Box (opsional)" value={form.nomorBox} onChangeText={(v) => setForm((f) => ({ ...f, nomorBox: v }))} />
            <FormInput
              label="Tanggal Molting"
              value={form.tanggalMolting}
              onChangeText={(v) => setForm((f) => ({ ...f, tanggalMolting: v }))}
            />
            <FormChoice
              label="Status Cangkang"
              value={form.statusCangkang}
              onChange={(v) => setForm((f) => ({ ...f, statusCangkang: v }))}
              options={[
                { label: 'Lunak/Karantina', value: 'Lunak/Karantina' },
                { label: 'Mulai Mengkeras', value: 'Mulai Mengkeras' },
                { label: 'Keras/Normal', value: 'Keras/Normal' },
              ]}
            />
            <FormInput label="Catatan (opsional)" value={form.catatan} onChangeText={(v) => setForm((f) => ({ ...f, catatan: v }))} />
          </>
        )}
        {activeAction === 'aerator' && (
          <>
            <FormInput label="Tanggal" value={form.tanggal} onChangeText={(v) => setForm((f) => ({ ...f, tanggal: v }))} />
            <FormChoice
              label="Status Aerator"
              value={form.statusAerator}
              onChange={(v) => setForm((f) => ({ ...f, statusAerator: v }))}
              options={[
                { label: 'Normal', value: 'Normal' },
                { label: 'Maintenance', value: 'Maintenance' },
                { label: 'Rusak', value: 'Rusak' },
              ]}
            />
            <FormInput
              label="Nilai DO (ppm, opsional)"
              keyboardType="numeric"
              value={form.nilaiDoPpm}
              onChangeText={(v) => setForm((f) => ({ ...f, nilaiDoPpm: v }))}
            />
            <FormInput
              label="Suhu (°C, opsional)"
              keyboardType="numeric"
              value={form.suhuCelsius}
              onChangeText={(v) => setForm((f) => ({ ...f, suhuCelsius: v }))}
            />
          </>
        )}
        {activeAction === 'tambahKolam' && <KolamFormFields form={form} setForm={setForm} />}
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  backdropContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 22, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sheetItemFirst: {
    borderTopWidth: 0,
  },
  sheetItemText: {
    marginLeft: SPACING.md,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
});
