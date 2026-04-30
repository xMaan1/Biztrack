import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { AppModal } from '../../../components/layout/AppModal';

export type WorkOrderDetail = {
  id: string;
  work_order_number: string;
  title: string;
  description: string;
  work_order_type?: string;
  status?: string;
  priority?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  estimated_hours?: number;
  location?: string;
  instructions?: string;
  safety_notes?: string;
  quality_requirements?: string;
  materials_required?: string[];
  estimated_cost?: number;
  tags?: string[];
};

type Props = {
  visible: boolean;
  workOrder: WorkOrderDetail | null;
  onClose: () => void;
  onEdit: (w: WorkOrderDetail) => void;
};

function fmtDate(s?: string) {
  if (!s) return '—';
  return s.split('T')[0] || s;
}

export function WorkOrderDetailSheet({
  visible,
  workOrder,
  onClose,
  onEdit,
}: Props) {
  const w = workOrder;
  return (
    <AppModal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/45">
        <View className="max-h-[88%] rounded-t-3xl bg-white">
          <View className="items-center pt-3">
            <View className="h-1 w-9 rounded-full bg-slate-200" />
          </View>
          {w ? (
            <ScrollView
              className="px-5 pt-4"
              contentContainerStyle={{ paddingBottom: 28 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {w.work_order_number}
              </Text>
              <Text className="mt-1 text-xl font-extrabold text-slate-900">
                {w.title}
              </Text>
              {w.description ? (
                <Text className="mt-3 leading-5 text-slate-600">{w.description}</Text>
              ) : null}

              <View className="mt-4 rounded-2xl bg-slate-50 p-3.5">
                {[
                  { label: 'Type', value: w.work_order_type ?? '—' },
                  { label: 'Status', value: (w.status ?? '—').replace(/_/g, ' ') },
                  { label: 'Priority', value: w.priority ?? '—' },
                  { label: 'Planned start', value: fmtDate(w.planned_start_date) },
                  { label: 'Planned end', value: fmtDate(w.planned_end_date) },
                  {
                    label: 'Est. hours',
                    value:
                      w.estimated_hours != null && w.estimated_hours > 0
                        ? String(w.estimated_hours)
                        : '—',
                  },
                  ...(w.location
                    ? [{ label: 'Location', value: w.location }]
                    : []),
                  ...(w.estimated_cost != null && w.estimated_cost > 0
                    ? [{ label: 'Est. cost', value: String(w.estimated_cost) }]
                    : []),
                ].map(({ label, value }) => (
                  <View
                    key={label}
                    className="flex-row justify-between border-b border-slate-200/80 py-2.5 last:border-b-0"
                  >
                    <Text className="text-sm text-slate-500">{label}</Text>
                    <Text className="max-w-[58%] text-right text-sm font-semibold capitalize text-slate-900">
                      {String(value).replace(/_/g, ' ')}
                    </Text>
                  </View>
                ))}
                {w.instructions ? (
                  <View className="mt-2 border-t border-slate-200/80 pt-3">
                    <Text className="text-xs font-semibold uppercase text-slate-500">
                      Instructions
                    </Text>
                    <Text className="mt-1 text-sm leading-5 text-slate-700">
                      {w.instructions}
                    </Text>
                  </View>
                ) : null}
                {w.safety_notes ? (
                  <View className="mt-3 border-t border-slate-200/80 pt-3">
                    <Text className="text-xs font-semibold uppercase text-slate-500">
                      Safety
                    </Text>
                    <Text className="mt-1 text-sm leading-5 text-slate-700">
                      {w.safety_notes}
                    </Text>
                  </View>
                ) : null}
                {w.quality_requirements ? (
                  <View className="mt-3 border-t border-slate-200/80 pt-3">
                    <Text className="text-xs font-semibold uppercase text-slate-500">
                      Quality
                    </Text>
                    <Text className="mt-1 text-sm leading-5 text-slate-700">
                      {w.quality_requirements}
                    </Text>
                  </View>
                ) : null}
                {(w.materials_required?.length ?? 0) > 0 ? (
                  <View className="mt-3 border-t border-slate-200/80 pt-3">
                    <Text className="text-xs font-semibold uppercase text-slate-500">
                      Materials
                    </Text>
                    <Text className="mt-1 text-sm text-slate-700">
                      {(w.materials_required ?? []).join(', ')}
                    </Text>
                  </View>
                ) : null}
                {(w.tags?.length ?? 0) > 0 ? (
                  <View className="mt-3 border-t border-slate-200/80 pt-3">
                    <Text className="text-xs font-semibold uppercase text-slate-500">
                      Tags
                    </Text>
                    <Text className="mt-1 text-sm text-slate-700">
                      {(w.tags ?? []).join(', ')}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Pressable
                onPress={() => onEdit(w)}
                className="mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5"
              >
                <Ionicons name="pencil" size={17} color="#fff" />
                <Text className="text-base font-bold text-white">Edit</Text>
              </Pressable>

              <Pressable
                onPress={onClose}
                className="mt-3 items-center rounded-xl bg-slate-100 py-3.5"
              >
                <Text className="text-base font-semibold text-slate-700">Close</Text>
              </Pressable>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </AppModal>
  );
}
