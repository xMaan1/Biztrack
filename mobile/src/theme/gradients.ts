export const gradients = {
  primary: {
    colors: ['#2563eb', '#7c3aed', '#4f46e5'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  secondary: {
    colors: ['#ec4899', '#ef4444', '#f59e0b'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  success: {
    colors: ['#10b981', '#3b82f6'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  warning: {
    colors: ['#fbbf24', '#f97316'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  danger: {
    colors: ['#ef4444', '#ec4899'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  instagram: {
    colors: ['#7c3aed', '#ec4899', '#f97316'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  facebook: {
    colors: ['#2563eb', '#1e40af'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  glass: {
    colors: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

export type Gradients = typeof gradients;

