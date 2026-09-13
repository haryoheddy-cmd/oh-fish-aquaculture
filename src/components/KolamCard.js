import { Pressable, StyleSheet, Text, View } from 'react-native';
import StatusIndicator, { tebarStatusToLevel, tebarStatusToLabel } from './StatusIndicator';
import Sparkline from './Sparkline';
import { COLORS, SPACING } from '../theme';

export default function KolamCard({ summary, onPress, footer }) {
  const {
    kolam,
    populasiAktif,
    sr: survivalRate,
    biomassaKg,
    level = 'aman',
    specKolam,
    statusTebar,
    jenisPelet,
    porsiPakanHarian,
    komoditasPreset,
    isLobster,
    latestAerator,
    aeratorLevel,
    latestMolting,
    moltingAlert,
    prediksiMolting,
    targetPanenEfektifGram,
    trackerProgressPercent,
    trackerSisaHari,
    trackerStatus,
    trackerBeratSaatIniGram,
    samplingLogs,
    totalTerjualKg,
  } = summary;

  const samplingTrend = (samplingLogs || [])
    .slice()
    .reverse()
    .slice(-10)
    .map((s) => s.berat_rata_rata_gram)
    .filter((v) => v != null);
  const punyaTrenBerat = samplingTrend.length >= 2;

  const punyaSpesifikasi = Boolean(kolam.bentuk && kolam.tipe_budidaya);
  const totalBoxApartemen = Boolean(kolam.is_bertingkat) ? specKolam?.tebarMaksimalEkor?.max ?? 0 : 0;
  const punyaBadge = Boolean(komoditasPreset) || Boolean(kolam.is_bertingkat);
  const punyaKapasitasTebar = Boolean(specKolam?.tebarMaksimalEkor?.max > 0);
  const punyaKetinggianAir = Boolean(punyaSpesifikasi && specKolam?.volumeAirM3 > 0);
  const punyaPorsiPakan = Boolean(
    porsiPakanHarian && porsiPakanHarian.pagi + porsiPakanHarian.sore + porsiPakanHarian.malam > 0
  );
  const punyaAlertBox = Boolean(latestAerator) || Boolean(isLobster && moltingAlert);
  const punyaHarvestTracker = trackerProgressPercent != null;
  const punyaTerjual = Boolean(totalTerjualKg > 0);
  const progressClamped = Math.min(Math.max(trackerProgressPercent ?? 0, 0), 100);
  const siapPanen = trackerSisaHari != null && trackerSisaHari <= 0;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {kolam.nama_kolam}
        </Text>
        <StatusIndicator level={level} />
      </View>

      {punyaBadge ? (
        <View style={styles.badgeRow}>
          {Boolean(komoditasPreset) ? (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>
                {komoditasPreset.emoji} {komoditasPreset.nama}
              </Text>
            </View>
          ) : null}
          {Boolean(kolam.is_bertingkat) ? (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>
                🏢 Apartemen {kolam.jumlah_tingkat ?? 0} Tingkat (Total {totalBoxApartemen} Box)
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {punyaSpesifikasi ? (
        <Text style={styles.specLine}>
          {kolam.bentuk} • {kolam.tipe_budidaya}
        </Text>
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{populasiAktif ?? '-'}</Text>
          <Text style={styles.statLabel}>ekor hidup</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{survivalRate != null ? `${survivalRate.toFixed(0)}%` : '-'}</Text>
          <Text style={styles.statLabel}>survival rate</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{biomassaKg != null ? `${biomassaKg.toFixed(1)} kg` : '-'}</Text>
          <Text style={styles.statLabel}>biomassa</Text>
        </View>
      </View>

      {punyaTerjual ? (
        <View style={styles.terjualBox}>
          <Text style={styles.terjualText}>
            Terjual: {totalTerjualKg.toFixed(1)} kg · Sisa Kolam: {biomassaKg != null ? biomassaKg.toFixed(1) : '-'} kg (
            {populasiAktif ?? 0} ekor)
          </Text>
        </View>
      ) : null}

      {punyaTrenBerat ? (
        <View style={styles.trendRow}>
          <Text style={styles.trendLabel}>Tren Berat Sampling</Text>
          <View style={styles.trendChartRow}>
            <Sparkline values={samplingTrend} width={90} height={28} />
            <Text style={styles.trendValue}>{samplingTrend[samplingTrend.length - 1].toFixed(0)}g terakhir</Text>
          </View>
        </View>
      ) : null}

      {punyaHarvestTracker ? (
        <View style={styles.harvestBox}>
          <View style={styles.harvestHeaderRow}>
            {Boolean(trackerStatus && !siapPanen) ? (
              <Text style={styles.harvestPhaseLabel}>{trackerStatus}</Text>
            ) : (
              <View />
            )}
            {trackerSisaHari != null ? (
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>
                  {siapPanen ? '🎉 Siap Panen!' : `⏳ Sisa ${trackerSisaHari} Hari Lagi`}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressClamped}%` }]} />
          </View>

          {trackerBeratSaatIniGram != null ? (
            <Text style={styles.harvestWeightLine}>
              {Math.round(trackerBeratSaatIniGram)}g{targetPanenEfektifGram ? ` / Target ${targetPanenEfektifGram}g` : ''}
            </Text>
          ) : null}
        </View>
      ) : null}

      {punyaKapasitasTebar ? (
        <View style={styles.specBox}>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Kapasitas Tebar</Text>
            <View style={styles.specValueRow}>
              <Text style={styles.specValue}>
                {populasiAktif ?? 0} / {specKolam.tebarMaksimalEkor.max} {kolam.is_bertingkat ? 'ekor (box)' : 'ekor'}
              </Text>
              <StatusIndicator
                level={tebarStatusToLevel(statusTebar)}
                label={tebarStatusToLabel(statusTebar)}
                size="small"
              />
            </View>
          </View>

          {punyaKetinggianAir ? (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Ketinggian Air</Text>
              <Text style={styles.specValue}>
                {kolam.ketinggian_air ?? '-'} cm{' '}
                <Text style={styles.specValueMuted}>
                  (ideal {specKolam.ketinggianIdealCm.min}-{specKolam.ketinggianIdealCm.max} cm)
                </Text>
              </Text>
            </View>
          ) : null}

          {Boolean(jenisPelet) ? (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Rekomendasi Pelet</Text>
              <Text style={styles.specValue}>{jenisPelet}</Text>
            </View>
          ) : null}

          {punyaPorsiPakan ? (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Porsi Pakan/Hari</Text>
              <Text style={styles.specValue}>
                Pagi {porsiPakanHarian.pagi.toFixed(2)} • Sore {porsiPakanHarian.sore.toFixed(2)} • Malam{' '}
                {porsiPakanHarian.malam.toFixed(2)} kg
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {punyaAlertBox ? (
        <View style={styles.alertBox}>
          {Boolean(latestAerator) ? (
            <View style={styles.alertRow}>
              <StatusIndicator level={aeratorLevel} label={`Aerator ${latestAerator.status_aerator}`} size="small" />
            </View>
          ) : null}
          {Boolean(isLobster && moltingAlert) ? (
            <View style={styles.alertRow}>
              <StatusIndicator level="waspada" label="Molting/Karantina" size="small" />
              <Text style={styles.alertText}>
                {latestMolting?.nomor_box ? `Box ${latestMolting.nomor_box}` : 'Ada lobster'} sedang berganti
                cangkang{prediksiMolting ? ` • molting berikutnya ±${prediksiMolting.tanggalPrediksiBerikutnya}` : ''}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  badgePill: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  alertBox: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  alertText: {
    fontSize: 12,
    color: COLORS.muted,
    flexShrink: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flexShrink: 1,
    marginRight: SPACING.sm,
  },
  specLine: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  terjualBox: {
    backgroundColor: COLORS.infoBg,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  terjualText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.info,
  },
  trendRow: {
    marginBottom: SPACING.md,
  },
  trendLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: 4,
  },
  trendChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  harvestBox: {
    marginBottom: SPACING.md,
  },
  harvestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  harvestPhaseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  countdownBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  harvestWeightLine: {
    marginTop: SPACING.xs,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  specBox: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  specRow: {
    marginBottom: SPACING.xs,
  },
  specLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: 2,
  },
  specValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  specValueMuted: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.muted,
  },
  footer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
