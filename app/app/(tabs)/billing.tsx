import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { AnimatedScreen, AnimatedListItem } from '@/components/ui/AnimatedScreen';
import { Colors, Spacing, Typography, Radii, Shadows } from '@/constants/DesignTokens';
import { useNavigation } from '@/contexts/NavigationContext';
import { useCreditBalance, useSubscription, useCreditTransactions } from '@/lib/queries';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleString('en', { month: 'short' });
  const time = d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${month}, ${time}`;
}

function getTransactionIcon(type: string) {
  switch (type) {
    case 'usage': return 'lightning-bolt';
    case 'subscription_allocation': return 'calendar-check';
    case 'pack_purchase': return 'cart-outline';
    case 'refund': return 'undo';
    case 'rollover': return 'autorenew';
    case 'expiry': return 'clock-outline';
    case 'admin_adjustment': return 'shield-check';
    default: return 'swap-horizontal';
  }
}

function getTransactionColor(amount: number) {
  return amount >= 0 ? Colors.green : Colors.orange;
}

export default function BillingScreen() {
  const { setActiveTab, setNavigationMode } = useNavigation();
  const insets = useSafeAreaInsets();
  const { data: balance } = useCreditBalance();
  const { data: subData } = useSubscription();
  const { data: transactions } = useCreditTransactions();

  useEffect(() => {
    setActiveTab('settings');
    setNavigationMode('detail');
  }, []);

  const plan = subData?.plan;
  const subscription = subData?.subscription;
  const totalCredits = balance?.total ?? 0;
  const monthlyCredits = plan?.monthly_credits ?? 0;
  const usedPercent = monthlyCredits > 0
    ? Math.min(((monthlyCredits - (balance?.subscription_credits ?? 0)) / monthlyCredits) * 100, 100)
    : 0;

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null;

  return (
    <View style={styles.container}>
      <PageHeader
        title="Billing"
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
          {/* Credit Balance Card */}
          <AnimatedListItem index={0}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconContainer}>
                  <Icon name="lightning-bolt" size={20} color={Colors.orange} />
                </View>
                <Text style={styles.cardTitle}>Credits</Text>
              </View>

              <Text style={styles.creditTotal}>{totalCredits}</Text>
              <Text style={styles.creditLabel}>credits available</Text>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${100 - usedPercent}%` }]} />
              </View>

              <View style={styles.creditBreakdown}>
                <View style={styles.creditRow}>
                  <View style={[styles.creditDot, { backgroundColor: Colors.green }]} />
                  <Text style={styles.creditRowLabel}>Subscription</Text>
                  <Text style={styles.creditRowValue}>{balance?.subscription_credits ?? 0}</Text>
                </View>
                <View style={styles.creditRow}>
                  <View style={[styles.creditDot, { backgroundColor: Colors.yellow }]} />
                  <Text style={styles.creditRowLabel}>Purchased</Text>
                  <Text style={styles.creditRowValue}>{balance?.purchased_credits ?? 0}</Text>
                </View>
                <View style={styles.creditRow}>
                  <View style={[styles.creditDot, { backgroundColor: Colors.orange }]} />
                  <Text style={styles.creditRowLabel}>Rollover</Text>
                  <Text style={styles.creditRowValue}>{balance?.rollover_credits ?? 0}</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.buyButton,
                  pressed && styles.buyButtonPressed,
                ]}
                onPress={() => router.push('/buyCredits')}
              >
                <Icon name="cart-outline" size={18} color={Colors.white} />
                <Text style={styles.buyButtonText}>Buy Credits</Text>
              </Pressable>
            </View>
          </AnimatedListItem>

          {/* Current Plan Card */}
          <AnimatedListItem index={1}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconContainer, { backgroundColor: Colors.greenSoft }]}>
                  <Icon name="crown-outline" size={20} color={Colors.green} />
                </View>
                <Text style={styles.cardTitle}>Your Plan</Text>
              </View>

              <View style={styles.planRow}>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{plan?.name ?? 'Free'}</Text>
                </View>
                {plan && plan.price_zar > 0 && (
                  <Text style={styles.planPrice}>R{plan.price_zar}/mo</Text>
                )}
              </View>

              {periodEnd && (
                <Text style={styles.planRenewal}>Renews {periodEnd}</Text>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.changePlanButton,
                  pressed && styles.changePlanButtonPressed,
                ]}
                onPress={() => router.push('/selectPlan')}
              >
                <Text style={styles.changePlanText}>Change Plan</Text>
                <Icon name="chevron-right" size={18} color={Colors.green} />
              </Pressable>
            </View>
          </AnimatedListItem>

          {/* Recent Activity */}
          <AnimatedListItem index={2}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
              <Pressable onPress={() => router.push('/usageHistory')}>
                <Text style={styles.seeAllText}>See All</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              {(!transactions?.items || transactions.items.length === 0) ? (
                <View style={styles.emptyState}>
                  <Icon name="history" size={32} color={Colors.greyLight} />
                  <Text style={styles.emptyStateText}>No activity yet</Text>
                </View>
              ) : (
                transactions.items.slice(0, 8).map((tx, idx) => (
                  <View
                    key={tx.id}
                    style={[
                      styles.transactionRow,
                      idx < Math.min(transactions.items.length, 8) - 1 && styles.transactionBorder,
                    ]}
                  >
                    <View style={[
                      styles.transactionIcon,
                      { backgroundColor: tx.amount >= 0 ? Colors.greenSoft : Colors.orangeSoft },
                    ]}>
                      <Icon
                        name={getTransactionIcon(tx.type)}
                        size={16}
                        color={getTransactionColor(tx.amount)}
                      />
                    </View>
                    <View style={styles.transactionContent}>
                      <Text style={styles.transactionDesc} numberOfLines={1}>
                        {tx.description || tx.type.replace(/_/g, ' ')}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(tx.created_at)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.transactionAmount,
                      { color: getTransactionColor(tx.amount) },
                    ]}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </AnimatedListItem>
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
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: Colors.orangeSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.fontSize.body1,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textDark,
  },
  creditTotal: {
    fontSize: Typography.fontSize.display,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textDark,
    textAlign: 'center',
  },
  creditLabel: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.greyBorder,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.green,
    borderRadius: 4,
  },
  creditBreakdown: {
    marginBottom: Spacing.lg,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xxs,
  },
  creditDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  creditRowLabel: {
    flex: 1,
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
  },
  creditRowValue: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textDark,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.orange,
    paddingVertical: Spacing.md,
    borderRadius: Radii.lg,
    gap: Spacing.xs,
  },
  buyButtonPressed: {
    opacity: 0.85,
  },
  buyButtonText: {
    fontSize: Typography.fontSize.body1,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.white,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  planBadge: {
    backgroundColor: Colors.greenSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.pill,
  },
  planBadgeText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.green,
  },
  planPrice: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textDark,
  },
  planRenewal: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    marginBottom: Spacing.md,
  },
  changePlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.greyBorder,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.lg,
    gap: Spacing.xxs,
  },
  changePlanButtonPressed: {
    backgroundColor: Colors.greyBg,
  },
  changePlanText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.green,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  seeAllText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.green,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  transactionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.greyBg,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
  },
  transactionDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodySemiBold,
    marginLeft: Spacing.sm,
  },
});
