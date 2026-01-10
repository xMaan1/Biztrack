import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, typography, textStyles, spacing, borderRadius } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  rightIcon?: string;
  onRightPress?: () => void;
  onBackPress?: () => void;
  gradient?: boolean;
}

export function Header({
  title,
  showBack = false,
  rightAction,
  rightIcon,
  onRightPress,
  onBackPress,
  gradient = true,
}: HeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, currentTenant } = useAuth();
  const { unreadCount } = useNotifications();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const textColor = gradient ? colors.background.default : colors.text.primary;
  const iconColor = gradient ? colors.background.default : colors.text.primary;

  const headerContent = (
    <View
      style={[
        styles.headerContent,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: spacing.md,
        },
      ]}
    >
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={iconColor} />
          </TouchableOpacity>
        )}
        {title && (
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
        )}
        {!title && currentTenant && (
          <View style={styles.tenantInfo}>
            <Text style={[styles.tenantName, { color: textColor }]} numberOfLines={1}>
              {currentTenant.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.rightSection}>
        {rightAction || (rightIcon && onRightPress) ? (
          rightAction || (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onRightPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name={rightIcon as any} size={24} color={iconColor} />
            </TouchableOpacity>
          )
        ) : (
          <View style={styles.defaultActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notifications' as never)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="notifications-outline" size={24} color={iconColor} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Profile' as never)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="person-circle-outline" size={24} color={iconColor} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={gradients.primary.colors}
        start={gradients.primary.start}
        end={gradients.primary.end}
        style={styles.container}
      >
        {headerContent}
      </LinearGradient>
    );
  }

  return <View style={[styles.container, styles.solidBackground]}>{headerContent}</View>;
}

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: colors.gray[900],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  solidBackground: {
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    minHeight: 64,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.sm,
  },
  title: {
    ...textStyles.h5,
    flex: 1,
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 24,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    ...textStyles.h5,
    fontWeight: typography.fontWeight.semibold,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    position: 'relative',
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.status.error,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background.default,
  },
  badgeText: {
    color: colors.background.default,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
});
