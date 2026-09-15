import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lightbulb, Plus, Search, Star } from 'lucide-react-native';

import TipCard from '../components/TipCard';
import QuoteCard from '../components/QuoteCard';
import TipFormModal from '../components/TipFormModal';
import QuoteFormModal from '../components/QuoteFormModal';
import { COLORS, SPACING } from '../theme';
import { subscribeDataChanged, emitDataChanged } from '../utils/eventBus';
import { TIPS_KATEGORI, TIPS_LIST, TIP_SOURCE_BUILTIN, TIP_SOURCE_CUSTOM } from '../constants/tips';
import {
  getAllCustomTips,
  createCustomTip,
  updateCustomTip,
  deleteCustomTip,
  getAllQuotes,
  createQuote,
  updateQuote,
  deleteQuote,
  getAllTipFavorites,
  addTipFavorite,
  removeTipFavorite,
} from '../db/queries';

const KATEGORI_CHIPS = [{ id: null, nama: 'Semua', emoji: '📋' }, ...TIPS_KATEGORI];

export default function TipsScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('tips'); // 'tips' | 'kutipan'
  const [query, setQuery] = useState('');
  const [activeKategori, setActiveKategori] = useState(null);
  const [favoritOnly, setFavoritOnly] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const [customTips, setCustomTips] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [favorites, setFavorites] = useState(new Set());

  const [tipModal, setTipModal] = useState({ visible: false, editing: null });
  const [tipForm, setTipForm] = useState({});
  const [quoteModal, setQuoteModal] = useState({ visible: false, editing: null });
  const [quoteForm, setQuoteForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const [customRows, quoteRows, favRows] = await Promise.all([
      getAllCustomTips(),
      getAllQuotes(),
      getAllTipFavorites(),
    ]);
    setCustomTips(customRows);
    setQuotes(quoteRows);
    setFavorites(new Set(favRows.map((f) => `${f.tip_type}:${f.tip_id}`)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => subscribeDataChanged(loadData), [loadData]);

  const allTips = useMemo(() => {
    const builtinTips = TIPS_LIST.map((t) => ({
      source: TIP_SOURCE_BUILTIN,
      id: t.id,
      favKey: `${TIP_SOURCE_BUILTIN}:${t.id}`,
      kategori: t.kategori,
      judul: t.judul,
      ringkasan: t.ringkasan,
      isi: t.isi,
      sumber: null,
      raw: null,
    }));

    const customTipsMapped = customTips.map((row) => ({
      source: TIP_SOURCE_CUSTOM,
      id: row.id,
      favKey: `${TIP_SOURCE_CUSTOM}:${row.id}`,
      kategori: row.kategori,
      judul: row.judul,
      ringkasan: row.isi.length > 100 ? `${row.isi.slice(0, 100)}…` : row.isi,
      isi: row.isi,
      sumber: row.sumber,
      raw: row,
    }));

    return [...customTipsMapped, ...builtinTips];
  }, [customTips]);

  const filteredTips = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTips.filter((tip) => {
      if (favoritOnly && !favorites.has(tip.favKey)) return false;
      if (activeKategori && tip.kategori !== activeKategori) return false;
      if (!q) return true;
      return (
        tip.judul.toLowerCase().includes(q) ||
        tip.ringkasan.toLowerCase().includes(q) ||
        tip.isi.toLowerCase().includes(q) ||
        (tip.sumber || '').toLowerCase().includes(q)
      );
    });
  }, [allTips, query, activeKategori, favoritOnly, favorites]);

  // ---------- custom tip handlers ----------

  const openAddTip = () => {
    setTipForm({ judul: '', kategori: activeKategori || TIPS_KATEGORI[0].id, sumber: '', isi: '' });
    setTipModal({ visible: true, editing: null });
  };

  const openEditTip = (tip) => {
    setTipForm({
      judul: tip.raw.judul,
      kategori: tip.raw.kategori,
      sumber: tip.raw.sumber || '',
      isi: tip.raw.isi,
    });
    setTipModal({ visible: true, editing: tip.raw });
  };

  const closeTipModal = () => {
    setTipModal({ visible: false, editing: null });
    setTipForm({});
  };

  const handleSubmitTip = async () => {
    if (!tipForm.judul || !tipForm.kategori || !tipForm.isi) return;
    setSaving(true);
    try {
      const payload = {
        judul: tipForm.judul,
        kategori: tipForm.kategori,
        sumber: tipForm.sumber || null,
        isi: tipForm.isi,
      };
      if (tipModal.editing) {
        await updateCustomTip(tipModal.editing.id, payload);
      } else {
        await createCustomTip(payload);
      }
      closeTipModal();
      await loadData();
      emitDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteTip = (tip) => {
    Alert.alert('Hapus Tips', `Tips "${tip.judul}" buatanmu akan dihapus permanen. Lanjutkan?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomTip(tip.id);
          if (expandedId === tip.favKey) setExpandedId(null);
          await loadData();
          emitDataChanged();
        },
      },
    ]);
  };

  const toggleFavoriteTip = async (tip) => {
    if (favorites.has(tip.favKey)) {
      await removeTipFavorite(tip.source, tip.id);
    } else {
      await addTipFavorite(tip.source, tip.id);
    }
    await loadData();
  };

  // ---------- quote handlers ----------

  const openAddQuote = () => {
    setQuoteForm({ kalimat: '', sumber: '' });
    setQuoteModal({ visible: true, editing: null });
  };

  const openEditQuote = (quote) => {
    setQuoteForm({ kalimat: quote.kalimat, sumber: quote.sumber || '' });
    setQuoteModal({ visible: true, editing: quote });
  };

  const closeQuoteModal = () => {
    setQuoteModal({ visible: false, editing: null });
    setQuoteForm({});
  };

  const handleSubmitQuote = async () => {
    if (!quoteForm.kalimat) return;
    setSaving(true);
    try {
      const payload = { kalimat: quoteForm.kalimat, sumber: quoteForm.sumber || null };
      if (quoteModal.editing) {
        await updateQuote(quoteModal.editing.id, payload);
      } else {
        await createQuote(payload);
      }
      closeQuoteModal();
      await loadData();
      emitDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteQuote = (quote) => {
    Alert.alert('Hapus Nasihat', 'Nasihat/kutipan ini akan dihapus permanen. Lanjutkan?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deleteQuote(quote.id);
          await loadData();
          emitDataChanged();
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
        <View style={styles.headingRow}>
          <View style={styles.headingTextRow}>
            <Lightbulb size={22} color={COLORS.primary} />
            <Text style={styles.heading}>Tips & Trik Peternak</Text>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={mode === 'tips' ? openAddTip : openAddQuote}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>{mode === 'tips' ? 'Tips' : 'Nasihat'}</Text>
          </Pressable>
        </View>
        <Text style={styles.subheading}>
          {mode === 'tips'
            ? 'Kumpulan trik praktis budidaya, dari perawatan air sampai persiapan kolam.'
            : 'Kata bijak dan pengingat singkat dari sesama peternak.'}
        </Text>

        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeButton, mode === 'tips' && styles.modeButtonActive]}
            onPress={() => setMode('tips')}
          >
            <Text style={[styles.modeButtonText, mode === 'tips' && styles.modeButtonTextActive]}>
              📚 Tips & Trik
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, mode === 'kutipan' && styles.modeButtonActive]}
            onPress={() => setMode('kutipan')}
          >
            <Text style={[styles.modeButtonText, mode === 'kutipan' && styles.modeButtonTextActive]}>
              💬 Nasihat & Kutipan
            </Text>
          </Pressable>
        </View>

        {mode === 'tips' ? (
          <>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Search size={16} color={COLORS.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari tips... (misal: pH, FCR, kumis putih)"
                  placeholderTextColor={COLORS.muted}
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                />
              </View>
              <Pressable
                style={[styles.favoritToggle, favoritOnly && styles.favoritToggleActive]}
                onPress={() => setFavoritOnly((v) => !v)}
                hitSlop={8}
              >
                <Star size={18} color={favoritOnly ? '#FFFFFF' : COLORS.warning} fill={favoritOnly ? '#FFFFFF' : 'none'} />
              </Pressable>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={KATEGORI_CHIPS}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.chipRow}
              renderItem={({ item }) => {
                const selected = activeKategori === item.id;
                return (
                  <Pressable
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setActiveKategori(item.id)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {item.emoji} {item.nama}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </>
        ) : null}
      </View>

      {mode === 'tips' ? (
        <FlatList
          data={filteredTips}
          keyExtractor={(item) => item.favKey}
          renderItem={({ item }) => (
            <TipCard
              tip={item}
              expanded={expandedId === item.favKey}
              isFavorite={favorites.has(item.favKey)}
              onToggleExpand={() => setExpandedId((cur) => (cur === item.favKey ? null : item.favKey))}
              onToggleFavorite={() => toggleFavoriteTip(item)}
              onEdit={() => openEditTip(item)}
              onDelete={() => confirmDeleteTip(item)}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + SPACING.xl * 2 }]}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {favoritOnly ? 'Belum ada tips favorit. Tandai tips dengan ikon ⭐.' : 'Tidak ada tips yang cocok. Coba kata kunci lain.'}
            </Text>
          }
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <QuoteCard quote={item} onEdit={() => openEditQuote(item)} onDelete={() => confirmDeleteQuote(item)} />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + SPACING.xl * 2 }]}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Belum ada nasihat/kutipan. Tambahkan kata bijak dari pengalamanmu sendiri!
            </Text>
          }
          keyboardShouldPersistTaps="handled"
        />
      )}

      <TipFormModal
        visible={tipModal.visible}
        title={tipModal.editing ? 'Ubah Tips' : 'Tambah Tips Baru'}
        form={tipForm}
        setForm={setTipForm}
        onClose={closeTipModal}
        onSubmit={handleSubmitTip}
        submitDisabled={saving || !tipForm.judul || !tipForm.kategori || !tipForm.isi}
      />

      <QuoteFormModal
        visible={quoteModal.visible}
        title={quoteModal.editing ? 'Ubah Nasihat' : 'Tambah Nasihat Baru'}
        form={quoteForm}
        setForm={setQuoteForm}
        onClose={closeQuoteModal}
        onSubmit={handleSubmitQuote}
        submitDisabled={saving || !quoteForm.kalimat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headingTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexShrink: 1,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    flexShrink: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 13,
  },
  subheading: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 999,
    padding: 4,
    marginBottom: SPACING.md,
  },
  modeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  favoritToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoritToggleActive: {
    backgroundColor: COLORS.warning,
  },
  chipRow: {
    gap: SPACING.sm,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});
