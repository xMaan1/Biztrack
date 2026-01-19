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
import ProductionService from '@/services/ProductionService';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  ProductionPlan,
  ProductionStatus,
  ProductionPriority,
  ProductionType,
} from '@/models/production';

export default function ProductionPlanListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 20;

  useEffect(() => {
    loadProductionPlans();
  }, [currentPage, statusFilter, priorityFilter, typeFilter, sortBy, activeTab]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadProductionPlans();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadProductionPlans = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      const effectiveStatusFilter = activeTab !== 'all' ? activeTab : statusFilter;
      if (effectiveStatusFilter !== 'all') filters.status = effectiveStatusFilter;
      if (priorityFilter !== 'all') filters.priority = priorityFilter;
      if (typeFilter !== 'all') filters.production_type = typeFilter;
      if (searchTerm) filters.search = searchTerm;

      const response = await ProductionService.getProductionPlans(
        filters,
        currentPage,
        itemsPerPage,
      );

      let filtered = response.productionPlans || [];

      if (searchTerm) {
        filtered = filtered.filter(
          (plan) =>
            plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plan.plan_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (plan.description &&
              plan.description.toLowerCase().includes(searchTerm.toLowerCase())),
        );
      }

      switch (sortBy) {
        case 'newest':
          filtered.sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          );
          break;
        case 'oldest':
          filtered.sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );
          break;
        case 'priority':
          filtered.sort((a, b) => {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            return (
              (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
              (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
            );
          });
          break;
        case 'deadline':
          filtered.sort((a, b) => {
            const dateA = a.planned_end_date ? new Date(a.planned_end_date).getTime() : 0;
            const dateB = b.planned_end_date ? new Date(b.planned_end_date).getTime() : 0;
            return dateA - dateB;
          });
          break;
      }

      if (currentPage === 1) {
        setProductionPlans(filtered);
      } else {
        setProductionPlans([...productionPlans, ...filtered]);
      }
      setTotalPages(response.pagination?.pages || 1);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load production plans');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadProductionPlans();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const renderProductionPlanItem = ({ item }: { item: ProductionPlan }) => {
    const statusStyle = ProductionService.getStatusColor(item.status);
    const priorityStyle = ProductionService.getPriorityColor(item.priority);

    return (
      <TouchableOpacity
        style={styles.planCard}
        onPress={() => (navigation.navigate as any)('ProductionPlanDetail', { id: item.id })}
      >
        <View style={styles.planHeader}>
          <View style={styles.planInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.planNumber}>{item.plan_number}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                <Text style={[styles.statusText, { color: statusStyle.border }]}>
                  {ProductionService.getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
            <Text style={styles.planTitle}>{item.title}</Text>
            {item.description && (
              <Text style={styles.planDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.planFooter}>
          <View style={styles.badgeRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeIcon}>{ProductionService.getTypeIcon(item.production_type)}</Text>
              <Text style={styles.typeText}>{ProductionService.getTypeLabel(item.production_type)}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg, borderColor: priorityStyle.border }]}>
              <Text style={[styles.priorityText, { color: priorityStyle.border }]}>
                {ProductionService.getPriorityLabel(item.priority)}
              </Text>
            </View>
          </View>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="cube-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.detailText}>
                {item.target_quantity} {item.unit_of_measure}
              </Text>
            </View>
            {item.planned_start_date && (
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.detailText}>
                  {ProductionService.formatDate(item.planned_start_date)}
                </Text>
              </View>
            )}
            {item.estimated_duration_hours > 0 && (
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.detailText}>{item.estimated_duration_hours}h</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Ionicons name="trending-up-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.detailText}>
                {formatCurrency(item.estimated_material_cost + item.estimated_labor_cost)}
              </Text>
            </View>
          </View>
          {item.completion_percentage > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressValue}>{item.completion_percentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${item.completion_percentage}%` },
                  ]}
                />
              </View>
            </View>
          )}
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
            placeholder="Search production plans..."
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

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
          {['all', 'planned', 'in_progress', 'on_hold', 'completed'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.tabActive,
              ]}
              onPress={() => {
                setActiveTab(tab);
                if (tab !== 'all') {
                  setStatusFilter('all');
                }
                setCurrentPage(1);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab === 'all' ? 'All' : ProductionService.getStatusLabel(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.filterOptions}>
              {['all', 'planned', 'in_progress', 'on_hold', 'completed', 'cancelled'].map((status) => (
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
                    {status === 'all' ? 'All' : ProductionService.getStatusLabel(status)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Priority:</Text>
            <View style={styles.filterOptions}>
              {['all', 'low', 'medium', 'high', 'urgent'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.filterChip,
                    priorityFilter === priority && styles.filterChipActive,
                  ]}
                  onPress={() => setPriorityFilter(priority)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      priorityFilter === priority && styles.filterChipTextActive,
                    ]}
                  >
                    {priority === 'all' ? 'All' : ProductionService.getPriorityLabel(priority)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Type:</Text>
            <View style={styles.filterOptions}>
              {['all', 'batch', 'continuous', 'job_shop', 'assembly', 'custom'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    typeFilter === type && styles.filterChipActive,
                  ]}
                  onPress={() => setTypeFilter(type)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      typeFilter === type && styles.filterChipTextActive,
                    ]}
                  >
                    {type === 'all' ? 'All' : ProductionService.getTypeLabel(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Sort By:</Text>
            <View style={styles.filterOptions}>
              {['newest', 'oldest', 'priority', 'deadline'].map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[
                    styles.filterChip,
                    sortBy === sort && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    setSortBy(sort);
                    setCurrentPage(1);
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      sortBy === sort && styles.filterChipTextActive,
                    ]}
                  >
                    {sort === 'newest' ? 'Newest' :
                     sort === 'oldest' ? 'Oldest' :
                     sort === 'priority' ? 'Priority' :
                     'Deadline'}
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
    if (loading && productionPlans.length > 0) {
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
      <Ionicons name="factory-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No production plans found</Text>
      {!searchTerm && activeTab === 'all' && statusFilter === 'all' && priorityFilter === 'all' && typeFilter === 'all' && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => (navigation.navigate as any)('ProductionPlanForm', {})}
        >
          <Ionicons name="add" size={20} color={colors.background.default} />
          <Text style={styles.createButtonText}>Create Production Plan</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Production Planning"
        rightIcon="add"
        gradient={false}
        onRightPress={() => (navigation.navigate as any)('ProductionPlanForm', {})}
      />
      <FlatList
        data={productionPlans}
        renderItem={renderProductionPlanItem}
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
  tabsContainer: {
    marginBottom: spacing.md,
  },
  tabsScrollContent: {
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.background.muted,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  tabText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.background.default,
    fontWeight: '600',
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
  planCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  planHeader: {
    marginBottom: spacing.sm,
  },
  planInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  planNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  planDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  planFooter: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.muted,
    borderRadius: 8,
  },
  typeIcon: {
    fontSize: 14,
  },
  typeText: {
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'capitalize',
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
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.background.muted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 3,
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
