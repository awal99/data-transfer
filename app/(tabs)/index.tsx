import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BundleData {
  MTN: number[];
  Telecel: number[];
}

interface ApiResponse {
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
}

const BUNDLE_SIZES: BundleData = {
  MTN: [1024, 2048, 3072, 4096, 5120, 6144, 8192, 10240, 15360, 20480, 25600, 30720, 40960, 51200],
  Telecel: [5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000],
};

const ERROR_MESSAGES = {
  400: 'Missing required fields or invalid input',
  401: 'API key is missing',
  403: 'Invalid API key',
  409: 'Duplicate reference - transaction already exists',
  422: 'Invalid bundle size or unsupported network',
  402: 'Insufficient wallet balance',
  429: 'Rate limit exceeded - please wait before trying again',
  500: 'System error - please try again later',
};

export default function SendDataScreen() {
  const [network, setNetwork] = useState<'MTN' | 'Telecel'>('MTN');
  const [selectedSize, setSelectedSize] = useState<number>(1024);
  const [phone, setPhone] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  React.useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const key = await AsyncStorage.getItem('api_key');
      if (key) setApiKey(key);
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  };

  const handleNetworkChange = (selectedNetwork: 'MTN' | 'Telecel') => {
    setNetwork(selectedNetwork);
    setSelectedSize(BUNDLE_SIZES[selectedNetwork][0]);
  };

  const validateForm = () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please set your API key in Settings first');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return false;
    }
    if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }
    if (webhookUrl && !webhookUrl.startsWith('https://')) {
      Alert.alert('Error', 'Webhook URL must start with https://');
      return false;
    }
    return true;
  };

  const sendDataBundle = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const requestBody = {
        api_key: apiKey,
        phone: phone.replace(/\s/g, ''),
        size_mb: selectedSize,
        network: network.toLowerCase(),
        reference: `TXN_${Date.now()}`,
        ...(webhookUrl && { webhook_url: webhookUrl }),
      };

      const API_URL = `https://spfastit.com/wp-json/custom-api/v1/place-order`;

      // Note: Replace with your actual API endpoint
      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data: ApiResponse = await response.json();

      if (response.ok && data.status === 'success') {
        // Save transaction to history
        await saveTransaction(data);
        
        Alert.alert(
          'Success!',
          `Data bundle sent successfully!\nOrder ID: ${data.order_id}\nBalance: ${data.wallet_balance_after} credits`,
          [{ text: 'OK' }]
        );
        
        // Reset form
        setPhone('');
        setWebhookUrl('');
      } else {
        const errorMessage = ERROR_MESSAGES[response.status as keyof typeof ERROR_MESSAGES] || data.message || 'Unknown error occurred';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      // console.log('error', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveTransaction = async (data: ApiResponse) => {
    try {
      const transactions = await AsyncStorage.getItem('transactions');
      const transactionList = transactions ? JSON.parse(transactions) : [];
      const newTransaction = {
        ...data,
        timestamp: new Date().toISOString(),
      };
      transactionList.unshift(newTransaction);
      await AsyncStorage.setItem('transactions', JSON.stringify(transactionList.slice(0, 50))); // Keep last 50
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const formatBundleSize = (sizeInMB: number) => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB} MB`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Send Data Bundle</Text>
          <Text style={styles.subtitle}>Send mobile data to any phone number</Text>
        </View>

        <View style={styles.form}>
          {/* Network Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Network Provider</Text>
            <View style={styles.networkContainer}>
              <TouchableOpacity
                style={[styles.networkButton, network === 'MTN' && styles.networkButtonActive]}
                onPress={() => handleNetworkChange('MTN')}
              >
                <Text style={[styles.networkText, network === 'MTN' && styles.networkTextActive]}>
                  MTN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.networkButton, network === 'Telecel' && styles.networkButtonActive]}
                onPress={() => handleNetworkChange('Telecel')}
              >
                <Text style={[styles.networkText, network === 'Telecel' && styles.networkTextActive]}>
                  Telecel
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bundle Size Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Bundle Size</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bundleScroll}>
              {BUNDLE_SIZES[network].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.bundleButton, selectedSize === size && styles.bundleButtonActive]}
                  onPress={() => setSelectedSize(size)}
                >
                  <Text style={[styles.bundleText, selectedSize === size && styles.bundleTextActive]}>
                    {formatBundleSize(size)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Phone Number Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Recipient Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g., 0543482280"
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          {/* Webhook URL Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Webhook URL (Optional)</Text>
            <TextInput
              style={styles.input}
              value={webhookUrl}
              onChangeText={setWebhookUrl}
              placeholder="https://example.com/webhook"
              keyboardType="url"
              autoCapitalize="none"
            />
            <Text style={styles.hint}>Must start with https://</Text>
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={sendDataBundle}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.sendButtonText}>
                Send {formatBundleSize(selectedSize)} to {network}
              </Text>
            )}
          </TouchableOpacity>

          {/* Rate Limit Warning */}
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Rate limit: 10 requests per 5 seconds
            </Text>
            <Text style={styles.warningText}>
              📈 Daily quota: 100 requests per user
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  form: {
    padding: 24,
    paddingTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  networkContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  networkButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  networkButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#eff6ff',
  },
  networkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  networkTextActive: {
    color: '#3B82F6',
  },
  bundleScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  bundleButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  bundleButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#eff6ff',
  },
  bundleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  bundleTextActive: {
    color: '#3B82F6',
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
    marginBottom: 2,
  },
});