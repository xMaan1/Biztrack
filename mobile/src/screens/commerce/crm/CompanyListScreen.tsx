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
import { Company, Industry, CompanySize, CRMCompanyFilters } from '@/models/crm';

export default function CompanyListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CRMCompanyFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    loadCompanies();
  }, [currentPage, filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm || undefined }));
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await CRMService.getCompanies(filters, currentPage, itemsPerPage);
      setCompanies(response.companies);
      setTotalPages(response.pagination.pages);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCompanies();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const renderCompanyItem = ({ item }: { item: Company }) => (
    <TouchableOpacity
      style={styles.companyCard}
      onPress={() => navigation.navigate('CompanyDetail' as never, { id: item.id } as never)}
    >
      <View style={styles.companyHeader}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{item.name}</Text>
          {item.industry && (
            <Text style={styles.companyIndustry}>{item.industry}</Text>
          )}
        </View>
        {item.isActive ? (
          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>Active</Text>
          </View>
        ) : (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveText}>Inactive</Text>
          </View>
        )}
      </View>
      {item.size && (
        <View style={styles.companyDetails}>
          <Ionicons name="people-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{item.size}</Text>
        </View>
      )}
      {item.phone && (
        <View style={styles.companyDetails}>
          <Ionicons name="call-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
      )}
      {(item.city || item.country) && (
        <View style={styles.companyDetails}>
          <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            {[item.city, item.country].filter(Boolean).join(', ')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search companies..."
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
            <Text style={styles.filterLabel}>Industry:</Text>
            <View style={styles.filterOptions}>
              {Object.values(Industry).map((industry) => (
                <TouchableOpacity
                  key={industry}
                  style={[
                    styles.filterChip,
                    filters.industry === industry && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      industry: prev.industry === industry ? undefined : industry,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.industry === industry && styles.filterChipTextActive,
                    ]}
                  >
                    {industry}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Size:</Text>
            <View style={styles.filterOptions}>
              {Object.values(CompanySize).map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.filterChip,
                    filters.size === size && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      size: prev.size === size ? undefined : size,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.size === size && styles.filterChipTextActive,
                    ]}
                  >
                    {size}
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
    if (loading && companies.length > 0) {
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
      <Ionicons name="business-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No companies found</Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Companies"
        rightIcon="add"
        gradient={false}
        onRightPress={() => navigation.navigate('CompanyForm' as never, {} as never)}
      />
      <FlatList
        data={companies}
        renderItem={renderCompanyItem}
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
  companyCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  companyIndustry: {
    fontSize: 14,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  activeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.green[100],
    borderWidth: 1,
    borderColor: colors.green[500],
  },
  activeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.green[700],
  },
  inactiveBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[500],
  },
  inactiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[700],
  },
  companyDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 14,
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
