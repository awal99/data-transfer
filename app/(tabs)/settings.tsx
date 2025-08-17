import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Key, Save, Trash2 } from 'lucide-react-native';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const key = await AsyncStorage.getItem('api_key');
      if (key) {
        setApiKey(key);
        setTempApiKey(key);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  };

  const saveApiKey = async () => {
    if (!tempApiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    try {
      console.log('tempApiKey', tempApiKey);
      await AsyncStorage.setItem('api_key', tempApiKey.trim());
      setApiKey(tempApiKey.trim());
      Alert.alert('Success', 'API key saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  const clearApiKey = () => {
    Alert.alert(
      'Clear API Key',
      'Are you sure you want to remove your API key? You won\'t be able to send data bundles without it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('api_key');
              setApiKey('');
              setTempApiKey('');
              Alert.alert('Success', 'API key cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear API key');
            }
          },
        },
      ]
    );
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove your API key and transaction history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['api_key', 'transactions']);
              setApiKey('');
              setTempApiKey('');
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Configure your API credentials and app preferences</Text>
        </View>

        <View style={styles.content}>
          {/* API Key Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Key size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>API Configuration</Text>
            </View>
            
            <Text style={styles.label}>API Key</Text>
            <TextInput
              style={styles.input}
              value={tempApiKey}
              onChangeText={setTempApiKey}
              placeholder="Enter your API key"
              secureTextEntry
              autoCapitalize="none"
            />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.saveButton} onPress={saveApiKey}>
                <Save size={16} color="#ffffff" />
                <Text style={styles.saveButtonText}>Save API Key</Text>
              </TouchableOpacity>
              
              {apiKey && (
                <TouchableOpacity style={styles.clearButton} onPress={clearApiKey}>
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            {apiKey && (
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>✅ API key configured</Text>
              </View>
            )}
          </View>

          {/* API Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>API Information</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Rate Limits</Text>
              <Text style={styles.infoText}>• 10 requests every 5 seconds</Text>
              <Text style={styles.infoText}>• 100 requests per day (default quota)</Text>
              <Text style={styles.infoText}>• API keys regenerate every 5 minutes</Text>
            </View>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Supported Networks</Text>
              <Text style={styles.infoText}>• MTN: 1GB - 50GB bundles</Text>
              <Text style={styles.infoText}>• Telecel: 5GB - 50GB bundles</Text>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <TouchableOpacity style={styles.dangerButton} onPress={clearAllData}>
              <Trash2 size={16} color="#ef4444" />
              <Text style={styles.dangerButtonText}>Clear All Data</Text>
            </TouchableOpacity>
            <Text style={styles.dangerHint}>
              This will remove your API key and transaction history permanently.
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
  content: {
    padding: 24,
    paddingTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    fontSize: 16,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  statusContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  statusText: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 16,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dangerButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});