import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart as RNLineChart } from 'react-native-chart-kit';
import { colors, spacing } from '@/theme';

interface LineChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      color?: (opacity: number) => string;
      strokeWidth?: number;
    }>;
  };
  height?: number;
}

export function LineChart({ data, height = 220 }: LineChartProps) {
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
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.light.primary,
    },
  };

  return (
    <View style={styles.container}>
      <RNLineChart
        data={data}
        width={screenWidth}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
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

