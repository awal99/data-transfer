import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, RefreshCw } from 'lucide-react-native';

interface Transaction {
  status: string;
  message: string;
  order_id?: number;
  wallet_balance_before?: number;
  wallet_balance_after?: number;
  order_status?: string;
  phone?: string;
  size_mb?: number;
  size_gb?: string;
  network?: string;
  timestamp?: string;
}

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const savedTransactions = await AsyncStorage.getItem('transactions');
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('transactions');
      setTransactions([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'initiated':
        return <Clock size={20} color="#f59e0b" />;
      case 'completed':
        return <CheckCircle size={20} color="#10b981" />;
      case 'failed':
        return <AlertCircle size={20} color="#ef4444" />;
      default:
        return <RefreshCw size={20} color="#6b7280" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'initiated':
        return '#f59e0b';
      case 'completed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        {transactions.length > 0 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <Text style={styles.emptyStateSubtext}>Your sent data bundles will appear here</Text>
          </View>
        ) : (
          transactions.map((transaction, index) => (
            <View key={index} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={styles.statusContainer}>
                  {getStatusIcon(transaction.order_status)}
                  <Text style={[styles.status, { color: getStatusColor(transaction.order_status) }]}>
                    {transaction.order_status || 'pending'}
                  </Text>
                </View>
                <Text style={styles.orderId}>#{transaction.order_id}</Text>
              </View>

              <View style={styles.transactionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>To:</Text>
                  <Text style={styles.detailValue}>{transaction.phone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bundle:</Text>
                  <Text style={styles.detailValue}>
                    {transaction.size_gb} ({transaction.network?.toUpperCase()})
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(transaction.timestamp)}</Text>
                </View>
                {transaction.wallet_balance_after !== undefined && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Balance After:</Text>
                    <Text style={styles.detailValue}>{transaction.wallet_balance_after} credits</Text>
                  </View>
                )}
              </View>

              {transaction.message && (
                <Text style={styles.message}>{transaction.message}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderId: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  transactionDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  message: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
});