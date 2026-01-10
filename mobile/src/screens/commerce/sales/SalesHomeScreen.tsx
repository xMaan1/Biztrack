import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';

export default function SalesHomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const menuItems = [
    {
      title: 'Quotes',
      icon: 'document-text',
      route: 'QuoteList',
      color: colors.blue[600],
    },
    {
      title: 'Contracts',
      icon: 'document',
      route: 'ContractList',
      color: colors.purple[600],
    },
    {
      title: 'Invoices',
      icon: 'receipt',
      route: 'InvoiceList',
      color: colors.green[600],
    },
    {
      title: 'Analytics',
      icon: 'bar-chart',
      route: 'Analytics',
      color: colors.orange[600],
    },
  ];

  return (
    <Container safeArea>
      <Header title="Sales" gradient={false} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.menuCard}
              onPress={() => navigation.navigate(item.route as never)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon as any} size={32} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  menuCard: {
    width: '47%',
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
});
