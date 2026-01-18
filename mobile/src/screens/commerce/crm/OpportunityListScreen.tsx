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
import CRMService from '@/services/CRMService';
import { Opportunity, OpportunityStage, CRMOpportunityFilters } from '@/models/crm';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function OpportunityListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CRMOpportunityFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    loadOpportunities();
  }, [currentPage, filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm || undefined }));
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const response = await CRMService.getOpportunities(filters, currentPage, itemsPerPage);
      setOpportunities(response.opportunities);
      setTotalPages(response.pagination.pages);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOpportunities();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const renderOpportunityItem = ({ item }: { item: Opportunity }) => (
    <TouchableOpacity
      style={styles.opportunityCard}
      onPress={() => (navigation as any).navigate('OpportunityDetail', { id: item.id })}
    >
      <View style={styles.opportunityHeader}>
        <View style={styles.opportunityInfo}>
          <Text style={styles.opportunityTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.opportunityDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        <View style={[styles.stageBadge, getStageBadgeStyle(item.stage)]}>
          <Text style={styles.stageText}>{item.stage.replace('_', ' ')}</Text>
        </View>
      </View>
      {item.amount && (
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount:</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.amount)}</Text>
        </View>
      )}
      <View style={styles.opportunityFooter}>
        <View style={styles.probabilityRow}>
          <Text style={styles.probabilityLabel}>Probability:</Text>
          <Text style={styles.probabilityValue}>{item.probability}%</Text>
        </View>
        {item.expectedCloseDate && (
          <Text style={styles.closeDate}>
            Closes: {new Date(item.expectedCloseDate).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const getStageBadgeStyle = (stage: OpportunityStage) => {
    const stageColors: Record<OpportunityStage, { bg: string; border: string }> = {
      [OpportunityStage.PROSPECTING]: { bg: colors.blue[100], border: colors.blue[500] },
      [OpportunityStage.QUALIFICATION]: { bg: colors.yellow[100], border: colors.yellow[500] },
      [OpportunityStage.PROPOSAL]: { bg: colors.purple[100], border: colors.purple[500] },
      [OpportunityStage.NEGOTIATION]: { bg: colors.orange[100], border: colors.orange[500] },
      [OpportunityStage.CLOSED_WON]: { bg: colors.green[100], border: colors.green[500] },
      [OpportunityStage.CLOSED_LOST]: { bg: colors.red[100], border: colors.red[500] },
    };
    const color = stageColors[stage] || { bg: colors.gray[100], border: colors.gray[500] };
    return { backgroundColor: color.bg, borderColor: color.border };
  };

  const renderHeader = () => (
    <View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search opportunities..."
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
            <Text style={styles.filterLabel}>Stage:</Text>
            <View style={styles.filterOptions}>
              {Object.values(OpportunityStage).map((stage) => (
                <TouchableOpacity
                  key={stage}
                  style={[
                    styles.filterChip,
                    filters.stage === stage && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      stage: prev.stage === stage ? undefined : stage,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.stage === stage && styles.filterChipTextActive,
                    ]}
                  >
                    {stage.replace('_', ' ')}
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
    if (loading && opportunities.length > 0) {
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
      <Ionicons name="target-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No opportunities found</Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Opportunities"
        rightIcon="add"
        gradient={false}
        onRightPress={() => (navigation as any).navigate('OpportunityForm', {})}
      />
      <FlatList
        data={opportunities}
        renderItem={renderOpportunityItem}
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
  opportunityCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  opportunityInfo: {
    flex: 1,
  },
  opportunityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  opportunityDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  stageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  stageText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  amountLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  opportunityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  probabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  probabilityLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  probabilityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeDate: {
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
});
