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
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import QualityControlService from '@/services/QualityControlService';
import {
  QualityDefectResponse as QualityDefect,
  DefectSeverity,
  QualityPriority,
  getDefectSeverityColor,
  getDefectSeverityLabel,
  getQualityPriorityColor,
  getQualityPriorityLabel,
} from '@/models/qualityControl';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function QualityDefectListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const [defects, setDefects] = useState<QualityDefect[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 20;

  useEffect(() => {
    loadDefects();
  }, [currentPage, severityFilter, statusFilter, activeTab]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadDefects();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadDefects = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (severityFilter !== 'all') filters.severity = severityFilter;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (searchTerm) filters.search = searchTerm;

      const response = await QualityControlService.getQualityDefects(
        filters,
        currentPage,
        itemsPerPage,
      );
      
      let filtered = response.quality_defects || [];
      
      if (searchTerm) {
        filtered = filtered.filter(
          (defect) =>
            defect.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            defect.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (defect.description && defect.description.toLowerCase().includes(searchTerm.toLowerCase())),
        );
      }

      if (currentPage === 1) {
        setDefects(filtered);
      } else {
        setDefects([...defects, ...filtered]);
      }
      setTotalPages(response.total_pages || 1);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load quality defects');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadDefects();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const renderDefectItem = ({ item }: { item: QualityDefect }) => {
    const severityStyle = getDefectSeverityColor(item.severity);
    const priorityStyle = getQualityPriorityColor(item.priority);

    return (
      <TouchableOpacity
        style={styles.defectCard}
        onPress={() => (navigation.navigate as any)('QualityDefectDetail', { id: item.id })}
      >
        <View style={styles.defectHeader}>
          <View style={styles.defectInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.defectId}>{item.id}</Text>
              <View style={[styles.severityBadge, { backgroundColor: severityStyle.bg, borderColor: severityStyle.border }]}>
                <Text style={[styles.severityText, { color: severityStyle.border }]}>
                  {getDefectSeverityLabel(item.severity)}
                </Text>
              </View>
            </View>
            <Text style={styles.defectTitle}>{item.title}</Text>
            {item.description && (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.defectFooter}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg, borderColor: priorityStyle.border }]}>
              <Text style={[styles.priorityText, { color: priorityStyle.border }]}>
                {getQualityPriorityLabel(item.priority)}
              </Text>
            </View>
          </View>
          <View style={styles.detailsRow}>
            {item.location && (
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.detailText}>{item.location}</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.detailText}>
                {QualityControlService.formatDate(item.detected_date)}
              </Text>
            </View>
            {item.cost_impact > 0 && (
              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.detailText}>
                  {getCurrencySymbol()}{formatCurrency(item.cost_impact)}
                </Text>
              </View>
            )}
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
            placeholder="Search defects..."
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
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color={colors.primary.main} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Severity:</Text>
            <View style={styles.filterOptions}>
              {['all', 'minor', 'major', 'critical', 'blocker'].map((severity) => (
                <TouchableOpacity
                  key={severity}
                  style={[
                    styles.filterChip,
                    severityFilter === severity && styles.filterChipActive,
                  ]}
                  onPress={() => setSeverityFilter(severity)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      severityFilter === severity && styles.filterChipTextActive,
                    ]}
                  >
                    {severity === 'all' ? 'All' : getDefectSeverityLabel(severity as DefectSeverity)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.filterOptions}>
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    statusFilter === status && styles.filterChipActive,
                  ]}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      statusFilter === status && styles.filterChipTextActive,
                    ]}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (loading && defects.length > 0) {
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
      <Ionicons name="bug-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No quality defects found</Text>
      {!searchTerm && severityFilter === 'all' && statusFilter === 'all' && (
        <>
          <Text style={styles.emptySubtext}>
            Get started by creating your first quality defect.
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => (navigation.navigate as any)('QualityDefectForm', {})}
          >
            <Ionicons name="add" size={20} color={colors.background.default} />
            <Text style={styles.createButtonText}>Create Quality Defect</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Quality Defects"
        gradient={false}
        rightIcon="add"
        onRightPress={() => (navigation.navigate as any)('QualityDefectForm', {})}
      />
      <FlatList
        data={defects}
        renderItem={renderDefectItem}
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
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filtersContainer: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterRow: {
    marginBottom: spacing.sm,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background.muted,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.background.default,
    fontWeight: '600',
  },
  defectCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  defectHeader: {
    marginBottom: spacing.sm,
  },
  defectInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  defectId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  defectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  defectFooter: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.muted,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
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
