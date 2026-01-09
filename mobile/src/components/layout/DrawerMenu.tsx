import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, typography, spacing, borderRadius } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

interface MenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: 'home', route: 'Dashboard' },
  { label: 'Commerce', icon: 'cart', route: 'Commerce' },
  { label: 'Healthcare', icon: 'medical', route: 'Healthcare' },
  { label: 'Workshop', icon: 'construct', route: 'Workshop' },
  { label: 'Settings', icon: 'settings', route: 'Settings' },
  { label: 'Profile', icon: 'person', route: 'Profile' },
];

export function DrawerMenu(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { user, currentTenant, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const handleNavigation = (route: string) => {
    props.navigation.navigate(route as never);
    props.navigation.closeDrawer();
  };

  const handleLogout = async () => {
    await logout();
    props.navigation.closeDrawer();
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
        {menuItems.map((item) => {
          const isActive = props.state.routes[props.state.index]?.name === item.route;
          const badgeCount = item.route === 'Notifications' ? unreadCount : item.badge;

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
                    color={colors.text.primary}
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
        })}
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
    ...typography.textStyles.h6,
    color: colors.background.default,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  tenantName: {
    ...typography.textStyles.body2,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollContent: {
    paddingTop: spacing.md,
  },
  menuItem: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  menuItemLabel: {
    ...typography.textStyles.body1,
    color: colors.text.primary,
    flex: 1,
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
    paddingVertical: spacing.md,
  },
  logoutText: {
    ...typography.textStyles.body1,
    color: colors.status.error,
    fontWeight: typography.fontWeight.medium,
  },
});
