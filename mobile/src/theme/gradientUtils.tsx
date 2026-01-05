import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, Gradients } from './gradients';
import { StyleProp, ViewStyle } from 'react-native';

interface GradientViewProps {
  gradient: keyof Gradients;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const GradientView: React.FC<GradientViewProps> = ({
  gradient,
  style,
  children,
}) => {
  const gradientConfig = gradients[gradient];

  return (
    <LinearGradient
      colors={gradientConfig.colors}
      start={gradientConfig.start}
      end={gradientConfig.end}
      style={style}
    >
      {children}
    </LinearGradient>
  );
};

export const getGradientColors = (gradient: keyof Gradients) => {
  return gradients[gradient].colors;
};

export const getGradientConfig = (gradient: keyof Gradients) => {
  return gradients[gradient];
};

