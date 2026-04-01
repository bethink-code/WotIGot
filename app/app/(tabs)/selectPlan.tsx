import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon, MaterialIconName } from '@/components/ui/Icon';
import { AnimatedScreen, AnimatedListItem } from '@/components/ui/AnimatedScreen';
import { Colors, Spacing, Typography, Radii, Shadows } from '@/constants/DesignTokens';
import { useNavigation } from '@/contexts/NavigationContext';
import { usePlans, useSubscription, SubscriptionPlan } from '@/lib/queries';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const tierIcons: Record<string, MaterialIconName> = {
  free: 'account-outline',
  pro: 'star-outline',
  business: 'domain',
};

const tierColors: Record<string, { primary: string; soft: string }> = {
  free: { primary: Colors.green, soft: Colors.greenSoft },
  pro: { primary: Colors.yellow, soft: Colors.yellowSoft },
  business: { primary: Colors.orange, soft: Colors.orangeSoft },
};

function formatLimit(value: number): string {
  return value === -1 ? 'Unlimited' : String(value);
}

function PlanCard({
  plan,
  isCurrent,
  index,
}: {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  index: number;
}) {
  const colors = tierColors[plan.tier] || tierColors.free;
  const icon = tierIcons[plan.tier] || 'account-outline';

  return (
    <AnimatedListItem index={index}>
      <View style={[
        styles.planCard,
        isCurrent && { borderWidth: 2, borderColor: colors.primary },
      ]}>
        {isCurrent && (
          <View style={[styles.currentBadge, { backgroundColor: colors.soft }]}>
            <Text style={[styles.currentBadgeText, { color: colors.primary }]}>Current Plan</Text>
          </View>
        )}

        <View style={[styles.planIconCircle, { backgroundColor: colors.soft }]}>
          <Icon name={icon} size={28} color={colors.primary} />
        </View>

        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planPrice}>
          {plan.price_zar > 0 ? `R${plan.price_zar}` : 'Free'}
          {plan.price_zar > 0 && <Text style={styles.planPriceUnit}>/mo</Text>}
        </Text>

        <View style={styles.planFeatures}>
          <PlanFeature label={`${plan.monthly_credits} AI credits/mo`} />
          <PlanFeature label={`${formatLimit(plan.max_properties)} properties`} />
          <PlanFeature label={`${formatLimit(plan.max_rooms_per_property)} rooms/property`} />
          <PlanFeature label={`${formatLimit(plan.max_items)} items`} />
          {plan.max_credit_rollover > 0 && (
            <PlanFeature label={`Up to ${plan.max_credit_rollover} credit rollover`} />
          )}
        </View>

        {!isCurrent && plan.price_zar > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.selectButton,
              { backgroundColor: colors.primary },
              pressed && styles.selectButtonPressed,
            ]}
            onPress={() => {/* Stripe checkout - requires backend */}}
          >
            <Text style={styles.selectButtonText}>Select {plan.name}</Text>
          </Pressable>
        )}

        {!isCurrent && plan.price_zar === 0 && (
          <View style={styles.freeNote}>
            <Text style={styles.freeNoteText}>Included with all accounts</Text>
          </View>
        )}
      </View>
    </AnimatedListItem>
  );
}

function PlanFeature({ label }: { label: string }) {
  return (
    <View style={styles.featureRow}>
      <Icon name="check" size={16} color={Colors.green} />
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

export default function SelectPlanScreen() {
  const { setActiveTab, setNavigationMode } = useNavigation();
  const insets = useSafeAreaInsets();
  const { data: plans } = usePlans();
  const { data: subData } = useSubscription();

  useEffect(() => {
    setActiveTab('settings');
    setNavigationMode('detail');
  }, []);

  const currentPlanId = subData?.subscription?.plan_id;

  return (
    <View style={styles.container}>
      <PageHeader
        title="Choose a Plan"
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
          {plans?.map((plan, idx) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.id === currentPlanId}
              index={idx}
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
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    ...Shadows.card,
  },
  currentBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.pill,
  },
  currentBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodySemiBold,
  },
  planIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  planName: {
    fontSize: Typography.fontSize.title,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textDark,
    marginBottom: Spacing.xxs,
  },
  planPrice: {
    fontSize: Typography.fontSize.headline,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textDark,
    marginBottom: Spacing.lg,
  },
  planPriceUnit: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
  },
  planFeatures: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xxs + 2,
  },
  featureText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
  },
  selectButton: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: Radii.lg,
    alignItems: 'center',
  },
  selectButtonPressed: {
    opacity: 0.85,
  },
  selectButtonText: {
    fontSize: Typography.fontSize.body1,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.white,
  },
  freeNote: {
    paddingVertical: Spacing.sm,
  },
  freeNoteText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
});
