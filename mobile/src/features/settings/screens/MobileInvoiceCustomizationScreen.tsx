import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  getInvoiceCustomization,
  updateInvoiceCustomization,
} from '../../../services/settings/invoiceCustomizationMobileApi';
import type { InvoiceCustomizationUpdate } from '../../../models/sales/InvoiceCustomization';

export function MobileInvoiceCustomizationScreen() {
  const { setWorkspacePath } = useSidebarDrawer();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<InvoiceCustomizationUpdate>({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    bank_sort_code: '',
    bank_account_number: '',
    payment_instructions: '',
    default_payment_instructions: '',
    footer_text: '',
    thank_you_message: '',
    default_currency: 'USD',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getInvoiceCustomization();
      setData({
        company_name: res.company_name || '',
        company_address: res.company_address || '',
        company_phone: res.company_phone || '',
        company_email: res.company_email || '',
        company_website: res.company_website || '',
        bank_sort_code: res.bank_sort_code || '',
        bank_account_number: res.bank_account_number || '',
        payment_instructions: res.payment_instructions || '',
        default_payment_instructions: res.default_payment_instructions || '',
        footer_text: res.footer_text || '',
        thank_you_message: res.thank_you_message || '',
        default_currency: res.default_currency || 'USD',
      });
    } catch (e) {
      Alert.alert('Error', extractErrorMessage(e, 'Failed to load customization'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    try {
      setSaving(true);
      await updateInvoiceCustomization(data);
      Alert.alert('Success', 'Invoice customization updated successfully');
    } catch (e) {
      Alert.alert('Error', extractErrorMessage(e, 'Failed to save changes'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-2 py-4">
        <Pressable 
          onPress={() => setWorkspacePath('/settings')}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </Pressable>
        <Text className="text-lg font-black text-slate-900">Customization</Text>
        <Pressable 
          onPress={() => void save()} 
          disabled={saving}
          className={`rounded-xl px-4 py-2 ${saving ? 'bg-slate-300' : 'bg-blue-600'}`}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="font-bold text-white">Save</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 py-6">
          <View className="mb-6 rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <Text className="mb-4 text-sm font-black uppercase tracking-widest text-slate-400">Business Details</Text>
            
            <View className="mb-4">
              <Text className="mb-1 text-xs font-bold text-slate-700">Company Name</Text>
              <TextInput
                value={data.company_name}
                onChangeText={(t) => setData({ ...data, company_name: t })}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                placeholder="Business Name"
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1 text-xs font-bold text-slate-700">Address</Text>
              <TextInput
                value={data.company_address}
                onChangeText={(t) => setData({ ...data, company_address: t })}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                placeholder="Physical Address"
                multiline
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1 text-xs font-bold text-slate-700">Phone</Text>
              <TextInput
                value={data.company_phone}
                onChangeText={(t) => setData({ ...data, company_phone: t })}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1 text-xs font-bold text-slate-700">Business Email</Text>
              <TextInput
                value={data.company_email}
                onChangeText={(t) => setData({ ...data, company_email: t })}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                placeholder="billing@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1 text-xs font-bold text-slate-700">Website</Text>
              <TextInput
                value={data.company_website}
                onChangeText={(t) => setData({ ...data, company_website: t })}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                placeholder="https://company.com"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View className="mb-6 rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <Text className="mb-4 text-sm font-black uppercase tracking-widest text-slate-400">Banking Details</Text>
            
            <View className="mb-4">
              <Text className="mb-1 text-xs font-bold text-slate-700">Sort Code</Text>
              <TextInput
                value={data.bank_sort_code}
                onChangeText={(t) => setData({ ...data, bank_sort_code: t })}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                placeholder="00-00-00"
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1 text-xs font-bold text-slate-700">Account Number</Text>
              <TextInput
                value={data.bank_account_number}
                onChangeText={(t) => setData({ ...data, bank_account_number: t })}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                placeholder="12345678"
                keyboardType="number-pad"
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1 text-xs font-bold text-slate-700">Default Currency</Text>
              <TextInput
                value={data.default_currency}
                onChangeText={(t) => setData({ ...data, default_currency: t })}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                placeholder="USD"
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View className="mb-20 rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
            <Text className="mb-4 text-sm font-black uppercase tracking-widest text-slate-400">Payment & Footer</Text>
            
            <View className="mb-4">
              <Text className="mb-1 text-xs font-bold text-slate-700">Payment Instructions</Text>
              <TextInput
                value={data.payment_instructions}
                onChangeText={(t) => setData({ ...data, payment_instructions: t })}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                placeholder="Instructions for this invoice..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1 text-xs font-bold text-slate-700">Thank You Message</Text>
              <TextInput
                value={data.thank_you_message}
                onChangeText={(t) => setData({ ...data, thank_you_message: t })}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                placeholder="Thank you for your business!"
              />
            </View>

            <View className="mb-4">
              <Text className="mb-1 text-xs font-bold text-slate-700">Footer Text</Text>
              <TextInput
                value={data.footer_text}
                onChangeText={(t) => setData({ ...data, footer_text: t })}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                placeholder="Alternative contact info or legal footer..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
