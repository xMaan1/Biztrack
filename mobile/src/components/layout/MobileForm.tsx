import React from 'react';
import { View, Text, TextInput, Pressable, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  onSave: () => void;
  saveLoading?: boolean;
}

export const FormHeader: React.FC<FormHeaderProps> = ({ 
  title, 
  onCancel, 
  onSave,
  saveLoading 
}) => (
  <View className="flex-row items-center justify-between border-b border-slate-100 bg-white px-4 py-4">
    <Pressable 
      onPress={onCancel}
      className="h-10 w-10 items-center justify-center rounded-full bg-slate-50 active:bg-slate-100"
    >
      <Ionicons name="close" size={24} color="#64748b" />
    </Pressable>
    <Text className="text-lg font-bold text-slate-900">{title}</Text>
    <Pressable 
      onPress={onSave}
      disabled={saveLoading}
      className="rounded-xl bg-blue-600 px-5 py-2.5 active:bg-blue-700 shadow-sm shadow-blue-200"
    >
      <Text className="font-bold text-white text-sm">Save</Text>
    </Pressable>
  </View>
);
