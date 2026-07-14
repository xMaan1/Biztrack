import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { AppModal } from '../../../components/layout/AppModal';
import { KeyboardBottomSheetShell } from '../../../components/layout/KeyboardBottomSheetShell';
import { WorkshopDetailRow, WorkshopBadge, WS } from './WorkshopUI';

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
    <AppModal
      visible={visible}
      animationType="slide"
      transparent
      onClose={onClose}
    >
      <KeyboardBottomSheetShell overlayColor="rgba(15,23,42,0.55)">
        <View
          style={{
            maxHeight: '88%',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: WS.card,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#e2e8f0',
              }}
            />
          </View>
          {w ? (
            <ScrollView
              style={{ paddingHorizontal: 20, paddingTop: 16 }}
              contentContainerStyle={{ paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: WS.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="hammer" size={24} color={WS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: WS.primary,
                      letterSpacing: 0.5,
                    }}
                  >
                    {w.work_order_number}
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: WS.text, marginTop: 2 }}>
                    {w.title}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                {w.status ? (
                  <WorkshopBadge label={w.status} tone="status" />
                ) : null}
                {w.priority ? (
                  <WorkshopBadge label={w.priority} tone="priority" />
                ) : null}
                {w.work_order_type ? (
                  <WorkshopBadge label={w.work_order_type} />
                ) : null}
              </View>

              {w.description ? (
                <Text
                  style={{
                    marginTop: 16,
                    fontSize: 15,
                    lineHeight: 22,
                    color: WS.textMuted,
                  }}
                >
                  {w.description}
                </Text>
              ) : null}

              <View
                style={{
                  marginTop: 20,
                  borderRadius: 16,
                  backgroundColor: WS.bg,
                  paddingHorizontal: 16,
                  paddingVertical: 4,
                  borderWidth: 1,
                  borderColor: WS.border,
                }}
              >
                <WorkshopDetailRow label="Planned start" value={fmtDate(w.planned_start_date)} />
                <WorkshopDetailRow label="Planned end" value={fmtDate(w.planned_end_date)} />
                <WorkshopDetailRow
                  label="Est. hours"
                  value={
                    w.estimated_hours != null && w.estimated_hours > 0
                      ? String(w.estimated_hours)
                      : '—'
                  }
                />
                {w.location ? (
                  <WorkshopDetailRow label="Location" value={w.location} />
                ) : null}
                {w.estimated_cost != null && w.estimated_cost > 0 ? (
                  <WorkshopDetailRow label="Est. cost" value={String(w.estimated_cost)} />
                ) : null}
              </View>

              {w.instructions ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: WS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Instructions
                  </Text>
                  <Text style={{ marginTop: 6, fontSize: 14, lineHeight: 21, color: WS.text }}>
                    {w.instructions}
                  </Text>
                </View>
              ) : null}
              {w.safety_notes ? (
                <View style={{ marginTop: 14 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: WS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Safety
                  </Text>
                  <Text style={{ marginTop: 6, fontSize: 14, lineHeight: 21, color: WS.text }}>
                    {w.safety_notes}
                  </Text>
                </View>
              ) : null}
              {w.quality_requirements ? (
                <View style={{ marginTop: 14 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: WS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Quality
                  </Text>
                  <Text style={{ marginTop: 6, fontSize: 14, lineHeight: 21, color: WS.text }}>
                    {w.quality_requirements}
                  </Text>
                </View>
              ) : null}
              {(w.materials_required?.length ?? 0) > 0 ? (
                <View style={{ marginTop: 14 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: WS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Materials
                  </Text>
                  <Text style={{ marginTop: 6, fontSize: 14, color: WS.text }}>
                    {(w.materials_required ?? []).join(', ')}
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={() => onEdit(w)}
                style={{
                  marginTop: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 14,
                  backgroundColor: WS.primary,
                  paddingVertical: 15,
                }}
              >
                <Ionicons name="pencil" size={18} color="#fff" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Edit work order</Text>
              </Pressable>

              <Pressable
                onPress={onClose}
                style={{
                  marginTop: 10,
                  alignItems: 'center',
                  borderRadius: 14,
                  backgroundColor: '#f1f5f9',
                  paddingVertical: 15,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: WS.textMuted }}>Close</Text>
              </Pressable>
            </ScrollView>
          ) : null}
        </View>
      </KeyboardBottomSheetShell>
    </AppModal>
  );
}
