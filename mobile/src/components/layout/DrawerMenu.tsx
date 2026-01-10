import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, typography, textStyles, spacing, borderRadius } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRBAC } from '@/contexts/RBACContext';
import { useNotifications } from '@/contexts/NotificationContext';

interface MenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  module?: string;
  badge?: number;
  section?: 'main' | 'modules' | 'settings';
}

const getModuleMenuItems = (
  planType: string | null,
  accessibleModules: string[],
  hasModuleAccess: (module: string) => boolean,
): MenuItem[] => {
  const items: MenuItem[] = [];

  if (hasModuleAccess('crm') || accessibleModules.includes('commerce') || planType === 'commerce') {
    items.push(
      { label: 'CRM', icon: 'people', route: 'CRM', module: 'crm', section: 'modules' },
      { label: 'Sales', icon: 'trending-up', route: 'Sales', module: 'sales', section: 'modules' },
      { label: 'POS', icon: 'cash', route: 'POS', module: 'pos', section: 'modules' },
      { label: 'Inventory', icon: 'cube', route: 'Inventory', module: 'inventory', section: 'modules' },
    );
  }

  if (hasModuleAccess('patients') || accessibleModules.includes('healthcare') || planType === 'healthcare') {
    items.push(
      { label: 'Patients', icon: 'medical', route: 'Patients', module: 'patients', section: 'modules' },
      { label: 'Appointments', icon: 'calendar', route: 'Appointments', module: 'appointments', section: 'modules' },
      { label: 'Medical Records', icon: 'document-text', route: 'MedicalRecords', module: 'medical_records', section: 'modules' },
      { label: 'Consultations', icon: 'chatbubbles', route: 'Consultations', module: 'consultations', section: 'modules' },
    );
  }

  if (hasModuleAccess('work_orders') || accessibleModules.includes('workshop') || planType === 'workshop') {
    items.push(
      { label: 'Work Orders', icon: 'construct', route: 'WorkOrders', module: 'work_orders', section: 'modules' },
      { label: 'Production', icon: 'settings', route: 'Production', module: 'production', section: 'modules' },
      { label: 'Quality Control', icon: 'checkmark-circle', route: 'QualityControl', module: 'quality_control', section: 'modules' },
      { label: 'Maintenance', icon: 'build', route: 'Maintenance', module: 'maintenance', section: 'modules' },
    );
  }

  return items;
};

export function DrawerMenu(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { user, currentTenant, logout } = useAuth();
  const { planType, accessibleModules } = useSubscription();
  const { hasModuleAccess } = useRBAC();
  const { unreadCount } = useNotifications();

  const handleNavigation = (route: string) => {
    try {
      props.navigation.closeDrawer();
      
      if (route === 'CRM' || route === 'Sales' || route === 'POS' || route === 'Inventory') {
        props.navigation.dispatch(
          CommonActions.navigate({
            name: 'MainTabs',
            params: {
              screen: 'Commerce',
              params: {
                screen: route,
              },
            },
          })
        );
      } else if (route === 'Patients' || route === 'Appointments' || route === 'MedicalRecords' || route === 'Consultations' || route === 'MedicalSupplies' || route === 'LabReports') {
        props.navigation.dispatch(
          CommonActions.navigate({
            name: 'MainTabs',
            params: {
              screen: 'Healthcare',
              params: {
                screen: route,
              },
            },
          })
        );
      } else if (route === 'WorkOrders' || route === 'Production' || route === 'QualityControl' || route === 'Maintenance') {
        props.navigation.dispatch(
          CommonActions.navigate({
            name: 'MainTabs',
            params: {
              screen: 'Workshop',
              params: {
                screen: route,
              },
            },
          })
        );
      } else if (route === 'Dashboard') {
        props.navigation.dispatch(
          CommonActions.navigate({
            name: 'MainTabs',
            params: {
              screen: 'Dashboard',
            },
          })
        );
      } else {
        props.navigation.navigate(route as never);
      }
    } catch (error) {
    }
  };

  const handleLogout = async () => {
    await logout();
    props.navigation.closeDrawer();
  };

  const mainMenuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'home', route: 'Dashboard', section: 'main' },
  ];

  const moduleMenuItems = getModuleMenuItems(planType, accessibleModules, hasModuleAccess);

  const settingsMenuItems: MenuItem[] = [
    { label: 'Notifications', icon: 'notifications', route: 'Notifications', badge: unreadCount, section: 'settings' },
    { label: 'Settings', icon: 'settings', route: 'Settings', section: 'settings' },
    { label: 'Profile', icon: 'person', route: 'Profile', section: 'settings' },
  ];

  const allMenuItems = [...mainMenuItems, ...moduleMenuItems, ...settingsMenuItems];

  const renderMenuItem = (item: MenuItem) => {
    const isActive = props.state.routes[props.state.index]?.name === item.route;
    const badgeCount = item.badge || (item.route === 'Notifications' ? unreadCount : undefined);

    return (
      <TouchableOpacity
        key={item.route}
        style={[styles.menuItem, isActive && styles.activeMenuItem]}
        onPress={() => handleNavigation(item.route)}
      >
        {isActive ? (
          <LinearGradient
            colors={gradients.primary.colors}
            start={gradients.primary.start}
            end={gradients.primary.end}
            style={styles.menuItemGradient}
          >
            <View style={styles.menuItemContent}>
              <Ionicons name={item.icon} size={24} color={colors.background.default} />
              <Text style={[styles.menuItemLabel, styles.activeLabel]}>
                {item.label}
              </Text>
              {badgeCount && badgeCount > 0 && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.menuItemContent}>
            <Ionicons
              name={`${item.icon}-outline` as keyof typeof Ionicons.glyphMap}
              size={24}
              color={colors.gray[700]}
            />
            <Text style={styles.menuItemLabel}>{item.label}</Text>
            {badgeCount && badgeCount > 0 && (
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>
                  {badgeCount > 99 ? '99+' : badgeCount}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, items: MenuItem[]) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {items.map(renderMenuItem)}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={gradients.primary.colors}
        start={gradients.primary.start}
        end={gradients.primary.end}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {user && (
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color={colors.background.default} />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.full_name || user.email}
                </Text>
                {currentTenant && (
                  <Text style={styles.tenantName} numberOfLines={1}>
                    {currentTenant.name}
                  </Text>
                )}
                {planType && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planText}>{planType.toUpperCase()}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </LinearGradient>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderSection('Main', mainMenuItems)}
        {moduleMenuItems.length > 0 && renderSection('Modules', moduleMenuItems)}
        {renderSection('Settings', settingsMenuItems)}
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.status.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  headerContent: {
    marginTop: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...textStyles.h6,
    color: colors.background.default,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  tenantName: {
    ...textStyles.body2,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.xs,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  planText: {
    ...textStyles.caption,
    color: colors.background.default,
    fontWeight: typography.fontWeight.bold,
    fontSize: 10,
  },
  scrollContent: {
    paddingTop: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.caption,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    fontSize: 13,
    lineHeight: 18,
  },
  menuItem: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  activeMenuItem: {
    overflow: 'hidden',
  },
  menuItemGradient: {
    borderRadius: borderRadius.lg,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  menuItemLabel: {
    ...textStyles.body1,
    color: colors.text.primary,
    flex: 1,
    fontSize: 16,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 20,
  },
  activeLabel: {
    color: colors.background.default,
    fontWeight: typography.fontWeight.semibold,
  },
  menuBadge: {
    backgroundColor: colors.status.error,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  menuBadgeText: {
    color: colors.background.default,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  logoutText: {
    ...textStyles.body1,
    color: colors.status.error,
    fontWeight: typography.fontWeight.semibold,
    fontSize: 15,
  },
});
