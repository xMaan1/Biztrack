import { View, Text, Pressable } from 'react-native';
import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { useRBAC } from '../../contexts/RBACContext';
import { evalSidebarPathPermission } from '../../hooks/useSidebarFilteredMenu';
import { MenuHeaderButton } from '../../components/layout/MenuHeaderButton';
import { MobileWorkshopWorkOrdersScreen } from './screens/MobileWorkshopWorkOrdersScreen';
import { MobileWorkshopJobCardsScreen } from './screens/MobileWorkshopJobCardsScreen';
import { MobileWorkshopVehiclesScreen } from './screens/MobileWorkshopVehiclesScreen';
import { MobileWorkshopProductionScreen } from './screens/MobileWorkshopProductionScreen';
import { MobileWorkshopQualityScreen } from './screens/MobileWorkshopQualityScreen';
import { MobileWorkshopMaintenanceScreen } from './screens/MobileWorkshopMaintenanceScreen';

function WorkshopAccessDenied(props: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
        <MenuHeaderButton />
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          Workshop access
        </Text>
        <Text className="mt-2 text-center text-slate-600">
          You do not have permission to open this module.
        </Text>
        <Pressable
          className="mt-6 items-center rounded-lg bg-blue-600 py-3"
          onPress={props.onBack}
        >
          <Text className="font-semibold text-white">Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function WorkshopRouter() {
  const { workspacePath, setWorkspacePath } = useSidebarDrawer();
  const { hasPermission, isOwner, hasModuleAccess } = useRBAC();

  if (!isWorkshopWorkspacePath(workspacePath)) {
    return null;
  }

  const ok =
    hasModuleAccess('production') &&
    evalSidebarPathPermission(workspacePath, isOwner, hasPermission);

  if (!ok) {
    return <WorkshopAccessDenied onBack={() => setWorkspacePath('/dashboard')} />;
  }

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
      return <WorkshopAccessDenied onBack={() => setWorkspacePath('/dashboard')} />;
  }
}

export function isWorkshopWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return n.startsWith('/workshop-management/');
}
