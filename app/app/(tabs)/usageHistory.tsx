import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { AnimatedScreen, AnimatedListItem } from '@/components/ui/AnimatedScreen';
import { Colors, Spacing, Typography, Radii, Shadows } from '@/constants/DesignTokens';
import { useNavigation } from '@/contexts/NavigationContext';
import { useUsageSummary, useCreditTransactions } from '@/lib/queries';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleString('en', { month: 'short' });
  const time = d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${month}, ${time}`;
}

const actionLabels: Record<string, string> = {
  scan_item: 'AI Scan',
  re_recognize: 'AI Re-scan',
  re_estimate: 'AI Re-estimate',
  ask_price: 'AI Price Check',
  geocode: 'Address Lookup',
};

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

export default function UsageHistoryScreen() {
  const { setActiveTab, setNavigationMode } = useNavigation();
  const insets = useSafeAreaInsets();
  const { data: summary } = useUsageSummary();
  const { data: transactions } = useCreditTransactions();

  useEffect(() => {
    setActiveTab('settings');
    setNavigationMode('detail');
  }, []);

  return (
    <View style={styles.container}>
      <PageHeader
        title="Usage History"
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
          {/* Summary Card */}
          {summary && (
            <AnimatedListItem index={0}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>This Period</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{summary.total_credits_used}</Text>
                    <Text style={styles.summaryLabel}>Credits Used</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{summary.total_actions}</Text>
                    <Text style={styles.summaryLabel}>AI Actions</Text>
                  </View>
                </View>

                {summary.by_action_type.length > 0 && (
                  <View style={styles.breakdownSection}>
                    {summary.by_action_type.map((item) => (
                      <View key={item.action_type} style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>
                          {actionLabels[item.action_type] || item.action_type}
                        </Text>
                        <Text style={styles.breakdownCount}>{item.count}x</Text>
                        <Text style={styles.breakdownCredits}>{item.credits} credits</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </AnimatedListItem>
          )}

          {/* Transaction List */}
          <Text style={styles.sectionTitle}>ALL TRANSACTIONS</Text>

          <View style={styles.transactionList}>
            {(!transactions?.items || transactions.items.length === 0) ? (
              <View style={styles.emptyState}>
                <Icon name="history" size={32} color={Colors.greyLight} />
                <Text style={styles.emptyStateText}>No transactions yet</Text>
              </View>
            ) : (
              transactions.items.map((tx, idx) => (
                <AnimatedListItem key={tx.id} index={idx + 1}>
                  <View style={[
                    styles.transactionRow,
                    idx < transactions.items.length - 1 && styles.transactionBorder,
                  ]}>
                    <View style={[
                      styles.transactionIcon,
                      {
                        backgroundColor: tx.amount >= 0
                          ? Colors.greenSoft
                          : Colors.orangeSoft,
                      },
                    ]}>
                      <Icon
                        name={getTransactionIcon(tx.type)}
                        size={16}
                        color={tx.amount >= 0 ? Colors.green : Colors.orange}
                      />
                    </View>
                    <View style={styles.transactionContent}>
                      <Text style={styles.transactionDesc} numberOfLines={1}>
                        {tx.description || tx.type.replace(/_/g, ' ')}
                      </Text>
                      <Text style={styles.transactionDate}>{formatDate(tx.created_at)}</Text>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text style={[
                        styles.transactionAmount,
                        { color: tx.amount >= 0 ? Colors.green : Colors.orange },
                      ]}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </Text>
                      <Text style={styles.transactionBalance}>bal: {tx.balance_after}</Text>
                    </View>
                  </View>
                </AnimatedListItem>
              ))
            )}
          </View>
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
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.body1,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: Typography.fontSize.headline,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textDark,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    marginTop: Spacing.xxs,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.greyBorder,
  },
  breakdownSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.greyBg,
    paddingTop: Spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xxs + 1,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
  },
  breakdownCount: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textDark,
    marginRight: Spacing.md,
    minWidth: 30,
    textAlign: 'right',
  },
  breakdownCredits: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.orange,
    minWidth: 70,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  transactionList: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    ...Shadows.card,
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
  transactionRight: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  transactionAmount: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodySemiBold,
  },
  transactionBalance: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
