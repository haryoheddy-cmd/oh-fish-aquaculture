import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fish, User, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';

import { FormInput } from '../components/FormModal';
import { COLORS, SPACING } from '../theme';
import { subscribeDataChanged, emitDataChanged } from '../utils/eventBus';
import { getAllKolam, getProfilUser, updateProfilUser } from '../db/queries';

const APP_VERSION = '1.0.0';

async function pickAndPersistProfilePhoto() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Izin Diperlukan', 'Mister Lele butuh akses galeri untuk memilih foto profil.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
  });

  if (result.canceled || !result.assets?.length) return null;

  const pickedUri = result.assets[0].uri;
  try {
    const source = new File(pickedUri);
    const destination = new File(Paths.document, 'profile-photo.jpg');
    await source.copy(destination, { overwrite: true });
    return `${destination.uri}?t=${Date.now()}`;
  } catch {
    return pickedUri;
  }
}

export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const [totalKolam, setTotalKolam] = useState(null);
  const [form, setForm] = useState({ namaPanggilan: '', namaPeternakan: '', fotoProfilUri: null });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const [kolamList, profil] = await Promise.all([getAllKolam(), getProfilUser()]);
    setTotalKolam(kolamList.length);
    setForm({
      namaPanggilan: profil?.nama_panggilan || '',
      namaPeternakan: profil?.nama_peternakan || '',
      fotoProfilUri: profil?.foto_profil_uri || null,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => subscribeDataChanged(loadData), [loadData]);

  const handlePickPhoto = async () => {
    const uri = await pickAndPersistProfilePhoto();
    if (uri) {
      setForm((f) => ({ ...f, fotoProfilUri: uri }));
    }
  };

  const handleSaveProfil = async () => {
    setSaving(true);
    try {
      await updateProfilUser({
        namaPanggilan: form.namaPanggilan || null,
        namaPeternakan: form.namaPeternakan || null,
        fotoProfilUri: form.fotoProfilUri || null,
      });
      emitDataChanged();
      Alert.alert('Tersimpan', 'Profil kamu berhasil diperbarui.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + 100 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Profil</Text>

        <View style={styles.editCard}>
          <Pressable style={styles.avatarWrap} onPress={handlePickPhoto}>
            {form.fotoProfilUri ? (
              <Image source={{ uri: form.fotoProfilUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={28} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Camera size={14} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>Pilih Foto Profil</Text>

          <FormInput
            label="Nama Pengguna"
            placeholder="Contoh: Pak Haryo"
            value={form.namaPanggilan}
            onChangeText={(v) => setForm((f) => ({ ...f, namaPanggilan: v }))}
          />
          <FormInput
            label="Nama Peternakan / Usaha"
            placeholder="Contoh: Lele Jaya Farm"
            value={form.namaPeternakan}
            onChangeText={(v) => setForm((f) => ({ ...f, namaPeternakan: v }))}
          />

          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveProfil}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Tentang Aplikasi</Text>
        <View style={styles.appCard}>
          <View style={styles.appIconWrap}>
            <Fish size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>Mister Lele</Text>
          <Text style={styles.appTagline}>Aplikasi manajemen budidaya lele & ikan air tawar</Text>
        </View>

        <Text style={styles.sectionTitle}>Informasi</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Total Kolam Terdaftar" value={totalKolam ?? '-'} />
          <InfoRow label="Versi Aplikasi" value={APP_VERSION} />
          <InfoRow label="Basis Data" value="Lokal (SQLite)" last />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Mister Lele v{APP_VERSION}</Text>
          <Text style={styles.footerText}>Created & Designed by Haryo Heddy N.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  editCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    marginBottom: SPACING.xs,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  avatarHint: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  saveButton: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  appCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  appIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  appTagline: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.muted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.muted,
    opacity: 0.6,
    textAlign: 'center',
  },
});
