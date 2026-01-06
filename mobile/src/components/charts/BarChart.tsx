import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BarChart as RNBarChart } from 'react-native-chart-kit';
import { colors, spacing } from '@/theme';

interface BarChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
    }>;
  };
  height?: number;
}

export function BarChart({ data, height = 220 }: BarChartProps) {
  const screenWidth = Dimensions.get('window').width - spacing.lg * 2;

  const chartConfig = {
    backgroundColor: colors.light.background,
    backgroundGradientFrom: colors.light.background,
    backgroundGradientTo: colors.light.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  return (
    <View style={styles.container}>
      <RNBarChart
        data={data}
        width={screenWidth}
        height={height}
        chartConfig={chartConfig}
        style={styles.chart}
        yAxisLabel=""
        yAxisSuffix=""
        showValuesOnTopOfBars
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  chart: {
    marginVertical: spacing.xs,
    borderRadius: 16,
  },
});

