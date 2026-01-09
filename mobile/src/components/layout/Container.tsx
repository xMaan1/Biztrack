import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, spacing } from '@/theme';

interface ContainerProps {
  children: React.ReactNode;
  gradient?: boolean;
  gradientType?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'glass' | 'dark';
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  safeArea?: boolean;
}

export function Container({
  children,
  gradient = false,
  gradientType = 'primary',
  scrollable = false,
  style,
  contentContainerStyle,
  safeArea = true,
}: ContainerProps) {
  const insets = useSafeAreaInsets();

  const containerStyle = [
    styles.container,
    safeArea && {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    style,
  ];

  const contentStyle = [styles.content, contentContainerStyle];

  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={contentStyle}>{children}</View>
  );

  if (gradient) {
    const gradientConfig = gradients[gradientType];

    return (
      <LinearGradient
        colors={gradientConfig.colors}
        start={gradientConfig.start}
        end={gradientConfig.end}
        style={containerStyle}
      >
        {content}
      </LinearGradient>
    );
  }

  return <View style={[containerStyle, styles.solidBackground]}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  solidBackground: {
    backgroundColor: colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});
