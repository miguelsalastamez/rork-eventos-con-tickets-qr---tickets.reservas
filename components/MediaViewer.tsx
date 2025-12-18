import React, { useState, useCallback, useMemo } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface MediaViewerProps {
  uri: string;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch';
}

function extractYoutubeId(url: string): string | null {
  console.log('🔍 Extracting YouTube ID from:', url);
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    /(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:www\.)?youtu\.be\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      console.log('✅ YouTube ID found:', match[1]);
      return match[1];
    }
  }
  console.log('❌ No YouTube ID found');
  return null;
}

function extractVimeoId(url: string): string | null {
  console.log('🔍 Extracting Vimeo ID from:', url);
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /(?:www\.)?vimeo\.com\/(\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      console.log('✅ Vimeo ID found:', match[1]);
      return match[1];
    }
  }
  console.log('❌ No Vimeo ID found');
  return null;
}

export default function MediaViewer({ uri, style, resizeMode = 'cover' }: MediaViewerProps) {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const mediaType = useMemo(() => {
    console.log('🎬 MediaViewer: Processing URI:', uri);
    if (!uri) {
      console.log('⚠️ MediaViewer: No URI provided');
      return 'image';
    }
    
    const youtubeId = extractYoutubeId(uri);
    if (youtubeId) {
      console.log('📺 MediaViewer: Detected YouTube video');
      return { type: 'youtube' as const, id: youtubeId };
    }
    
    const vimeoId = extractVimeoId(uri);
    if (vimeoId) {
      console.log('📺 MediaViewer: Detected Vimeo video');
      return { type: 'vimeo' as const, id: vimeoId };
    }
    
    console.log('🖼️ MediaViewer: Treating as image');
    return 'image';
  }, [uri]);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setLoading(false);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  if (!uri) {
    return (
      <View style={[styles.placeholder, style]}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800' }}
          style={styles.placeholderImage}
          resizeMode={resizeMode}
        />
      </View>
    );
  }

  if (typeof mediaType === 'object') {
    if (mediaType.type === 'youtube') {
      const embedUrl = `https://www.youtube.com/embed/${mediaType.id}?autoplay=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=https://rork.app&widget_referrer=https://rork.app`;
      
      return (
        <View style={[styles.videoContainer, style]}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          )}
          <WebView
            source={{ 
              uri: embedUrl,
              headers: {
                'Referer': 'https://rork.app'
              }
            }}
            style={styles.webview}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            onLoadEnd={handleLoadEnd}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mixedContentMode="always"
            originWhitelist={['*']}
            startInLoadingState
            scalesPageToFit
          />
        </View>
      );
    }

    if (mediaType.type === 'vimeo') {
      const embedUrl = `https://player.vimeo.com/video/${mediaType.id}?title=0&byline=0&portrait=0`;
      
      return (
        <View style={[styles.videoContainer, style]}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          )}
          <WebView
            source={{ uri: embedUrl }}
            style={styles.webview}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            onLoadEnd={handleLoadEnd}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mixedContentMode="always"
          />
        </View>
      );
    }
  }

  if (imageError) {
    return (
      <View style={[styles.placeholder, style]}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800' }}
          style={styles.placeholderImage}
          resizeMode={resizeMode}
        />
      </View>
    );
  }

  return (
    <View style={style}>
      {loading && (
        <View style={[styles.loadingContainer, StyleSheet.absoluteFill]}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      )}
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode={resizeMode}
        onError={handleImageError}
        onLoadEnd={handleLoadEnd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  webview: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 10,
  },
});
