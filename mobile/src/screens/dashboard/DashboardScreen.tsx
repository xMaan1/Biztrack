import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing } from '@/theme';
import { apiService } from '@/services/ApiService';
import {
  DashboardHeader,
  QuickActionsSection,
  StatsSection,
  ProgressChart,
  ActivityChart,
} from '@/components/dashboard';
import { DashboardStats, ChartData } from '@/components/dashboard/types';
import { generateProgressChartData, generateActivityChartData } from '@/components/dashboard/utils';

const HORIZONTAL_PADDING = 20;
const SECTION_GAP = 32;

export default function DashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [planType, setPlanType] = useState<'commerce' | 'healthcare' | 'workshop'>('commerce');
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTeamMembers: 0,
    averageProgress: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
    progressData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
    },
    activityData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{ data: [0, 0, 0, 0, 0, 0] }],
    },
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadPlanInfo(), loadDashboardData()]);
      setLoading(false);
    };
    loadData();
  }, [currentTenant]);

  const loadPlanInfo = async () => {
    try {
      const response = await apiService.get<any>('/tenants/current/subscription');
      if (response && response.success && response.subscription) {
        const planTypeFromBackend = response.subscription?.plan?.planType;
        if (planTypeFromBackend && ['commerce', 'healthcare', 'workshop'].includes(planTypeFromBackend)) {
          setPlanType(planTypeFromBackend);
        } else {
          setPlanType('commerce');
        }
      } else {
        setPlanType('commerce');
      }
    } catch (error) {
      setPlanType('commerce');
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await apiService.get<any>('/dashboard/overview');
      if (response) {
        const projects = response.projects || {};
        const workOrders = response.workOrders || {};
        const users = response.users || {};
        
        const recentProjects = projects.recent || [];
        const projectStats = projects.stats || {};
        const workOrderStats = workOrders.stats || {};
        
        const avgProgress = recentProjects.length > 0
          ? Math.round(
              recentProjects.reduce((sum: number, p: any) => sum + (p.completionPercent || 0), 0) /
              recentProjects.length
            )
          : 0;

        setStats({
          totalProjects: projectStats.total || 0,
          activeProjects: projectStats.active || 0,
          completedProjects: projectStats.completed || 0,
          totalTeamMembers: users.total || 0,
          averageProgress: avgProgress,
          workOrders: workOrderStats.total || 0,
          equipmentMaintenance: workOrderStats.draft || 0,
          qualityIssues: workOrderStats.in_progress || 0,
          productionEfficiency: workOrderStats.total > 0
            ? Math.round((workOrderStats.completed / workOrderStats.total) * 100)
            : 0,
        });

        const progressChartData = generateProgressChartData(recentProjects);
        const activityChartData = generateActivityChartData(projectStats, workOrderStats);
        
        setChartData({
          progressData: progressChartData,
          activityData: activityChartData,
        });
      }
    } catch (error) {
      setStats({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalTeamMembers: 0,
        averageProgress: 0,
      });
      setChartData({
        progressData: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
        },
        activityData: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{ data: [0, 0, 0, 0, 0, 0] }],
        },
      });
    }
  };


  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPlanInfo(), loadDashboardData()]);
    setRefreshing(false);
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route as never);
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SECTION_GAP },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader planType={planType} />

        <QuickActionsSection planType={planType} onNavigate={handleNavigate} />

        <StatsSection planType={planType} stats={stats} />

        <ProgressChart data={chartData.progressData} />

        <ActivityChart data={chartData.activityData} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
