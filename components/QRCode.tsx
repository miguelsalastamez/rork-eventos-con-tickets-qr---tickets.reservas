import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface QRCodeProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
}

export default function QRCode({
  value,
  size = 200,
  backgroundColor = '#ffffff',
  color = '#000000',
}: QRCodeProps) {
  const bgColor = backgroundColor.replace('#', '');
  const fgColor = color.replace('#', '');
  
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=${bgColor}&color=${fgColor}&format=png&margin=0`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={{ uri: qrUrl }}
        style={{ width: size, height: size }}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
