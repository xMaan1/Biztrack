import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import QualityControlService from '@/services/QualityControlService';
import {
  QualityReportResponse as QualityReport,
} from '@/models/qualityControl';

export default function QualityReportListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<QualityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 20;

  useEffect(() => {
    loadReports();
  }, [currentPage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadReports();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await QualityControlService.getQualityReports(
        undefined,
        currentPage,
        itemsPerPage,
      );
      
      let filtered = response.quality_reports || [];
      
      if (searchTerm) {
        filtered = filtered.filter(
          (report) =>
            report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (report.summary && report.summary.toLowerCase().includes(searchTerm.toLowerCase())),
        );
      }

      if (currentPage === 1) {
        setReports(filtered);
      } else {
        setReports([...reports, ...filtered]);
      }
      setTotalPages(response.total_pages || 1);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load quality reports');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadReports();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const renderReportItem = ({ item }: { item: QualityReport }) => {
    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => (navigation.navigate as any)('QualityReportDetail', { id: item.id })}
      >
        <View style={styles.reportHeader}>
          <View style={styles.reportInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.reportId}>{item.id}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{item.report_type}</Text>
              </View>
            </View>
            <Text style={styles.reportTitle}>{item.title}</Text>
            {item.summary && (
              <Text style={styles.summary} numberOfLines={2}>
                {item.summary}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.reportFooter}>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.detailText}>{item.generated_by_name}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.detailText}>
                {QualityControlService.formatDate(item.period_start)} - {QualityControlService.formatDate(item.period_end)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={colors.text.secondary}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (loading && reports.length > 0) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={colors.primary.main} />
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No quality reports found</Text>
      {!searchTerm && (
        <>
          <Text style={styles.emptySubtext}>
            Get started by creating your first quality report.
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => (navigation.navigate as any)('QualityReportForm', {})}
          >
            <Ionicons name="add" size={20} color={colors.background.default} />
            <Text style={styles.createButtonText}>Create Quality Report</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Quality Reports"
        gradient={false}
        rightIcon="add"
        onRightPress={() => (navigation.navigate as any)('QualityReportForm', {})}
      />
      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.text.primary,
  },
  reportCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  reportHeader: {
    marginBottom: spacing.sm,
  },
  reportInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reportId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.muted,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  summary: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  reportFooter: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  footer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'] * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  createButtonText: {
    color: colors.background.default,
    fontSize: 14,
    fontWeight: '600',
  },
});
