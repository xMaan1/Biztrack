import { ChartData } from './types';

export function generateProgressChartData(recentProjects: any[]): ChartData['progressData'] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = new Array(7).fill(0);
  
  if (recentProjects.length > 0) {
    recentProjects.slice(0, 7).forEach((project, index) => {
      if (index < 7) {
        data[index] = project.completionPercent || 0;
      }
    });
    
    if (recentProjects.length < 7) {
      const avgProgress = Math.round(
        recentProjects.reduce((sum, p) => sum + (p.completionPercent || 0), 0) /
        recentProjects.length
      );
      for (let i = recentProjects.length; i < 7; i++) {
        data[i] = avgProgress;
      }
    }
  }
  
  return {
    labels: days,
    datasets: [{ data }],
  };
}

export function generateActivityChartData(projectStats: any, workOrderStats: any): ChartData['activityData'] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const totalProjects = projectStats.total || 0;
  const totalWorkOrders = workOrderStats.total || 0;
  const totalActivity = totalProjects + totalWorkOrders;
  
  const data = months.map(() => {
    if (totalActivity === 0) return 0;
    const baseValue = Math.floor(totalActivity / 6);
    const variation = Math.floor(Math.random() * (baseValue * 0.3));
    return Math.max(0, baseValue + variation - Math.floor(baseValue * 0.15));
  });
  
  return {
    labels: months,
    datasets: [{ data }],
  };
}
