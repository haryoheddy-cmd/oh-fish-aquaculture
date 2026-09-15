import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Pencil, Quote, Trash2 } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';

export default function QuoteCard({ quote, onEdit, onDelete }) {
  return (
    <View style={styles.card}>
      <Quote size={22} color={COLORS.primary} style={styles.quoteIcon} />
      <Text style={styles.kalimat}>{quote.kalimat}</Text>
      <View style={styles.footerRow}>
        <Text style={styles.sumber}>{quote.sumber ? `— ${quote.sumber}` : '— Anonim'}</Text>
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionButton} hitSlop={8} onPress={onEdit}>
            <Pencil size={15} color={COLORS.muted} />
          </Pressable>
          <Pressable style={styles.actionButton} hitSlop={8} onPress={onDelete}>
            <Trash2 size={15} color={COLORS.danger} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 18,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  quoteIcon: {
    marginBottom: SPACING.xs,
  },
  kalimat: {
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    color: COLORS.primary,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sumber: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    opacity: 0.8,
    flexShrink: 1,
    marginRight: SPACING.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    padding: 2,
  },
});
