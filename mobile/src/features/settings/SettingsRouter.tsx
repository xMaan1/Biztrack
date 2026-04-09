import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { MobileGeneralSettingsScreen } from './screens/MobileGeneralSettingsScreen';
import { MobileNotificationSettingsScreen } from './screens/MobileNotificationSettingsScreen';
import { MobileSubscriptionManageScreen } from './screens/MobileSubscriptionManageScreen';
import { isSettingsWorkspacePath } from './settingsPaths';

export function SettingsRouter() {
  const { workspacePath } = useSidebarDrawer();

  if (!isSettingsWorkspacePath(workspacePath)) {
    return null;
  }

  switch (workspacePath) {
    case '/settings':
      return <MobileGeneralSettingsScreen />;
    case '/notifications/settings':
      return <MobileNotificationSettingsScreen />;
    case '/subscription/manage':
      return <MobileSubscriptionManageScreen />;
    default:
      return null;
  }
}
