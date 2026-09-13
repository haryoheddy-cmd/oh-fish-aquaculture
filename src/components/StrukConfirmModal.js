import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bluetooth, Check, FileText, X } from 'lucide-react-native';

import { COLORS, SPACING } from '../theme';
import { formatRupiah } from '../utils/format';
import { cetakStrukBluetooth, cetakStrukPdf } from '../utils/receiptPrinter';

export default function StrukConfirmModal({ visible, data, onClose, title = 'Transaksi Tersimpan' }) {
  const insets = useSafeAreaInsets();
  const [printingPdf, setPrintingPdf] = useState(false);
  const [printingBt, setPrintingBt] = useState(false);

  const handlePdf = async () => {
    setPrintingPdf(true);
    try {
      await cetakStrukPdf(data);
    } catch {
      Alert.alert('Gagal Cetak', 'Terjadi kesalahan saat membuat struk PDF.');
    } finally {
      setPrintingPdf(false);
    }
  };

  const handleBluetooth = async () => {
    setPrintingBt(true);
    try {
      await cetakStrukBluetooth(data);
    } catch {
      Alert.alert('Gagal Cetak', 'Terjadi kesalahan saat menyiapkan struk Bluetooth.');
    } finally {
      setPrintingBt(false);
    }
  };

  return (
    <Modal visible={visible && !!data} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.lg }]}>
          <Pressable style={styles.closeIcon} onPress={onClose} hitSlop={12}>
            <X size={20} color={COLORS.muted} />
          </Pressable>

          <View style={styles.iconWrap}>
            <Check size={26} color={COLORS.success} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {data ? <Text style={styles.total}>{formatRupiah(data.total)}</Text> : null}
          {data?.namaPihak ? <Text style={styles.hint}>{data.namaPihak}</Text> : null}

          <Pressable style={[styles.pdfButton, printingPdf && styles.buttonDisabled]} onPress={handlePdf} disabled={printingPdf}>
            <FileText size={18} color="#FFFFFF" />
            <Text style={styles.pdfButtonText}>{printingPdf ? 'Menyiapkan...' : '📄 Cetak Struk (PDF)'}</Text>
          </Pressable>

          <Pressable style={[styles.btButton, printingBt && styles.buttonDisabled]} onPress={handleBluetooth} disabled={printingBt}>
            <Bluetooth size={18} color={COLORS.primary} />
            <Text style={styles.btButtonText}>{printingBt ? 'Menyiapkan...' : '🪪 Print Struk (Bluetooth)'}</Text>
          </Pressable>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Selesai</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
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
    alignItems: 'center',
  },
  closeIcon: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  total: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  hint: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
    marginBottom: SPACING.lg,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  pdfButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  btButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: SPACING.md,
    gap: 8,
  },
  btButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  closeButton: {
    alignSelf: 'stretch',
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.muted,
    fontWeight: '700',
  },
});
