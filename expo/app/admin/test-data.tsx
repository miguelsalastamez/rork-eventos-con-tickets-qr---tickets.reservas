import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function TestDataScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Gestión de Datos de Prueba',
          headerStyle: { backgroundColor: '#1f2937' },
          headerTintColor: '#fff',
        }}
      />
      <View style={styles.content}>
        <Text style={styles.message}>
          Esta función requiere backend y ha sido desactivada temporalmente.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
