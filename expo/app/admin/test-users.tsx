import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TestUsersScreen() {
  return (
    <View style={styles.container}>
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
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
