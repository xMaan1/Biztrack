import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import CRMService from '@/services/CRMService';
import { Contact, ContactType } from '@/models/crm';

export default function ContactDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params as { id: string };
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContact();
  }, [id]);

  const loadContact = async () => {
    try {
      setLoading(true);
      const data = await CRMService.getContact(id);
      setContact(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load contact');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!contact) return;
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.firstName} ${contact.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await CRMService.deleteContact(id);
              Alert.alert('Success', 'Contact deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete contact');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    navigation.navigate('ContactForm' as never, { id, contact } as never);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const getTypeBadgeStyle = (type: ContactType) => {
    const typeColors: Record<ContactType, { bg: string; border: string }> = {
      [ContactType.LEAD]: { bg: colors.blue[100], border: colors.blue[500] },
      [ContactType.CUSTOMER]: { bg: colors.green[100], border: colors.green[500] },
      [ContactType.PARTNER]: { bg: colors.purple[100], border: colors.purple[500] },
      [ContactType.VENDOR]: { bg: colors.orange[100], border: colors.orange[500] },
      [ContactType.OTHER]: { bg: colors.gray[100], border: colors.gray[500] },
    };
    const color = typeColors[type] || { bg: colors.gray[100], border: colors.gray[500] };
    return { backgroundColor: color.bg, borderColor: color.border };
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Contact Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!contact) {
    return (
      <Container safeArea>
        <Header title="Contact Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Contact not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Contact Details"
        gradient={false}
        rightIcon="create-outline"
        onRightPress={handleEdit}
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
            <Text style={styles.contactName}>
              {contact.firstName} {contact.lastName}
            </Text>
            <View style={[styles.typeBadge, getTypeBadgeStyle(contact.type)]}>
              <Text style={styles.typeText}>{contact.type}</Text>
            </View>
          </View>
          <Text style={styles.contactEmail}>{contact.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => handleEmail(contact.email)}
            >
              <Ionicons name="mail-outline" size={20} color={colors.primary.main} />
              <Text style={styles.infoText}>{contact.email}</Text>
            </TouchableOpacity>
            {contact.phone && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => handleCall(contact.phone!)}
              >
                <Ionicons name="call-outline" size={20} color={colors.primary.main} />
                <Text style={styles.infoText}>{contact.phone}</Text>
              </TouchableOpacity>
            )}
            {contact.mobile && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => handleCall(contact.mobile!)}
              >
                <Ionicons name="phone-portrait-outline" size={20} color={colors.primary.main} />
                <Text style={styles.infoText}>{contact.mobile}</Text>
              </TouchableOpacity>
            )}
            {contact.jobTitle && (
              <View style={styles.infoRow}>
                <Ionicons name="briefcase-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoText}>{contact.jobTitle}</Text>
              </View>
            )}
            {contact.department && (
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoText}>{contact.department}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <View style={[styles.typeBadge, getTypeBadgeStyle(contact.type)]}>
                <Text style={styles.typeText}>{contact.type}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              {contact.isActive ? (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeText}>Active</Text>
                </View>
              ) : (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveText}>Inactive</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {contact.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.infoCard}>
              <Text style={styles.notesText}>{contact.notes}</Text>
            </View>
          </View>
        )}

        {contact.tags && contact.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {contact.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dates</Text>
          <View style={styles.infoCard}>
            {contact.lastContactDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Contact:</Text>
                <Text style={styles.infoText}>
                  {new Date(contact.lastContactDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            {contact.nextFollowUpDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Next Follow-up:</Text>
                <Text style={styles.infoText}>
                  {new Date(contact.nextFollowUpDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoText}>
                {new Date(contact.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={colors.background.default} />
            <Text style={styles.editButtonText}>Edit Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.red[600]} />
            <Text style={styles.deleteButtonText}>Delete</Text>
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
  contactName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  contactEmail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
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
    fontWeight: '600',
    color: colors.text.secondary,
    minWidth: 100,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  activeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.green[100],
    borderWidth: 1,
    borderColor: colors.green[500],
  },
  activeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.green[700],
  },
  inactiveBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[500],
  },
  inactiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[700],
  },
  notesText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  tagText: {
    fontSize: 12,
    color: colors.primary[700],
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.xs,
  },
  editButtonText: {
    color: colors.background.default,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red[50],
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.red[300],
    gap: spacing.xs,
  },
  deleteButtonText: {
    color: colors.red[600],
    fontSize: 16,
    fontWeight: '600',
  },
});
