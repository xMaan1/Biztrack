import React from 'react';
import { View, StyleSheet } from 'react-native';
import { QuickActionButton } from './QuickActionButton';

const CARD_GAP = 12;
const SECTION_GAP = 32;

interface QuickActionsSectionProps {
  planType: 'commerce' | 'healthcare' | 'workshop';
  onNavigate: (route: string) => void;
}

export function QuickActionsSection({ planType, onNavigate }: QuickActionsSectionProps) {
  return (
    <View style={styles.quickActionsSection}>
      {planType === 'commerce' && (
        <>
          <QuickActionButton
            icon="cart"
            label="New Sale"
            onPress={() => onNavigate('POS')}
            gradient="success"
          />
          <QuickActionButton
            icon="people"
            label="Customers"
            onPress={() => onNavigate('CRM')}
            gradient="primary"
          />
          <QuickActionButton
            icon="cube"
            label="Inventory"
            onPress={() => onNavigate('Inventory')}
            gradient="warning"
          />
        </>
      )}
      {planType === 'healthcare' && (
        <>
          <QuickActionButton
            icon="medical"
            label="Patients"
            onPress={() => onNavigate('Patients')}
            gradient="success"
          />
          <QuickActionButton
            icon="calendar"
            label="Appointments"
            onPress={() => onNavigate('Appointments')}
            gradient="primary"
          />
          <QuickActionButton
            icon="document-text"
            label="Records"
            onPress={() => onNavigate('MedicalRecords')}
            gradient="warning"
          />
        </>
      )}
      {planType === 'workshop' && (
        <>
          <QuickActionButton
            icon="construct"
            label="Work Orders"
            onPress={() => onNavigate('WorkOrders')}
            gradient="success"
          />
          <QuickActionButton
            icon="settings"
            label="Production"
            onPress={() => onNavigate('Production')}
            gradient="primary"
          />
          <QuickActionButton
            icon="checkmark-circle"
            label="Quality"
            onPress={() => onNavigate('QualityControl')}
            gradient="warning"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  quickActionsSection: {
    flexDirection: 'row',
    marginBottom: SECTION_GAP,
    marginHorizontal: -CARD_GAP / 2,
  },
});
