import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appError } from '../../../utils/appDialog';
import {
  getMyEmployeeProfile,
  updateMyEmployeeProfile,
} from '../../../services/employeePortal/employeePortalMobileApi';
import type { Employee } from '../../../models/hrm';
import {
  WorkshopChrome,
  WorkshopLoading,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopPrimaryButton,
  WorkshopDetailRow,
} from '../../workshop/components/WorkshopChrome';

export function MobileEmployeeProfileScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const p = await getMyEmployeeProfile();
      setProfile(p);
      setPhone(p.phone ?? '');
      setAddress(p.address ?? '');
      setEmergencyContact(p.emergencyContact ?? '');
      setEmergencyPhone(p.emergencyPhone ?? '');
    } catch (e) {
      appError('Profile', extractErrorMessage(e, 'Failed to load profile'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath('/employee-portal/profile');
  }, [setSidebarActivePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateMyEmployeeProfile({
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined,
      });
      setProfile(updated);
      appAlert('Profile', 'Profile updated');
    } catch (e) {
      appError('Profile', extractErrorMessage(e, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <WorkshopLoading />;

  return (
    <WorkshopChrome title="My profile" subtitle="Personal information">
      <View className="mb-4 items-center">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
          <Text className="text-2xl font-bold text-indigo-700">
            {(profile?.firstName?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <Text className="mt-3 text-lg font-bold text-slate-900">
          {profile?.firstName} {profile?.lastName}
        </Text>
        <Text className="text-sm text-slate-500">{profile?.position}</Text>
      </View>
      <WorkshopDetailRow label="Email" value={profile?.email ?? '—'} />
      <WorkshopDetailRow label="Department" value={profile?.department ?? '—'} />
      <WorkshopDetailRow label="Employee ID" value={profile?.employeeId ?? '—'} />
      <WorkshopDetailRow label="Hire date" value={profile?.hireDate?.slice(0, 10) ?? '—'} />
      <WorkshopFieldLabel>Phone</WorkshopFieldLabel>
      <WorkshopTextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <WorkshopFieldLabel>Address</WorkshopFieldLabel>
      <WorkshopTextInput value={address} onChangeText={setAddress} multiline />
      <WorkshopFieldLabel>Emergency contact</WorkshopFieldLabel>
      <WorkshopTextInput value={emergencyContact} onChangeText={setEmergencyContact} />
      <WorkshopFieldLabel>Emergency phone</WorkshopFieldLabel>
      <WorkshopTextInput value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" />
      <WorkshopPrimaryButton label={saving ? 'Saving...' : 'Save changes'} onPress={() => void save()} />
    </WorkshopChrome>
  );
}
