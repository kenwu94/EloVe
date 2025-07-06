import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Helper function to get the base URL from API service
const getBaseUrl = () => {
  // This should match your API base URL without /api
  return 'http://192.168.2.100:5000';
};

const PhotoUpload = ({ 
  photos = [], 
  onPhotosChange, 
  onDeletePhoto, // New prop for handling photo deletion
  maxPhotos = 6, 
  style 
}) => {
  const [uploading, setUploading] = useState(false);

  // Debug logs
  console.log('PhotoUpload - photos prop:', photos);
  console.log('PhotoUpload - photos length:', photos.length);

  const requestPermissions = async () => {
    // Request camera permission
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos.'
      );
      return false;
    }

    // Request media library permission
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaPermission.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Photo library permission is required to select photos.'
      );
      return false;
    }

    return true;
  };

  const showImagePickerOptions = () => {
    if (photos.length >= maxPhotos) {
      Alert.alert(
        'Maximum Photos',
        `You can only upload up to ${maxPhotos} photos.`
      );
      return;
    }

    Alert.alert(
      'Add Photo',
      'Choose an option to add a photo',
      [
        {
          text: 'Camera',
          onPress: () => pickImageFromCamera(),
        },
        {
          text: 'Photo Library',
          onPress: () => pickImageFromLibrary(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const pickImageFromCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setUploading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
          type: 'image/jpeg',
          isNew: true, // Mark as new photo for upload
        };
        onPhotosChange([...photos, newPhoto]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const pickImageFromLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setUploading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
          type: 'image/jpeg',
          isNew: true, // Mark as new photo for upload
        };
        onPhotosChange([...photos, newPhoto]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (photoId) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const photoToRemove = photos.find(photo => photo.id === photoId);
              console.log('Attempting to remove photo:', photoToRemove);
              
              // If there's a custom delete handler (for existing photos), use it
              if (onDeletePhoto && !photoToRemove?.isNew) {
                console.log('Using custom delete handler for existing photo');
                await onDeletePhoto(photoId);
                return;
              }
              
              // Otherwise, just remove from local state (for new photos)
              console.log('Removing photo from local state');
              const updatedPhotos = photos.filter(photo => photo.id !== photoId);
              onPhotosChange(updatedPhotos);
              
            } catch (error) {
              console.error('Error removing photo:', error);
              Alert.alert('Error', 'Failed to remove photo. Please try again.');
            }
          },
        },
      ]
    );
  };

  const setMainPhoto = (photoId) => {
    const updatedPhotos = [...photos];
    const photoIndex = updatedPhotos.findIndex(photo => photo.id === photoId);
    
    if (photoIndex > 0) {
      // Move the selected photo to the front
      const selectedPhoto = updatedPhotos.splice(photoIndex, 1)[0];
      updatedPhotos.unshift(selectedPhoto);
      onPhotosChange(updatedPhotos);
    }
  };

  const renderPhoto = (photo, index) => {
    console.log('Rendering photo:', photo); // Debug log
    console.log('Photo URI:', photo?.uri); // Debug photo URI specifically
    
    // Convert relative URLs to absolute URLs
    const getImageUri = (uri) => {
      if (!uri) return 'https://via.placeholder.com/120x160/f0f0f0/999999?text=No+Image';
      
      // If it's already a full URL, return as is
      if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('file://')) {
        return uri;
      }
      
      // If it's a relative path, prepend the server URL
      const baseUrl = getBaseUrl();
      return `${baseUrl}${uri}`;
    };
    
    const imageUri = getImageUri(photo?.uri);
    console.log('Converted image URI:', imageUri);
    
    return (
      <View key={photo.id} style={styles.photoContainer}>
        <Image 
          source={{ uri: imageUri }} 
          style={styles.photo}
          contentFit="cover"
          transition={200}
          placeholder={{ uri: "https://via.placeholder.com/120x160/f0f0f0/999999?text=Loading" }}
          onError={(error) => {
            console.error('Error loading image:', error, 'URI:', imageUri);
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', imageUri);
          }}
        />
        
        {/* Main photo indicator */}
        {index === 0 && (
        <View style={styles.mainPhotoIndicator}>
          <Text style={styles.mainPhotoText}>MAIN</Text>
        </View>
      )}

      {/* Photo actions */}
      <View style={styles.photoActions}>
        {index !== 0 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.setMainButton]}
            onPress={() => setMainPhoto(photo.id)}
          >
            <Ionicons name="star" size={16} color="white" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => removePhoto(photo.id)}
        >
          <Ionicons name="close" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
  };

  const renderAddPhotoButton = () => (
    <View style={styles.addButtonContainer}>
      <TouchableOpacity
        style={styles.addPhotoButton}
        onPress={showImagePickerOptions}
        disabled={uploading || photos.length >= maxPhotos}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#FF6B6B" />
        ) : (
          <>
            <Ionicons name="camera" size={24} color="#FF6B6B" />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </>
        )}
      </TouchableOpacity>
      
      {/* Test button to add a dummy photo for debugging */}
      {__DEV__ && (
        <TouchableOpacity
          style={[styles.addPhotoButton, styles.testButton]}
          onPress={() => {
            const testPhoto = {
              id: Date.now().toString(),
              uri: 'https://picsum.photos/120/160?random=' + Date.now(),
              type: 'image/jpeg',
              isNew: false,
            };
            console.log('Adding test photo:', testPhoto);
            onPhotosChange([...photos, testPhoto]);
          }}
        >
          <Ionicons name="flask" size={20} color="#4ECDC4" />
          <Text style={[styles.addPhotoText, { color: '#4ECDC4', fontSize: 10 }]}>Test</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.photosRow}>
          {photos.map((photo, index) => renderPhoto(photo, index))}
          {photos.length < maxPhotos && renderAddPhotoButton()}
        </View>
      </ScrollView>
      
      <Text style={styles.photoCounter}>
        {photos.length}/{maxPhotos} photos
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  photosRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 120,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  mainPhotoIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mainPhotoText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  photoActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'column',
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  setMainButton: {
    backgroundColor: '#FFD700',
  },
  removeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  addPhotoButton: {
    width: 120,
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  addButtonContainer: {
    gap: 8,
  },
  testButton: {
    height: 60,
    borderColor: '#4ECDC4',
  },
  addPhotoText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  photoCounter: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
});

export default PhotoUpload;
