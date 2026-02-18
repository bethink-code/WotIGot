import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '@/components/ui/PageHeader';
import { SelectorCard } from '@/components/ui/SelectorCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Spacing, Typography, Radii } from '@/constants/DesignTokens';
import { useNavigation } from '@/contexts/NavigationContext';
import { useHouses } from '@/lib/queries';
import { getAccessToken } from '@/lib/api';

type ReportScope = 'all' | number;

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { setActiveTab, setNavigationMode } = useNavigation();
  const { data: houses, isLoading } = useHouses();
  const [selectedScope, setSelectedScope] = useState<ReportScope>('all');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setActiveTab('reports');
    setNavigationMode('shell');
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const token = getAccessToken();
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
      
      let url: string;
      if (selectedScope === 'all') {
        url = `${baseUrl}/reports/xlsx`;
      } else {
        url = `${baseUrl}/houses/${selectedScope}/xlsx`;
      }

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', '');
        
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to download report');
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        link.href = blobUrl;
        
        const contentDisposition = response.headers.get('Content-Disposition');
        const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
        const filename = filenameMatch ? filenameMatch[1] : 'wotigot_report.xlsx';
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        
        Alert.alert('Success', 'Your report has been downloaded.');
      } else {
        Alert.alert('Info', 'Mobile download will be available soon.');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download the report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatValue = (value: number | undefined) => {
    if (value === undefined) return 'R0';
    return `R${value.toLocaleString()}`;
  };

  const totalValue = houses?.reduce((sum, house) => sum + (house.total_value || 0), 0) || 0;
  const totalItems = houses?.reduce((sum, house) => sum + (house.total_items || 0), 0) || 0;

  return (
    <View style={styles.container}>
      <PageHeader
        title="Reports"
        subtitle="Download inventory reports"
        level="portfolio"
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 }
        ]}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SELECT REPORT SCOPE</Text>
          <Text style={styles.sectionDescription}>
            Choose which properties to include in your report. Select "All Properties" 
            for a complete inventory, or pick a specific property.
          </Text>
        </View>

        <View style={styles.optionsList}>
          <SelectorCard
            title="All Properties"
            subtitle={`${houses?.length || 0} properties • ${totalItems} items • ${formatValue(totalValue)}`}
            icon="home-group"
            level="portfolio"
            state={selectedScope === 'all' ? 'selected' : 'default'}
            onPress={() => setSelectedScope('all')}
          />

          {houses?.map((house) => (
            <SelectorCard
              key={house.id}
              title={house.name}
              subtitle={`${house.total_items || 0} items • ${formatValue(house.total_value)}`}
              icon="home-outline"
              level="property"
              state={selectedScope === house.id ? 'selected' : 'default'}
              onPress={() => setSelectedScope(house.id)}
            />
          ))}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading properties...</Text>
            </View>
          )}

          {!isLoading && (!houses || houses.length === 0) && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No properties found. Add a property first to generate reports.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What's included in the report?</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Property and room details</Text>
            <Text style={styles.infoItem}>• Item descriptions, brands, and models</Text>
            <Text style={styles.infoItem}>• Serial numbers and categories</Text>
            <Text style={styles.infoItem}>• Prices and estimated values</Text>
            <Text style={styles.infoItem}>• One sheet per property (for "All Properties")</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={isDownloading ? "Downloading..." : "Download Excel Report"}
            onPress={handleDownload}
            icon="file-excel-outline"
            iconPosition="left"
            disabled={isDownloading || (!houses || houses.length === 0)}
          />
        </View>
      </ScrollView>
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
    paddingTop: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    lineHeight: 20,
  },
  optionsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
  },
  emptyText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: Colors.greenSoft,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoTitle: {
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  infoList: {
    gap: Spacing.xs,
  },
  infoItem: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
  },
  actions: {
    marginTop: Spacing.md,
  },
});
