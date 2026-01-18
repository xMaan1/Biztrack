import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, typography, textStyles, spacing, borderRadius, shadows } from '@/theme';
import { useNotifications } from '@/contexts/NotificationContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigation } from '@react-navigation/native';

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'home',
  Commerce: 'cart',
  Healthcare: 'medical',
  Workshop: 'construct',
  More: 'ellipsis-horizontal',
};

const quickActions = [
  { label: 'New', icon: 'add-circle', route: 'QuickAction' },
  { label: 'Search', icon: 'search', route: 'Search' },
  { label: 'Scan', icon: 'qr-code', route: 'Scan' },
];

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  const { planType } = useSubscription();
  const nav = useNavigation();

  const handleQuickAction = (route: string) => {
    if (route === 'QuickAction') {
      if (planType === 'commerce') {
        (nav as any).navigate('Commerce', { screen: 'CRM' });
      } else if (planType === 'healthcare') {
        (nav as any).navigate('Healthcare', { screen: 'Patients' });
      } else if (planType === 'workshop') {
        (nav as any).navigate('Workshop', { screen: 'WorkOrders' });
      }
    } else if (route === 'Search') {
    } else if (route === 'Scan') {
    }
  };

  const visibleTabs = state.routes;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.tabBar}>
        {visibleTabs.map((route, index) => {
          const actualIndex = state.routes.findIndex((r) => r.key === route.key);
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === actualIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const iconName = iconMap[route.name] || 'help';

          const showBadge = route.name === 'Notifications' && unreadCount > 0;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={(options as any).tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              {isFocused ? (
                <LinearGradient
                  colors={gradients.primary.colors}
                  start={gradients.primary.start}
                  end={gradients.primary.end}
                  style={styles.tabGradient}
                >
                  <View style={styles.tabContent}>
                    <Ionicons
                      name={iconName}
                      size={24}
                      color={colors.background.default}
                    />
                    <Text style={[styles.label, styles.activeLabel]} numberOfLines={1}>
                      {typeof label === 'string' ? label : (label as any)({ focused: true, color: colors.background.default, position: 'below-icon' as any, children: route.name })}
                    </Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.tabContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={`${iconName}-outline` as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={colors.text.primary}
                    />
                    {showBadge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.label} numberOfLines={1}>
                    {typeof label === 'string' ? label : (label as any)({ focused: false, color: colors.text.primary, position: 'below-icon' as any, children: route.name })}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {visibleTabs.length < 3 && (
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('QuickAction')}
            >
              <LinearGradient
                colors={gradients.primary.colors}
                start={gradients.primary.start}
                end={gradients.primary.end}
                style={styles.quickActionGradient}
              >
                <Ionicons
                  name="add"
                  size={24}
                  color={colors.background.default}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: colors.gray[900],
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  tabBar: {
    flexDirection: 'row',
    height: 75,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tabGradient: {
    width: '100%',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 56,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  iconContainer: {
    position: 'relative',
  },
  label: {
    ...textStyles.caption,
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold as '600',
    marginTop: spacing.xs,
    lineHeight: 16,
    textAlign: 'center',
  },
  activeLabel: {
    color: colors.background.default,
    fontWeight: typography.fontWeight.bold as '700',
    fontSize: 13,
    marginTop: spacing.xs,
    lineHeight: 16,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.status.error,
    borderRadius: borderRadius.full,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background.default,
  },
  badgeText: {
    color: colors.background.default,
    fontSize: 9,
    fontWeight: typography.fontWeight.bold as '700',
  },
  quickActionsContainer: {
    paddingLeft: spacing.xs,
    borderLeftWidth: 1,
    borderLeftColor: colors.border.light,
  },
  quickActionButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionGradient: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.gray[900],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
