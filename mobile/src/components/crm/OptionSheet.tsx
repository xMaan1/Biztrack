import { View, Text, Pressable, ScrollView } from 'react-native';
import { AppModal } from '../../components/layout/AppModal';

export type OptionItem<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  visible: boolean;
  title: string;
  options: OptionItem<T>[];
  onSelect: (value: T) => void;
  onClose: () => void;
};

export function OptionSheet<T extends string>({
  visible,
  title,
  options,
  onSelect,
  onClose,
}: Props<T>) {
  return (
    <AppModal visible={visible} transparent animationType="fade">
      <Pressable
        className="flex-1 justify-end bg-black/40"
        onPress={onClose}
      >
        <Pressable
          className="max-h-[70%] rounded-t-2xl bg-white"
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="border-b border-slate-200 px-4 py-3 text-base font-semibold text-slate-900">
            {title}
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled" className="px-2 py-2">
            {options.map((o) => (
              <Pressable
                key={o.value}
                className="rounded-xl px-4 py-3 active:bg-slate-100"
                onPress={() => {
                  onSelect(o.value);
                  onClose();
                }}
              >
                <Text className="text-base text-slate-800">{o.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            className="border-t border-slate-200 py-3"
            onPress={onClose}
          >
            <Text className="text-center font-semibold text-slate-600">
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </AppModal>
  );
}
