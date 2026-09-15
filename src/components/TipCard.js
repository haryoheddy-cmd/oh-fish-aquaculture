import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronUp, Pencil, Star, Trash2 } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { getKategoriTips } from '../constants/tips';

export default function TipCard({ tip, expanded, isFavorite, onToggleExpand, onToggleFavorite, onEdit, onDelete }) {
  const kategori = getKategoriTips(tip.kategori);

  return (
    <Pressable style={styles.card} onPress={onToggleExpand}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <View style={styles.pillRow}>
            {kategori ? (
              <View style={styles.kategoriPill}>
                <Text style={styles.kategoriPillText}>
                  {kategori.emoji} {kategori.nama}
                </Text>
              </View>
            ) : null}
            {tip.source === 'custom' ? (
              <View style={styles.customPill}>
                <Text style={styles.customPillText}>Tips Saya</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.title}>{tip.judul}</Text>
          {tip.sumber ? <Text style={styles.sumber}>Sumber: {tip.sumber}</Text> : null}
          <Text style={styles.ringkasan} numberOfLines={expanded ? undefined : 2}>
            {tip.ringkasan}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable hitSlop={8} onPress={onToggleFavorite}>
            <Star size={20} color={isFavorite ? COLORS.warning : COLORS.muted} fill={isFavorite ? COLORS.warning : 'none'} />
          </Pressable>
          {expanded ? <ChevronUp size={20} color={COLORS.muted} /> : <ChevronDown size={20} color={COLORS.muted} />}
        </View>
      </View>

      {expanded ? (
        <View style={styles.body}>
          <Text style={styles.bodyText}>{tip.isi}</Text>

          {tip.source === 'custom' ? (
            <View style={styles.actionsRow}>
              <Pressable style={styles.actionButton} onPress={onEdit}>
                <Pencil size={15} color={COLORS.muted} />
                <Text style={styles.actionText}>Edit</Text>
              </Pressable>
              <Pressable style={styles.actionButton} onPress={onDelete}>
                <Trash2 size={15} color={COLORS.danger} />
                <Text style={[styles.actionText, { color: COLORS.danger }]}>Hapus</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerActions: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  kategoriPill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  kategoriPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  customPill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.infoBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  customPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.info,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  sumber: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: 4,
  },
  ringkasan: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
  },
  body: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bodyText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
});
