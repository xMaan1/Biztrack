import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, children }) => (
  <View className="mb-6">
    {title && (
      <Text className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
        {title}
      </Text>
    )}
    <View className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100">
      {children}
    </View>
  </View>
);

interface FormInputProps extends TextInputProps {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  last?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({ 
  label, 
  icon, 
  last, 
  className,
  ...props 
}) => (
  <View className={`px-4 py-3 ${!last ? 'border-b border-slate-50' : ''}`}>
    <View className="flex-row items-center mb-1">
      {icon && <Ionicons name={icon} size={14} color="#94a3b8" className="mr-1" />}
      <Text className="text-[11px] font-semibold text-slate-500 uppercase">{label}</Text>
    </View>
    <TextInput
      className={`text-base text-slate-900 p-0 ${className}`}
      placeholderTextColor="#cbd5e1"
      {...props}
    />
  </View>
);

interface FormSelectProps {
  label: string;
  value: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  last?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({ 
  label, 
  value, 
  onPress, 
  icon, 
  last 
}) => (
  <Pressable 
    onPress={onPress}
    className={`px-4 py-3 active:bg-slate-50 ${!last ? 'border-b border-slate-50' : ''}`}
  >
    <View className="flex-row items-center mb-1">
      {icon && <Ionicons name={icon as any} size={14} color="#94a3b8" className="mr-1" />}
      <Text className="text-[11px] font-semibold text-slate-500 uppercase">{label}</Text>
    </View>
    <View className="flex-row items-center justify-between">
      <Text className={`text-base ${value ? 'text-slate-900' : 'text-slate-300'}`}>
        {value || 'Select option'}
      </Text>
      <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
    </View>
  </Pressable>
);

interface FormHeaderProps {
  title: string;
  onCancel: () => void;
}

export const FormHeader: React.FC<FormHeaderProps> = ({ 
  title, 
  onCancel,
}) => (
  <View className="flex-row items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
    <Pressable 
      onPress={onCancel}
      className="h-10 w-10 items-center justify-center rounded-full bg-slate-50 active:bg-slate-100"
    >
      <Ionicons name="close" size={24} color="#64748b" />
    </Pressable>
    <Text className="text-lg font-bold text-slate-900">{title}</Text>
    <View className="w-10" />
  </View>
);

interface FormFooterActionsProps {
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  saveLoading?: boolean;
}

export const FormFooterActions: React.FC<FormFooterActionsProps> = ({
  onCancel,
  onSave,
  saveLabel = 'Save',
  saveLoading,
}) => (
  <View className="border-t border-slate-100 bg-white px-4 pb-3 pt-3">
    <View className="flex-row gap-2">
      <Pressable
        onPress={onCancel}
        className="flex-1 items-center rounded-xl border border-slate-300 py-3 active:bg-slate-50"
      >
        <Text className="font-semibold text-slate-700">Cancel</Text>
      </Pressable>
      <Pressable
        onPress={onSave}
        disabled={saveLoading}
        className="flex-1 items-center rounded-xl bg-blue-600 py-3 active:bg-blue-700"
      >
        {saveLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="font-semibold text-white">{saveLabel}</Text>
        )}
      </Pressable>
    </View>
  </View>
);

interface MobileFormSheetProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  saveLoading?: boolean;
  children: React.ReactNode;
}

export const MobileFormSheet: React.FC<MobileFormSheetProps> = ({
  visible,
  title,
  onCancel,
  onSave,
  saveLabel,
  saveLoading,
  children,
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    presentationStyle="pageSheet"
    onRequestClose={onCancel}
  >
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'bottom']}>
      <FormHeader title={title} onCancel={onCancel} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1 px-4 pt-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      <FormFooterActions
        onCancel={onCancel}
        onSave={onSave}
        saveLabel={saveLabel}
        saveLoading={saveLoading}
      />
    </SafeAreaView>
  </Modal>
);
