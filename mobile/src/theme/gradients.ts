import { colors } from "./colors";

export const gradients = {
  primary: {
    colors: ["#2563eb", "#7c3aed", "#4338ca"] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  success: {
    colors: ["#4ade80", "#3b82f6"] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  warning: {
    colors: ["#facc15", "#fb923c"] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  danger: {
    colors: ["#f87171", "#ec4899"] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  secondary: {
    colors: ["#ec4899", "#f87171", "#facc15"] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  glass: {
    colors: ["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  dark: {
    colors: ["#667eea", "#764ba2"] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

export const gradientColors = {
  primary: ["#2563eb", "#7c3aed", "#4338ca"],
  success: ["#4ade80", "#3b82f6"],
  warning: ["#facc15", "#fb923c"],
  danger: ["#f87171", "#ec4899"],
  secondary: ["#ec4899", "#f87171", "#facc15"],
  glass: ["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"],
  dark: ["#667eea", "#764ba2"],
};

