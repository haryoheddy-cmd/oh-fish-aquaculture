import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Star, Ban } from 'lucide-react-native';

import FormModal, { FormInput, FormChoice } from '../components/FormModal';
import StatusIndicator, { stokToLevel, kondisiAlatToLevel, srToLevel } from '../components/StatusIndicator';
import StrukConfirmModal from '../components/StrukConfirmModal';
import { COLORS, SPACING } from '../theme';
import { formatRupiah, formatTanggal, todayISODate, toNumber } from '../utils/format';
import { hitungPopulasiAktif, sumKematianKonsumsi } from '../utils/leleCalculators';
import { buildStrukData } from '../utils/receiptPrinter';
import { subscribeDataChanged, emitDataChanged } from '../utils/eventBus';
import {
  getAllStok,
  createStok,
  updateStok,
  getAllInventoryAlat,
  createInventoryAlat,
  getAllPenjualBibit,
  createPenjualBibit,
  updatePenjualBibit,
  getAllPopulasiLog,
  getKematianKonsumsiLogByKolam,
  getProfilUser,
} from '../db/queries';

const SECTIONS = [
  { key: 'stok', label: 'Stok Gudang' },
  { key: 'alat', label: 'Alat' },
  { key: 'vendor', label: 'Penjual Bibit' },
];

const KONDISI_LABEL = { baik: 'Baik', rusak: 'Rusak', perbaikan: 'Perbaikan' };

async function computeVendorReputasi(penjualList) {
  const allPopulasi = await getAllPopulasiLog();
  const kematianCache = {};

  const reputasi = {};
  for (const penjual of penjualList) {
    const batches = allPopulasi.filter((p) => p.id_penjual_bibit === penjual.id);
    if (batches.length === 0) {
      reputasi[penjual.id] = null;
      continue;
    }

    let totalBibit = 0;
    let totalAktif = 0;
    for (const batch of batches) {
      if (!kematianCache[batch.id_kolam]) {
        kematianCache[batch.id_kolam] = await getKematianKonsumsiLogByKolam(batch.id_kolam);
      }
      const { totalMati, totalKonsumsi } = sumKematianKonsumsi(kematianCache[batch.id_kolam]);
      totalBibit += batch.jumlah_bibit;
      totalAktif += hitungPopulasiAktif(batch.jumlah_bibit, totalMati, totalKonsumsi);
    }
    reputasi[penjual.id] = totalBibit > 0 ? (totalAktif / totalBibit) * 100 : null;
  }
  return reputasi;
}

export default function VendorStokScreen() {
  const insets = useSafeAreaInsets();
  const [activeSection, setActiveSection] = useState('stok');
  const [stokList, setStokList] = useState(null);
  const [alatList, setAlatList] = useState(null);
  const [vendorList, setVendorList] = useState(null);
  const [vendorReputasi, setVendorReputasi] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const [activeModal, setActiveModal] = useState(null);
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [profil, setProfil] = useState(null);
  const [strukData, setStrukData] = useState(null);

  const loadData = useCallback(async () => {
    const [stok, alat, vendor, profilUser] = await Promise.all([
      getAllStok(),
      getAllInventoryAlat(),
      getAllPenjualBibit(),
      getProfilUser(),
    ]);
    setStokList(stok);
    setAlatList(alat);
    setVendorList(vendor);
    setProfil(profilUser);
    setVendorReputasi(await computeVendorReputasi(vendor));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => subscribeDataChanged(loadData), [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openModal = (type, editItem = null) => {
    if (type === 'stokForm') {
      setForm(
        editItem
          ? {
              namaBarang: editItem.nama_barang,
              jumlahStok: String(editItem.jumlah_stok),
              satuan: editItem.satuan || '',
              batasMinimal: editItem.batas_minimal != null ? String(editItem.batas_minimal) : '',
              jumlahStokSebelumnya: editItem.jumlah_stok,
              hargaSatuan: '',
            }
          : { namaBarang: '', jumlahStok: '', satuan: 'kg', batasMinimal: '', jumlahStokSebelumnya: 0, hargaSatuan: '' }
      );
    } else if (type === 'alatForm') {
      setForm({ tanggalBeli: todayISODate(), kondisi: 'baik' });
    } else if (type === 'vendorForm') {
      setForm({});
    }
    setEditingId(editItem?.id ?? null);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setForm({});
    setEditingId(null);
  };

  const handleSubmitStok = async () => {
    setSaving(true);
    try {
      const jumlahStokBaru = toNumber(form.jumlahStok);
      const payload = {
        namaBarang: form.namaBarang,
        jumlahStok: jumlahStokBaru,
        satuan: form.satuan || null,
        batasMinimal: form.batasMinimal ? toNumber(form.batasMinimal) : null,
      };
      if (editingId) {
        await updateStok(editingId, payload);
      } else {
        await createStok(payload);
      }

      const hargaSatuan = toNumber(form.hargaSatuan);
      const jumlahDibeli = Math.max(jumlahStokBaru - (form.jumlahStokSebelumnya || 0), 0);
      if (hargaSatuan > 0 && jumlahDibeli > 0) {
        setStrukData(
          buildStrukData({
            jenisTransaksi: 'Pembelian Stok',
            namaPeternakan: profil?.nama_peternakan || profil?.nama_panggilan || 'Mister Lele',
            namaPihak: 'Toko/Vendor',
            tanggal: todayISODate(),
            items: [
              {
                nama: form.namaBarang,
                qty: jumlahDibeli,
                satuan: form.satuan || '',
                hargaSatuan,
                subtotal: jumlahDibeli * hargaSatuan,
              },
            ],
          })
        );
      }

      closeModal();
      await loadData();
      emitDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitAlat = async () => {
    setSaving(true);
    try {
      await createInventoryAlat({
        namaAlat: form.namaAlat,
        hargaBeli: form.hargaBeli ? toNumber(form.hargaBeli) : null,
        tanggalBeli: form.tanggalBeli || todayISODate(),
        kondisi: form.kondisi || 'baik',
        biayaPerbaikan: form.biayaPerbaikan ? toNumber(form.biayaPerbaikan) : null,
      });
      closeModal();
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitVendor = async () => {
    setSaving(true);
    try {
      await createPenjualBibit({
        namaPenjual: form.namaPenjual,
        alamat: form.alamat || null,
        kontak: form.kontak || null,
        isRekomended: 0,
        catatan: form.catatan || null,
      });
      closeModal();
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const toggleRekomended = async (vendor) => {
    await updatePenjualBibit(vendor.id, {
      namaPenjual: vendor.nama_penjual,
      alamat: vendor.alamat,
      kontak: vendor.kontak,
      isRekomended: vendor.is_rekomended ? 0 : 1,
      catatan: vendor.catatan,
    });
    await loadData();
  };

  if (stokList === null || alatList === null || vendorList === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.xl * 2 + 80 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.heading}>Stok & Vendor</Text>

        <View style={styles.sectionSwitcher}>
          {SECTIONS.map((section) => {
            const selected = section.key === activeSection;
            return (
              <Pressable
                key={section.key}
                style={[styles.sectionChip, selected && styles.sectionChipSelected]}
                onPress={() => setActiveSection(section.key)}
              >
                <Text style={[styles.sectionChipText, selected && styles.sectionChipTextSelected]}>
                  {section.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeSection === 'stok' && (
          <>
            <Pressable style={styles.addButton} onPress={() => openModal('stokForm')}>
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Tambah Barang</Text>
            </Pressable>

            {stokList.length === 0 && <Text style={styles.emptyText}>Gudang masih kosong.</Text>}

            {stokList.map((item) => (
              <Pressable key={item.id} style={styles.card} onPress={() => openModal('stokForm', item)}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{item.nama_barang}</Text>
                  <StatusIndicator level={stokToLevel(item.jumlah_stok, item.batas_minimal)} size="small" />
                </View>
                <Text style={styles.cardValue}>
                  {item.jumlah_stok} {item.satuan || ''}
                </Text>
                {item.batas_minimal != null && (
                  <Text style={styles.cardSub}>Batas minimal: {item.batas_minimal} {item.satuan || ''}</Text>
                )}
              </Pressable>
            ))}
          </>
        )}

        {activeSection === 'alat' && (
          <>
            <Pressable style={styles.addButton} onPress={() => openModal('alatForm')}>
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Tambah Alat</Text>
            </Pressable>

            {alatList.length === 0 && <Text style={styles.emptyText}>Belum ada alat tercatat.</Text>}

            {alatList.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{item.nama_alat}</Text>
                  <StatusIndicator level={kondisiAlatToLevel(item.kondisi)} label={KONDISI_LABEL[item.kondisi]} size="small" />
                </View>
                {item.harga_beli != null && (
                  <Text style={styles.cardSub}>Harga beli: {formatRupiah(item.harga_beli)} · {formatTanggal(item.tanggal_beli)}</Text>
                )}
                {item.biaya_perbaikan != null && (
                  <Text style={styles.cardSub}>Biaya perbaikan: {formatRupiah(item.biaya_perbaikan)}</Text>
                )}
              </View>
            ))}
          </>
        )}

        {activeSection === 'vendor' && (
          <>
            <Pressable style={styles.addButton} onPress={() => openModal('vendorForm')}>
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Tambah Penjual Bibit</Text>
            </Pressable>

            {vendorList.length === 0 && <Text style={styles.emptyText}>Belum ada penjual bibit tercatat.</Text>}

            {vendorList.map((vendor) => {
              const sr = vendorReputasi[vendor.id];
              return (
                <View key={vendor.id} style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>{vendor.nama_penjual}</Text>
                    <Pressable onPress={() => toggleRekomended(vendor)} style={styles.rekomendedButton}>
                      {vendor.is_rekomended ? (
                        <Star size={18} color={COLORS.warning} fill={COLORS.warning} />
                      ) : (
                        <Ban size={18} color={COLORS.muted} />
                      )}
                    </Pressable>
                  </View>
                  {!!vendor.kontak && <Text style={styles.cardSub}>{vendor.kontak}</Text>}
                  {!!vendor.alamat && <Text style={styles.cardSub}>{vendor.alamat}</Text>}
                  <View style={styles.vendorBadgeRow}>
                    <StatusIndicator
                      level={vendor.is_rekomended ? 'aman' : 'waspada'}
                      label={vendor.is_rekomended ? 'Rekomended' : 'Belum Direkomendasikan'}
                      size="small"
                    />
                    {sr != null && (
                      <StatusIndicator level={srToLevel(sr)} label={`SR ${sr.toFixed(0)}%`} size="small" />
                    )}
                  </View>
                  {!!vendor.catatan && <Text style={styles.cardSub}>{vendor.catatan}</Text>}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <FormModal
        visible={activeModal === 'stokForm'}
        title={editingId ? 'Ubah Stok' : 'Tambah Barang'}
        onClose={closeModal}
        onSubmit={handleSubmitStok}
        submitDisabled={saving || !form.namaBarang}
      >
        <FormInput label="Nama Barang" value={form.namaBarang} onChangeText={(v) => setForm((f) => ({ ...f, namaBarang: v }))} />
        <FormInput
          label="Jumlah Stok"
          keyboardType="numeric"
          helperText={editingId ? 'Total stok terbaru setelah ditambah/dikurangi' : undefined}
          value={form.jumlahStok}
          onChangeText={(v) => setForm((f) => ({ ...f, jumlahStok: v }))}
        />
        <FormInput label="Satuan (contoh: kg, sak, botol)" value={form.satuan} onChangeText={(v) => setForm((f) => ({ ...f, satuan: v }))} />
        <FormInput label="Batas Minimal (opsional)" keyboardType="numeric" value={form.batasMinimal} onChangeText={(v) => setForm((f) => ({ ...f, batasMinimal: v }))} />
        <FormInput
          label="Harga Satuan Pembelian (Rp, opsional)"
          keyboardType="numeric"
          placeholder="Contoh: 12000"
          helperText="Isi untuk mencetak Nota Pembelian Stok setelah disimpan."
          value={form.hargaSatuan}
          onChangeText={(v) => setForm((f) => ({ ...f, hargaSatuan: v }))}
        />
      </FormModal>

      <StrukConfirmModal
        visible={!!strukData}
        data={strukData}
        onClose={() => setStrukData(null)}
        title="Pembelian Stok Tersimpan"
      />

      <FormModal
        visible={activeModal === 'alatForm'}
        title="Tambah Alat"
        onClose={closeModal}
        onSubmit={handleSubmitAlat}
        submitDisabled={saving}
      >
        <FormInput label="Nama Alat" value={form.namaAlat} onChangeText={(v) => setForm((f) => ({ ...f, namaAlat: v }))} />
        <FormInput label="Harga Beli (Rp)" keyboardType="numeric" value={form.hargaBeli} onChangeText={(v) => setForm((f) => ({ ...f, hargaBeli: v }))} />
        <FormInput label="Tanggal Beli" value={form.tanggalBeli} onChangeText={(v) => setForm((f) => ({ ...f, tanggalBeli: v }))} />
        <FormChoice
          label="Kondisi"
          value={form.kondisi}
          onChange={(v) => setForm((f) => ({ ...f, kondisi: v }))}
          options={[
            { label: 'Baik', value: 'baik' },
            { label: 'Perbaikan', value: 'perbaikan' },
            { label: 'Rusak', value: 'rusak' },
          ]}
        />
        <FormInput label="Biaya Perbaikan (opsional)" keyboardType="numeric" value={form.biayaPerbaikan} onChangeText={(v) => setForm((f) => ({ ...f, biayaPerbaikan: v }))} />
      </FormModal>

      <FormModal
        visible={activeModal === 'vendorForm'}
        title="Tambah Penjual Bibit"
        onClose={closeModal}
        onSubmit={handleSubmitVendor}
        submitDisabled={saving || !form.namaPenjual}
      >
        <FormInput label="Nama Penjual" value={form.namaPenjual} onChangeText={(v) => setForm((f) => ({ ...f, namaPenjual: v }))} />
        <FormInput label="No. Kontak" keyboardType="phone-pad" value={form.kontak} onChangeText={(v) => setForm((f) => ({ ...f, kontak: v }))} />
        <FormInput label="Alamat" value={form.alamat} onChangeText={(v) => setForm((f) => ({ ...f, alamat: v }))} />
        <FormInput label="Catatan (opsional)" value={form.catatan} onChangeText={(v) => setForm((f) => ({ ...f, catatan: v }))} />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xl * 2 },
  heading: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.md },
  sectionSwitcher: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg, flexWrap: 'wrap' },
  sectionChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sectionChipText: { fontSize: 13, fontWeight: '700', color: COLORS.muted },
  sectionChipTextSelected: { color: '#FFFFFF' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 14,
    marginBottom: SPACING.lg,
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '700', marginLeft: 6 },
  emptyText: { color: COLORS.muted, fontSize: 14, marginBottom: SPACING.md },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, flexShrink: 1, marginRight: SPACING.sm },
  cardSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  cardValue: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 6 },
  rekomendedButton: { padding: 4 },
  vendorBadgeRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm, flexWrap: 'wrap' },
});
