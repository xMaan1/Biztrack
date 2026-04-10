import { View, Text } from 'react-native';
import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { MobileWorkshopWorkOrdersScreen } from './screens/MobileWorkshopWorkOrdersScreen';
import { MobileWorkshopJobCardsScreen } from './screens/MobileWorkshopJobCardsScreen';
import { MobileWorkshopVehiclesScreen } from './screens/MobileWorkshopVehiclesScreen';
import { MobileWorkshopProductionScreen } from './screens/MobileWorkshopProductionScreen';
import { MobileWorkshopQualityScreen } from './screens/MobileWorkshopQualityScreen';
import { MobileWorkshopMaintenanceScreen } from './screens/MobileWorkshopMaintenanceScreen';

export function WorkshopRouter() {
  const { workspacePath } = useSidebarDrawer();

  switch (workspacePath) {
    case '/workshop-management/work-orders':
      return <MobileWorkshopWorkOrdersScreen />;
    case '/workshop-management/job-cards':
      return <MobileWorkshopJobCardsScreen />;
    case '/workshop-management/vehicles':
      return <MobileWorkshopVehiclesScreen />;
    case '/workshop-management/production':
      return <MobileWorkshopProductionScreen />;
    case '/workshop-management/quality-control':
      return <MobileWorkshopQualityScreen />;
    case '/workshop-management/maintenance':
      return <MobileWorkshopMaintenanceScreen />;
    default:
      return (
        <View className="flex-1 items-center justify-center bg-slate-50 px-6">
          <Text className="text-center text-slate-600">
            Unknown workshop route.
          </Text>
        </View>
      );
  }
}

export function isWorkshopWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return n.startsWith('/workshop-management/');
}
