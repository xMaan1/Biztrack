import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppModal } from '../layout/AppModal';
import { KeyboardBottomSheetShell } from '../layout/KeyboardBottomSheetShell';
import { WS } from '../../features/workshop/components/workshopTheme';

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
    <AppModal
      visible={visible}
      transparent
      animationType="slide"
      onClose={onClose}
    >
      <KeyboardBottomSheetShell
        overlayColor="rgba(15,23,42,0.55)"
        onOverlayPress={onClose}
      >
        <Pressable
          style={{
            maxHeight: '70%',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: WS.card,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: WS.border,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: WS.text }}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={WS.textMuted} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
            {options.map((o) => (
              <Pressable
                key={o.value}
                onPress={() => {
                  onSelect(o.value);
                  onClose();
                }}
                style={({ pressed }) => ({
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  marginBottom: 4,
                  backgroundColor: pressed ? WS.primaryLight : 'transparent',
                })}
              >
                <Text style={{ fontSize: 16, color: WS.text }}>{o.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            onPress={onClose}
            style={{
              borderTopWidth: 1,
              borderTopColor: WS.border,
              paddingVertical: 16,
            }}
          >
            <Text style={{ textAlign: 'center', fontWeight: '700', color: WS.textMuted }}>
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </KeyboardBottomSheetShell>
    </AppModal>
  );
}
