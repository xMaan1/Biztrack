import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { View, Text, Pressable } from 'react-native';
import { MenuHeaderButton } from '../../components/layout/MenuHeaderButton';
import { MobileGeneralSettingsScreen } from './screens/MobileGeneralSettingsScreen';
import { MobileInvoiceCustomizationScreen } from './screens/MobileInvoiceCustomizationScreen';
import { MobileNotificationSettingsScreen } from './screens/MobileNotificationSettingsScreen';
import { MobileSubscriptionManageScreen } from './screens/MobileSubscriptionManageScreen';
import { MobileNotificationsScreen } from '../notifications/screens/MobileNotificationsScreen';
import { isSettingsWorkspacePath } from './settingsPaths';

function SettingsFallback(props: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
        <MenuHeaderButton />
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          Settings route
        </Text>
        <Text className="mt-2 text-center text-slate-600">
          This settings page is not available.
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

export function SettingsRouter() {
  const { workspacePath, setWorkspacePath } = useSidebarDrawer();

  if (!isSettingsWorkspacePath(workspacePath)) {
    return null;
  }

  switch (workspacePath) {
    case '/settings':
      return <MobileGeneralSettingsScreen />;
    case '/settings/invoice':
      return <MobileInvoiceCustomizationScreen />;
    case '/notifications':
      return <MobileNotificationsScreen />;
    case '/notifications/settings':
      return <MobileNotificationSettingsScreen />;
    case '/subscription/manage':
      return <MobileSubscriptionManageScreen />;
    default:
      return <SettingsFallback onBack={() => setWorkspacePath('/dashboard')} />;
  }
}
