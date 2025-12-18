import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';

interface ColorPickerProps {
  visible: boolean;
  color: string;
  onColorChange: (color: string) => void;
  onClose: () => void;
  title?: string;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#000000',
  '#1f2937', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb',
  '#f3f4f6', '#f9fafb', '#ffffff', '#7c2d12', '#064e3b', '#1e3a8a',
  '#581c87', '#831843', '#be123c', '#a16207', '#365314', '#14532d',
];

export default function ColorPicker({
  visible,
  color,
  onColorChange,
  onClose,
  title = 'Seleccionar Color',
}: ColorPickerProps) {
  const [inputColor, setInputColor] = useState(color);

  const handleColorSelect = (selectedColor: string) => {
    setInputColor(selectedColor);
    onColorChange(selectedColor);
  };

  const handleInputChange = (text: string) => {
    setInputColor(text);
    if (/^#[0-9A-Fa-f]{6}$/.test(text)) {
      onColorChange(text);
    }
  };

  const screenHeight = Dimensions.get('window').height;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalContent, { maxHeight: screenHeight * 0.7 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.currentColorSection}>
              <Text style={styles.sectionLabel}>Color Actual</Text>
              <View style={styles.currentColorPreview}>
                <View style={[styles.largeColorCircle, { backgroundColor: color }]} />
                <View style={styles.currentColorInfo}>
                  <Text style={styles.currentColorHex}>{color.toUpperCase()}</Text>
                  <TextInput
                    style={styles.colorTextInput}
                    value={inputColor}
                    onChangeText={handleInputChange}
                    placeholder="#000000"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    maxLength={7}
                  />
                </View>
              </View>
            </View>

            <View style={styles.presetsSection}>
              <Text style={styles.sectionLabel}>Colores Predefinidos</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((presetColor, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: presetColor },
                      color.toLowerCase() === presetColor.toLowerCase() && styles.selectedColorCircle,
                    ]}
                    onPress={() => handleColorSelect(presetColor)}
                  >
                    {color.toLowerCase() === presetColor.toLowerCase() && (
                      <View style={styles.selectedIndicator} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: color }]}
              onPress={onClose}
            >
              <Text style={styles.applyButtonText}>Aplicar Color</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  currentColorSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 12,
  },
  currentColorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
  },
  largeColorCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  currentColorInfo: {
    flex: 1,
    gap: 8,
  },
  currentColorHex: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    letterSpacing: 1,
  },
  colorTextInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    fontFamily: 'monospace',
  },
  presetsSection: {
    marginBottom: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorCircle: {
    borderColor: '#111827',
    borderWidth: 3,
  },
  selectedIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: '#111827',
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
