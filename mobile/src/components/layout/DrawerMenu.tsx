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

  if (planType === 'commerce' || planType === 'healthcare') {
    if (hasModuleAccess('crm') || accessibleModules.includes('commerce') || accessibleModules.includes('healthcare') || planType === 'commerce' || planType === 'healthcare') {
      items.push(
        { label: 'CRM', icon: 'people', route: 'CRM', module: 'crm', section: 'modules' },
      );
    }
  }

  if (planType === 'commerce') {
    if (hasModuleAccess('sales') || accessibleModules.includes('commerce')) {
      items.push(
        { label: 'Sales', icon: 'trending-up', route: 'Sales', module: 'sales', section: 'modules' },
        { label: 'POS', icon: 'cash', route: 'POS', module: 'pos', section: 'modules' },
      );
    }
  }

  if (planType === 'workshop' || planType === 'healthcare') {
    if (hasModuleAccess('sales') || accessibleModules.includes('workshop') || accessibleModules.includes('healthcare')) {
      items.push(
        { label: 'Invoicing', icon: 'receipt', route: 'Invoicing', module: 'sales', section: 'modules' },
      );
    }
  }

  if (planType === 'workshop') {
    if (hasModuleAccess('crm') || accessibleModules.includes('workshop')) {
      items.push(
        { label: 'Customers', icon: 'people', route: 'CustomerList', module: 'crm', section: 'modules' },
      );
    }
  }

  if (hasModuleAccess('inventory') || accessibleModules.includes('commerce') || accessibleModules.includes('healthcare') || accessibleModules.includes('workshop') || planType === 'commerce' || planType === 'healthcare' || planType === 'workshop') {
    items.push(
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
      } else if (route === 'CustomerList') {
        if (planType === 'workshop') {
          props.navigation.dispatch(
            CommonActions.navigate({
              name: 'MainTabs',
              params: {
                screen: 'Workshop',
                params: {
                  screen: 'CustomerList',
                },
              },
            })
          );
        } else {
          props.navigation.dispatch(
            CommonActions.navigate({
              name: 'MainTabs',
              params: {
                screen: 'Commerce',
                params: {
                  screen: 'CustomerList',
                },
              },
            })
          );
        }
      } else if (route === 'Invoicing') {
        if (planType === 'workshop' || planType === 'healthcare') {
          props.navigation.dispatch(
            CommonActions.navigate({
              name: 'MainTabs',
              params: {
                screen: planType === 'workshop' ? 'Workshop' : 'Healthcare',
                params: {
                  screen: 'Invoicing',
                },
              },
            })
          );
        } else {
          props.navigation.dispatch(
            CommonActions.navigate({
              name: 'MainTabs',
              params: {
                screen: 'Commerce',
                params: {
                  screen: 'Invoicing',
                },
              },
            })
          );
        }
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
    const isFirstSection = title === 'Main';
    return (
      <View style={[styles.section, isFirstSection && styles.firstSection]}>
        <Text style={[styles.sectionTitle, isFirstSection && styles.firstSectionTitle]}>{title}</Text>
        {items.map(renderMenuItem)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.primary.colors}
        start={gradients.primary.start}
        end={gradients.primary.end}
        style={[styles.header, { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.lg }]}
      >
        <View style={styles.headerContent}>
          {user && (
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color={colors.background.default} />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.userName || user.email}
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
        style={{ flex: 1 }}
      >
        {renderSection('Main', mainMenuItems)}
        {moduleMenuItems.length > 0 && renderSection('Modules', moduleMenuItems)}
        {renderSection('Settings', settingsMenuItems)}
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
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
    minHeight: 120,
  },
  headerContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
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
    color: '#FFFFFF',
    fontWeight: '600' as const,
    marginBottom: spacing.xs,
    fontSize: 16,
    lineHeight: 20,
  },
  tenantName: {
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.9,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  planText: {
    ...textStyles.caption,
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 11,
    lineHeight: 14,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...textStyles.caption,
    color: colors.text.primary,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    fontSize: 12,
    lineHeight: 16,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.sm,
  },
  firstSection: {
    marginBottom: spacing.sm,
  },
  firstSectionTitle: {
    marginTop: spacing.sm,
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
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  activeLabel: {
    color: colors.background.default,
    fontWeight: '600' as const,
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
    fontWeight: '700' as const,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.paper,
    minHeight: 70,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
  },
  logoutText: {
    ...textStyles.body1,
    color: colors.status.error,
    fontWeight: '600' as const,
    fontSize: 16,
    lineHeight: 20,
  },
});
