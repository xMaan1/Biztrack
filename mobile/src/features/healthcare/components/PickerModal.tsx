import React from 'react';
import { View, Text, Pressable, FlatList, TextInput } from 'react-native';
import { AppModal } from '../../../components/layout/AppModal';

export function PickerModal<T extends { id: string; label: string }>(props: {
  visible: boolean;
  title: string;
  items: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
  search?: string;
  onSearchChange?: (q: string) => void;
}) {
  return (
    <AppModal
      visible={props.visible}
      animationType="slide"
      transparent
      onClose={props.onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[80%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
          <Text className="mb-3 text-lg font-semibold text-slate-900">
            {props.title}
          </Text>
          {props.onSearchChange ? (
            <TextInput
              className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900"
              placeholder="Search…"
              placeholderTextColor="#94a3b8"
              value={props.search}
              onChangeText={props.onSearchChange}
            />
          ) : null}
          <FlatList
            data={props.items}
            keyExtractor={(x) => x.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                className="border-b border-slate-100 py-3 active:bg-slate-50"
                onPress={() => {
                  props.onSelect(item);
                  props.onClose();
                }}
              >
                <Text className="text-base text-slate-800">{item.label}</Text>
              </Pressable>
            )}
          />
          <Pressable
            className="mt-4 items-center rounded-lg border border-slate-300 py-3"
            onPress={props.onClose}
          >
            <Text className="font-semibold text-slate-700">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </AppModal>
  );
}
