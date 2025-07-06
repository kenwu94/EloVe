import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import PhotoUpload from '../components/PhotoUpload';
import ExpoGoNotice from '../components/ExpoGoNotice';

const PhotoManagerScreen = ({ navigation }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    loadUserPhotos();
  }, []);

  const loadUserPhotos = async () => {
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      if (!userId) {
        navigation.replace('CreateProfile');
        return;
      }

      setCurrentUserId(userId);
      
      const response = await ApiService.getUserPhotos(userId);
      
      if (response.success) {
        // Convert API photos to PhotoUpload format
        const formattedPhotos = response.photos.map(photo => ({
          id: photo.id,
          uri: photo.url,
          isMain: photo.is_main,
        }));
        setPhotos(formattedPhotos);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotosChange = async (updatedPhotos) => {
    if (!currentUserId) return;

    setUploading(true);
    try {
      // Find new photos (ones marked as new)
      const newPhotos = updatedPhotos.filter(photo => photo.isNew);
      
      if (newPhotos.length > 0) {
        const uploadResult = await ApiService.uploadMultiplePhotos(currentUserId, newPhotos);
        
        if (uploadResult.failed.length > 0) {
          Alert.alert(
            'Upload Warning',
            `${uploadResult.failed.length} photo(s) failed to upload. Please try again.`
          );
        }
        
        // Reload photos to get updated list from server
        await loadUserPhotos();
      } else {
        setPhotos(updatedPhotos);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      Alert.alert('Error', 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleSetMainPhoto = async (photoId) => {
    try {
      const response = await ApiService.setMainPhoto(currentUserId, photoId);
      
      if (response.success) {
        // Update local state
        const updatedPhotos = photos.map(photo => ({
          ...photo,
          isMain: photo.id === photoId,
        }));
        setPhotos(updatedPhotos);
        Alert.alert('Success', 'Main photo updated!');
      } else {
        Alert.alert('Error', 'Failed to set main photo');
      }
    } catch (error) {
      console.error('Error setting main photo:', error);
      Alert.alert('Error', 'Failed to set main photo');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.deletePhoto(currentUserId, photoId);
              
              if (response.success) {
                const updatedPhotos = photos.filter(photo => photo.id !== photoId);
                setPhotos(updatedPhotos);
                Alert.alert('Success', 'Photo deleted');
              } else {
                Alert.alert('Error', 'Failed to delete photo');
              }
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading your photos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Photos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <ExpoGoNotice />
        
        <Text style={styles.subtitle}>
          Add up to 6 photos to showcase yourself. Your first photo will be your main profile picture.
        </Text>

        <PhotoUpload
          photos={photos}
          onPhotosChange={handlePhotosChange}
          onDeletePhoto={handleDeletePhoto}
          maxPhotos={6}
          style={styles.photoUpload}
        />

        {uploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color="#FF6B6B" />
            <Text style={styles.uploadingText}>Uploading photos...</Text>
          </View>
        )}

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Photo Tips:</Text>
          <Text style={styles.tipText}>• Use high-quality, well-lit photos</Text>
          <Text style={styles.tipText}>• Show your face clearly in your main photo</Text>
          <Text style={styles.tipText}>• Include variety - close-ups and full body shots</Text>
          <Text style={styles.tipText}>• Smile and be genuine!</Text>
          <Text style={styles.tipText}>• Avoid group photos where you're hard to identify</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  photoUpload: {
    marginBottom: 20,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  uploadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  tips: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
});

export default PhotoManagerScreen;
