import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import QualityControlService from '@/services/QualityControlService';
import {
  QualityInspectionResponse as QualityInspection,
  getQualityStatusColor,
  getQualityStatusLabel,
} from '@/models/qualityControl';

export default function QualityInspectionDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params as { id: string };
  const [inspection, setInspection] = useState<QualityInspection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInspection();
  }, [id]);

  const loadInspection = async () => {
    try {
      setLoading(true);
      const data = await QualityControlService.getQualityInspection(id);
      setInspection(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load quality inspection');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Quality Inspection',
      'Are you sure you want to delete this quality inspection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await QualityControlService.deleteQualityInspection(id);
              Alert.alert('Success', 'Quality inspection deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete quality inspection');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Quality Inspection Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!inspection) {
    return (
      <Container safeArea>
        <Header title="Quality Inspection Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Quality inspection not found</Text>
        </View>
      </Container>
    );
  }

  const statusStyle = getQualityStatusColor(inspection.status);

  return (
    <Container safeArea>
      <Header
        title="Quality Inspection Details"
        gradient={false}
        rightIcon="create-outline"
        onRightPress={() =>
          (navigation.navigate as any)('QualityInspectionForm', { id, inspection })
        }
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.nameRow}>
            <Text style={styles.inspectionId}>{inspection.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
              <Text style={[styles.statusText, { color: statusStyle.border }]}>
                {getQualityStatusLabel(inspection.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.qualityCheckTitle}>{inspection.quality_check_title}</Text>
          {inspection.notes && (
            <Text style={styles.description}>{inspection.notes}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Inspector:</Text>
              <Text style={styles.infoText}>{inspection.inspector_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Inspection Date:</Text>
              <Text style={styles.infoText}>
                {QualityControlService.formatDate(inspection.inspection_date)}
              </Text>
            </View>
            {inspection.compliance_score !== undefined && (
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Compliance Score:</Text>
                <Text style={styles.infoText}>{inspection.compliance_score}%</Text>
              </View>
            )}
          </View>
        </View>

        {inspection.defects_found && inspection.defects_found.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Defects Found</Text>
            <View style={styles.infoCard}>
              {inspection.defects_found.map((defect: any, index: number) => (
                <View key={index} style={styles.defectItem}>
                  <Ionicons name="bug-outline" size={16} color={colors.red[600]} />
                  <Text style={styles.defectText}>{JSON.stringify(defect)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {inspection.corrective_actions && inspection.corrective_actions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Corrective Actions</Text>
            <View style={styles.infoCard}>
              {inspection.corrective_actions.map((action: string, index: number) => (
                <View key={index} style={styles.actionItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.actionText}>{action}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {inspection.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.infoCard}>
              <Text style={styles.notesText}>{inspection.notes}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metadata</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoText}>
                {QualityControlService.formatDate(inspection.created_at)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoText}>
                {QualityControlService.formatDate(inspection.updated_at)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Quality Inspection</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  headerCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  inspectionId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  qualityCheckTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginRight: spacing.xs,
    minWidth: 120,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  defectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  defectText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  actionText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  notesText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  actionsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red[600],
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.default,
  },
});
