import { View, Text, Pressable } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface NonCommerceScreenProps {
  planType: string;
}

export function NonCommerceScreen({ planType }: NonCommerceScreenProps) {
  const { logout, user } = useAuth();

  return (
    <View className="flex-1 justify-center bg-slate-50 px-6">
      <View className="rounded-2xl border border-slate-200 bg-white p-6">
        <Text className="text-center text-2xl font-bold text-slate-900">
          Dashboard
        </Text>
        <Text className="mt-3 text-center text-base text-slate-600">
          Your workspace uses the{' '}
          <Text className="font-semibold text-slate-800">{planType}</Text> plan.
          The mobile app currently opens the commerce dashboard for commerce
          tenants only.
        </Text>
        {user?.email ? (
          <Text className="mt-4 text-center text-sm text-slate-500">
            Signed in as {user.email}
          </Text>
        ) : null}
        <Pressable
          className="mt-8 items-center rounded-lg border border-slate-300 py-3 active:bg-slate-100"
          onPress={() => void logout()}
        >
          <Text className="font-semibold text-slate-800">Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}
