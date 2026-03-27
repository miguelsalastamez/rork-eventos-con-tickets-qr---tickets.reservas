import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePickerLib from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Upload, X } from 'lucide-react-native';

const isWeb = Platform.OS === 'web';

interface ImagePickerProps {
  label: string;
  helperText?: string;
  value?: string;
  onChange: (base64: string) => void;
  aspectRatio?: [number, number];
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export default function ImagePicker({
  label,
  helperText,
  value,
  onChange,
  aspectRatio,
  quality = 0.8,
  maxWidth = 1920,
  maxHeight = 1920,
}: ImagePickerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const optimizeImage = async (uri: string): Promise<string> => {
    try {
      console.log('🔧 Optimizing image...');
      
      const actions: ImageManipulator.Action[] = [
        { resize: { width: maxWidth, height: maxHeight } },
      ];

      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!manipResult.base64) {
        throw new Error('Failed to get base64 from optimized image');
      }

      const base64 = `data:image/jpeg;base64,${manipResult.base64}`;
      console.log('✅ Image optimized successfully');
      console.log('📊 Original size: ~', uri.length, 'bytes');
      console.log('📊 Optimized size: ~', base64.length, 'bytes');
      
      return base64;
    } catch (error) {
      console.error('❌ Error optimizing image:', error);
      throw error;
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePickerLib.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        if (isWeb) {
          window.alert('Se necesitan permisos para acceder a la galería de imágenes');
        } else {
          Alert.alert('Permisos Requeridos', 'Se necesitan permisos para acceder a la galería de imágenes');
        }
        return;
      }

      setIsLoading(true);

      const result = await ImagePickerLib.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 1,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        const optimizedBase64 = await optimizeImage(selectedImage.uri);
        onChange(optimizedBase64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      if (isWeb) {
        window.alert('Error al seleccionar la imagen');
      } else {
        Alert.alert('Error', 'Error al seleccionar la imagen');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePickerLib.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        if (isWeb) {
          window.alert('Se necesitan permisos para acceder a la cámara');
        } else {
          Alert.alert('Permisos Requeridos', 'Se necesitan permisos para acceder a la cámara');
        }
        return;
      }

      setIsLoading(true);

      const result = await ImagePickerLib.launchCameraAsync({
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 1,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        const optimizedBase64 = await optimizeImage(selectedImage.uri);
        onChange(optimizedBase64);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      if (isWeb) {
        window.alert('Error al tomar la foto');
      } else {
        Alert.alert('Error', 'Error al tomar la foto');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const showImagePickerOptions = () => {
    if (isWeb) {
      pickImage();
    } else {
      Alert.alert(
        'Seleccionar Imagen',
        'Elige una opción',
        [
          { text: 'Galería', onPress: pickImage },
          { text: 'Cámara', onPress: takePhoto },
          { text: 'Cancelar', style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  };

  const removeImage = () => {
    onChange('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {value ? (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: value }}
            style={styles.preview}
            contentFit="cover"
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={removeImage}
          >
            <X color="#fff" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.changeButton}
            onPress={showImagePickerOptions}
            disabled={isLoading}
          >
            <Text style={styles.changeButtonText}>
              {isLoading ? 'Procesando...' : 'Cambiar Imagen'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={showImagePickerOptions}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : (
            <>
              <Upload color="#6366f1" size={24} />
              <Text style={styles.uploadButtonText}>Subir Imagen</Text>
              <Text style={styles.uploadButtonSubtext}>
                Formatos: JPG, PNG, WEBP
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
      
      {helperText && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  uploadButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed' as const,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginTop: 8,
  },
  uploadButtonSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  changeButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});
