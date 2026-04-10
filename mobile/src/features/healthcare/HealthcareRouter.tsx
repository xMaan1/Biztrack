import { View, Text } from 'react-native';
import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import { MobileHealthcareAppointmentsScreen } from './screens/MobileHealthcareAppointmentsScreen';
import { MobileHealthcarePatientsScreen } from './screens/MobileHealthcarePatientsScreen';
import { MobileHealthcareStaffScreen } from './screens/MobileHealthcareStaffScreen';
import { MobileHealthcareDoctorsScreen } from './screens/MobileHealthcareDoctorsScreen';
import { MobileHealthcareCalendarScreen } from './screens/MobileHealthcareCalendarScreen';
import { MobileHealthcarePatientHistoryScreen } from './screens/MobileHealthcarePatientHistoryScreen';
import { MobileHealthcareAdmittedPatientsScreen } from './screens/MobileHealthcareAdmittedPatientsScreen';
import { MobileHealthcarePaymentsScreen } from './screens/MobileHealthcarePaymentsScreen';
import { MobileHealthcareDailyExpenseScreen } from './screens/MobileHealthcareDailyExpenseScreen';

export function HealthcareRouter() {
  const { workspacePath } = useSidebarDrawer();

  switch (workspacePath) {
    case '/healthcare/appointments':
      return <MobileHealthcareAppointmentsScreen />;
    case '/healthcare/patients':
      return <MobileHealthcarePatientsScreen />;
    case '/healthcare/staff':
      return <MobileHealthcareStaffScreen />;
    case '/healthcare/doctors':
      return <MobileHealthcareDoctorsScreen />;
    case '/healthcare/calendar':
      return <MobileHealthcareCalendarScreen />;
    case '/healthcare/patient-history':
      return <MobileHealthcarePatientHistoryScreen />;
    case '/healthcare/admitted-patients':
      return <MobileHealthcareAdmittedPatientsScreen />;
    case '/healthcare/payments':
      return <MobileHealthcarePaymentsScreen />;
    case '/healthcare/daily-expense':
      return <MobileHealthcareDailyExpenseScreen />;
    default:
      return (
        <View className="flex-1 items-center justify-center bg-slate-50 px-6">
          <Text className="text-center text-slate-600">
            Unknown healthcare route.
          </Text>
        </View>
      );
  }
}

export function isHealthcareWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return n.startsWith('/healthcare/');
}
