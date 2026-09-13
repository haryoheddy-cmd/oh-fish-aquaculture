import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Circle, CircleCheckBig } from 'lucide-react-native';

import { FormInput } from './FormModal';
import { COLORS, SPACING } from '../theme';
import { todayISODate, toNumber } from '../utils/format';
import { subscribeDataChanged, emitDataChanged } from '../utils/eventBus';
import { getDailyChecklistByKolamAndTanggal, upsertDailyChecklist } from '../db/queries';

const SESI_LIST = ['Pagi', 'Sore', 'Malam'];

function formatJam(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function DailyPakanChecklist({ idKolam, porsiPakanHarian, title = 'Jadwal Pakan Hari Ini' }) {
  const [checklist, setChecklist] = useState({});
  const [activeSesi, setActiveSesi] = useState(null);
  const [inputKg, setInputKg] = useState('');
  const [saving, setSaving] = useState(false);

  const loadChecklist = useCallback(async () => {
    const rows = await getDailyChecklistByKolamAndTanggal(idKolam, todayISODate());
    const map = {};
    rows.forEach((row) => {
      map[row.sesi_pakan] = row;
    });
    setChecklist(map);
  }, [idKolam]);

  useFocusEffect(
    useCallback(() => {
      loadChecklist();
    }, [loadChecklist])
  );

  useEffect(() => subscribeDataChanged(loadChecklist), [loadChecklist]);

  const rekomendasiSesi = (sesi) => porsiPakanHarian?.[sesi.toLowerCase()] ?? 0;

  const openConfirm = (sesi) => {
    const rekomendasi = rekomendasiSesi(sesi);
    setInputKg(rekomendasi > 0 ? rekomendasi.toFixed(2) : '');
    setActiveSesi(sesi);
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await upsertDailyChecklist({
        idKolam,
        tanggal: todayISODate(),
        sesiPakan: activeSesi,
        jumlahKg: toNumber(inputKg),
      });
      setActiveSesi(null);
      await loadChecklist();
      emitDataChanged();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {SESI_LIST.map((sesi, index) => {
        const row = checklist[sesi];
        const done = !!row?.is_completed;
        const jam = done ? formatJam(row.waktu_selesai) : null;

        return (
          <Pressable
            key={sesi}
            style={[styles.row, index < SESI_LIST.length - 1 && styles.rowBorder]}
            onPress={() => !done && openConfirm(sesi)}
            disabled={done}
          >
            {done ? <CircleCheckBig size={22} color={COLORS.success} /> : <Circle size={22} color={COLORS.muted} />}
            <View style={styles.rowTextWrap}>
              <Text style={[styles.sesiLabel, done && styles.sesiLabelDone]}>
                {done ? `Pakan ${sesi}${jam ? ` (${jam})` : ''}` : `Pakan ${sesi}`}
              </Text>
              <Text style={styles.rekomendasiText}>
                {done
                  ? `Realisasi: ${(row.jumlah_kg ?? 0).toFixed(2)} kg`
                  : `Rekomendasi: ${rekomendasiSesi(sesi).toFixed(2)} kg`}
              </Text>
            </View>
          </Pressable>
        );
      })}

      <Modal visible={!!activeSesi} transparent animationType="fade" onRequestClose={() => setActiveSesi(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Konfirmasi Pakan {activeSesi}</Text>
            <Text style={styles.modalHint}>Masukkan realisasi jumlah pakan yang benar-benar diberikan.</Text>
            <FormInput
              label="Jumlah Pakan Diberikan (kg)"
              keyboardType="numeric"
              placeholder="Contoh: 2.5"
              value={inputKg}
              onChangeText={setInputKg}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setActiveSesi(null)}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmButton, (saving || toNumber(inputKg) <= 0) && styles.buttonDisabled]}
                onPress={handleConfirm}
                disabled={saving || toNumber(inputKg) <= 0}
              >
                <Text style={styles.modalConfirmText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowTextWrap: {
    flex: 1,
  },
  sesiLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  sesiLabelDone: {
    color: COLORS.success,
  },
  rekomendasiText: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 22, 0.45)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  modalHint: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F1F3F2',
  },
  modalCancelText: {
    fontWeight: '700',
    color: COLORS.muted,
  },
  modalConfirmButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalConfirmText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
