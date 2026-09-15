import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';

export default function FormModal({
  visible,
  title,
  onClose,
  onSubmit,
  submitLabel = 'Simpan',
  submitDisabled = false,
  children,
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheetWrapper}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <X size={22} color={COLORS.muted} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Batal</Text>
              </Pressable>
              <Pressable
                style={[styles.submitButton, submitDisabled && styles.submitButtonDisabled]}
                onPress={onSubmit}
                disabled={submitDisabled}
              >
                <Text style={styles.submitText}>{submitLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function FormField({ label, helperText, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {helperText ? <Text style={styles.fieldHelperText}>{helperText}</Text> : null}
    </View>
  );
}

export function FormInput({ label, helperText, onSubmitEditing, style, ...textInputProps }) {
  return (
    <FormField label={label} helperText={helperText}>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="#9CA3AF"
        returnKeyType="done"
        onSubmitEditing={(e) => {
          Keyboard.dismiss();
          onSubmitEditing?.(e);
        }}
        {...textInputProps}
      />
    </FormField>
  );
}

export function FormChoice({ label, helperText, options, value, onChange }) {
  return (
    <FormField label={label} helperText={helperText}>
      <View style={styles.choiceRow}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={String(opt.value)}
              style={[styles.choiceChip, selected && styles.choiceChipSelected]}
              onPress={() => onChange(opt.value)}
            >
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </FormField>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 22, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
    maxHeight: '88%',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollArea: {
    flexGrow: 0,
    flexShrink: 1,
  },
  body: {
    paddingBottom: SPACING.md,
  },
  field: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: SPACING.xs,
  },
  fieldHelperText: {
    fontSize: 11,
    color: COLORS.muted,
    opacity: 0.8,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: '#FAFBFA',
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  choiceChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FAFBFA',
  },
  choiceChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  choiceText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
  },
  choiceTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F1F3F2',
  },
  cancelText: {
    fontWeight: '700',
    color: COLORS.muted,
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
