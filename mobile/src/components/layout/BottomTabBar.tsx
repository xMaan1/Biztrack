import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, typography, spacing, borderRadius, shadows } from '@/theme';
import { useNotifications } from '@/contexts/NotificationContext';

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'home',
  Commerce: 'cart',
  Healthcare: 'medical',
  Workshop: 'construct',
  Profile: 'person',
};

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

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
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

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
              testID={options.tabBarTestID}
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
                      {label}
                    </Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.tabContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={`${iconName}-outline` as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={colors.text.secondary}
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
                    {label}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
    backgroundColor: colors.background.default,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabGradient: {
    width: '100%',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  iconContainer: {
    position: 'relative',
  },
  label: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
  },
  activeLabel: {
    color: colors.background.default,
    fontWeight: typography.fontWeight.semibold,
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
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
});
