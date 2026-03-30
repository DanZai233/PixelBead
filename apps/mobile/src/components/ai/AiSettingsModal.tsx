import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal as RNModal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAiStore } from '../../stores/aiStore';
import { validateApiKey } from '../../services/aiService';
import { AIProvider, AI_MODELS, DEFAULT_ENDPOINTS } from '../../types/shared';

interface AiSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AiSettingsModal({ visible, onClose }: AiSettingsModalProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { provider, apiKey, endpoint, model, setProvider, setApiKey, setEndpoint, setModel, getModelsForProvider } = useAiStore();

  const availableProviders = [
    { provider: AIProvider.OPENAI, name: 'OpenAI', icon: 'bolt' },
    { provider: AIProvider.DEEPSEEK, name: 'DeepSeek', icon: 'school' },
    { provider: AIProvider.GEMINI, name: 'Gemini', icon: 'psychology' },
  ];

  const imageModels = getModelsForProvider();

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setValidationError(null);
  };

  const handleValidateKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const isValid = await validateApiKey(provider, apiKey, endpoint);
      if (isValid) {
        Alert.alert('Valid', 'API key is valid');
      } else {
        setValidationError('API key is invalid or failed to validate');
      }
    } catch (err: any) {
      setValidationError(err.message || 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }
    onClose();
  };

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Settings</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Provider</Text>
              <View style={styles.providersContainer}>
                {availableProviders.map((p) => (
                  <TouchableOpacity
                    key={p.provider}
                    style={[
                      styles.providerButton,
                      provider === p.provider && styles.providerButtonActive,
                    ]}
                    onPress={() => handleProviderChange(p.provider)}
                    accessibilityLabel={`Select ${p.name}`}
                    accessibilityRole="button"
                    accessibilityHint={
                      provider === p.provider
                        ? `${p.name} provider selected`
                        : `Tap to select ${p.name} provider`
                    }
                  >
                    <MaterialIcons
                      name={p.icon as any}
                      size={24}
                      color={provider === p.provider ? '#FFF' : '#666'}
                    />
                    <Text
                      style={[
                        styles.providerButtonText,
                        provider === p.provider && styles.providerButtonTextActive,
                      ]}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {provider === AIProvider.DEEPSEEK && (
                <Text style={styles.warningText}>
                  ⚠️ DeepSeek 目前不支持图像生成，请使用其他服务商
                </Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>API Key</Text>
              <View style={styles.apiKeyContainer}>
                <TextInput
                  style={styles.apiKeyInput}
                  placeholder="Enter API key"
                  placeholderTextColor="#999"
                  value={apiKey}
                  onChangeText={setApiKey}
                  secureTextEntry
                  accessibilityLabel="API key"
                  accessibilityHint="Enter your AI service API key"
                />
                <TouchableOpacity
                  style={styles.validateButton}
                  onPress={handleValidateKey}
                  disabled={isValidating || !apiKey.trim()}
                  accessibilityLabel="Validate API key"
                  accessibilityRole="button"
                  accessibilityHint="Test if API key is valid"
                >
                  {isValidating ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <Text style={styles.validateButtonText}>Test</Text>
                  )}
                </TouchableOpacity>
              </View>
              {validationError && (
                <Text style={styles.errorText}>{validationError}</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Endpoint (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Custom endpoint URL"
                placeholderTextColor="#999"
                value={endpoint}
                onChangeText={setEndpoint}
                accessibilityLabel="Custom endpoint"
                accessibilityHint="Enter custom API endpoint URL"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Model</Text>
              <View style={styles.modelsContainer}>
                {imageModels.map((m: any) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.modelButton,
                      model === m.id && styles.modelButtonActive,
                    ]}
                    onPress={() => setModel(m.id)}
                    accessibilityLabel={`Select ${m.name} model`}
                    accessibilityRole="button"
                    accessibilityHint={
                      model === m.id
                        ? `${m.name} model selected`
                        : `Tap to select ${m.name} model`
                    }
                  >
                    <MaterialIcons
                      name={model === m.id ? 'check-circle' : 'radio-button-unchecked'}
                      size={20}
                      color={model === m.id ? '#3B82F6' : '#9CA3AF'}
                    />
                    <Text
                      style={[
                        styles.modelButtonText,
                        model === m.id && styles.modelButtonTextActive,
                      ]}
                    >
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                !apiKey.trim() && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!apiKey.trim()}
              accessibilityLabel="Save settings"
              accessibilityRole="button"
              accessibilityHint="Tap to save AI configuration"
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  providersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
    gap: 8,
  },
  providerButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  providerButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  providerButtonTextActive: {
    color: '#FFF',
  },
  warningText: {
    fontSize: 14,
    color: '#F59E0B',
    marginTop: 8,
  },
  apiKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apiKeyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  validateButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  validateButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  modelsContainer: {
    gap: 8,
  },
  modelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
    gap: 10,
  },
  modelButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  modelButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  modelButtonTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});
