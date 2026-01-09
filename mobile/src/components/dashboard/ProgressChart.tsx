import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors, spacing, typography, textStyles, borderRadius, shadows } from '@/theme';

const screenWidth = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 20;
const SECTION_GAP = 32;

interface ProgressChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
    }>;
  };
}

export function ProgressChart({ data }: ProgressChartProps) {
  return (
    <View style={styles.chartSection}>
      <Text style={styles.sectionTitle}>Progress Overview</Text>
      <View style={styles.chartCard}>
        <LineChart
          data={{
            labels: data.labels,
            datasets: [
              {
                data: data.datasets[0].data,
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                strokeWidth: 2,
              },
            ],
          }}
          width={screenWidth - HORIZONTAL_PADDING * 2 - spacing.md * 2}
          height={220}
          chartConfig={{
            backgroundColor: colors.background.default,
            backgroundGradientFrom: colors.background.default,
            backgroundGradientTo: colors.background.default,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: borderRadius.lg,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: colors.primary.main,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartSection: {
    marginBottom: SECTION_GAP,
  },
  sectionTitle: {
    ...textStyles.h5,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
    fontWeight: typography.fontWeight.semibold as any,
    lineHeight: 24,
  },
  chartCard: {
    backgroundColor: colors.card.background,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    ...shadows.md,
  },
  chart: {
    borderRadius: borderRadius.md,
    marginLeft: -spacing.md,
  },
});
