import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import PhotoUpload from '../components/PhotoUpload';

const CreateProfileScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    bio: '',
    photo_url: '',
  });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!formData.age.trim() || isNaN(formData.age) || parseInt(formData.age) < 18) {
      Alert.alert('Error', 'Please enter a valid age (18+)');
      return false;
    }
    if (photos.length === 0) {
      Alert.alert('Error', 'Please add at least one photo');
      return false;
    }
    return true;
  };

  const handleCreateProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // First create the user profile
      const userData = {
        ...formData,
        age: parseInt(formData.age),
        photo_url: photos.length > 0 ? 'temp_placeholder' : 'https://via.placeholder.com/300x400?text=No+Photo',
      };

      const response = await ApiService.createUser(userData);
      
      if (response.success) {
        const userId = response.user.id;
        
        // Store user ID for future use
        await AsyncStorage.setItem('currentUserId', userId);
        
        // Upload photos if any
        if (photos.length > 0) {
          try {
            const photoUploadResult = await ApiService.uploadMultiplePhotos(userId, photos);
            
            if (photoUploadResult.failed.length > 0) {
              console.warn('Some photos failed to upload:', photoUploadResult.failed);
            }
          } catch (photoError) {
            console.error('Photo upload error:', photoError);
            // Continue with profile creation even if photo upload fails
          }
        }
        
        Alert.alert(
          'Profile Created!',
          `Welcome to EloVe, ${response.user.name}! Your starting Elo rating is ${response.user.elo_rating}.`,
          [
            {
              text: 'Start Swiping!',
              onPress: () => navigation.replace('Main'),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to create profile');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      if (userId) {
        navigation.replace('Main');
      }
    } catch (error) {
      console.log('No existing profile found');
    }
  };

  React.useEffect(() => {
    checkExistingProfile();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Ionicons name="heart" size={48} color="#FF6B6B" />
            <Text style={styles.title}>Welcome to EloVe</Text>
            <Text style={styles.subtitle}>Create your profile to start rating and matching</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Add Your Photos</Text>
            <Text style={styles.sectionSubtitle}>Upload at least one photo to get started</Text>
            
            <PhotoUpload
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={6}
              style={styles.photoUpload}
            />

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your name"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your age"
                value={formData.age}
                onChangeText={(text) => handleInputChange('age', text)}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="chatbubble-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Tell us about yourself... (optional)"
                value={formData.bio}
                onChangeText={(text) => handleInputChange('bio', text)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, loading && styles.disabledButton]}
              onPress={handleCreateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="rocket" size={20} color="white" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Create Profile</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              You'll start with an Elo rating of 1200. Rate others 1-10, and your rating will change based on interactions!
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  bioInput: {
    paddingTop: 15,
    height: 80,
  },
  createButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  photoUpload: {
    marginBottom: 20,
  },
});

export default CreateProfileScreen;
