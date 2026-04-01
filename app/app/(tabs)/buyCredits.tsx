import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { AnimatedScreen, AnimatedListItem } from '@/components/ui/AnimatedScreen';
import { Colors, Spacing, Typography, Radii, Shadows } from '@/constants/DesignTokens';
import { useNavigation } from '@/contexts/NavigationContext';
import { useCreditBalance, useCreditPacks, CreditPack } from '@/lib/queries';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getDiscount(pack: CreditPack): number {
  const basePricePerCredit = 1.5; // R1.50 per credit at Starter rate
  const actualPricePerCredit = pack.price_zar / pack.credits;
  return Math.round((1 - actualPricePerCredit / basePricePerCredit) * 100);
}

function CreditPackCard({
  pack,
  index,
}: {
  pack: CreditPack;
  index: number;
}) {
  const discount = getDiscount(pack);
  const pricePerCredit = (pack.price_zar / pack.credits).toFixed(2);

  return (
    <AnimatedListItem index={index}>
      <Pressable
        style={({ pressed }) => [
          styles.packCard,
          pressed && styles.packCardPressed,
        ]}
        onPress={() => {/* Stripe checkout */}}
      >
        <View style={styles.packHeader}>
          <View style={styles.packIconCircle}>
            <Icon name="lightning-bolt" size={20} color={Colors.orange} />
          </View>
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% off</Text>
            </View>
          )}
        </View>

        <Text style={styles.packName}>{pack.name}</Text>
        <Text style={styles.packCredits}>{pack.credits} credits</Text>

        <View style={styles.packPricing}>
          <Text style={styles.packPrice}>R{pack.price_zar}</Text>
          <Text style={styles.packPerCredit}>R{pricePerCredit}/credit</Text>
        </View>
      </Pressable>
    </AnimatedListItem>
  );
}

export default function BuyCreditsScreen() {
  const { setActiveTab, setNavigationMode } = useNavigation();
  const insets = useSafeAreaInsets();
  const { data: balance } = useCreditBalance();
  const { data: packs } = useCreditPacks();

  useEffect(() => {
    setActiveTab('settings');
    setNavigationMode('detail');
  }, []);

  return (
    <View style={styles.container}>
      <PageHeader
        title="Buy Credits"
        level="portfolio"
        onBackPress={() => router.back()}
      />

      <AnimatedScreen>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Balance */}
          <AnimatedListItem index={0}>
            <View style={styles.balanceCard}>
              <Icon name="lightning-bolt" size={20} color={Colors.orange} />
              <Text style={styles.balanceText}>
                You have <Text style={styles.balanceBold}>{balance?.total ?? 0} credits</Text>
              </Text>
            </View>
          </AnimatedListItem>

          <Text style={styles.sectionTitle}>CREDIT PACKS</Text>
          <Text style={styles.sectionSubtitle}>Purchased credits never expire</Text>

          {packs?.map((pack, idx) => (
            <CreditPackCard
              key={pack.id}
              pack={pack}
              index={idx + 1}
            />
          ))}
        </ScrollView>
      </AnimatedScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCanvas,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orangeSoft,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  balanceText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textDark,
  },
  balanceBold: {
    fontFamily: Typography.fontFamily.bodySemiBold,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.xxs,
    marginLeft: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  packCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  packCardPressed: {
    backgroundColor: Colors.greyBg,
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  packIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.orangeSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    backgroundColor: Colors.greenSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.pill,
  },
  discountText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.green,
  },
  packName: {
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textDark,
  },
  packCredits: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    marginBottom: Spacing.sm,
  },
  packPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  packPrice: {
    fontSize: Typography.fontSize.title,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textDark,
  },
  packPerCredit: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
});
