import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.7;

const SwipeScreen = ({ navigation }) => {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [usersToRate, setUsersToRate] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Animation values
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      if (userId) {
        setCurrentUserId(userId);
        loadUsersToRate(userId);
      } else {
        navigation.replace('CreateProfile');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      navigation.replace('CreateProfile');
    }
  };

  const loadUsersToRate = async (userId) => {
    try {
      setLoading(true);
      const response = await ApiService.getUsersToRate(userId);
      if (response.success) {
        setUsersToRate(response.users);
        setCurrentIndex(0);
      } else {
        Alert.alert('Error', 'Failed to load users');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const resetCardPosition = () => {
    Animated.parallel([
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }),
      Animated.spring(rotate, {
        toValue: 0,
        useNativeDriver: false,
      }),
      Animated.spring(opacity, {
        toValue: 1,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleSwipe = (direction, isMatch = false) => {
    const currentUser = usersToRate[currentIndex];
    if (!currentUser) return;

    setPendingAction({ user: currentUser, isMatch, direction });
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (!pendingAction) return;

    try {
      setLoading(true);
      const ratingData = {
        rater_id: currentUserId,
        rated_id: pendingAction.user.id,
        rating: rating,
        is_match: pendingAction.isMatch,
      };

      const response = await ApiService.rateUser(ratingData);
      
      if (response.success) {
        // Show result
        let message = `You rated ${pendingAction.user.name} ${rating}/10`;
        if (response.mutual_match) {
          message += '\n🎉 IT\'S A MUTUAL MATCH! 💕';
        }
        
        if (response.rating_change_rater !== 0) {
          message += `\nYour Elo: ${response.rating_change_rater > 0 ? '+' : ''}${response.rating_change_rater.toFixed(1)}`;
        }

        Alert.alert('Rating Submitted!', message);

        // Animate card away
        const toValue = pendingAction.direction === 'right' ? screenWidth : -screenWidth;
        Animated.parallel([
          Animated.timing(position, {
            toValue: { x: toValue, y: 0 },
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }),
        ]).start(() => {
          // Move to next user
          const nextIndex = currentIndex + 1;
          if (nextIndex >= usersToRate.length) {
            // Reload users
            loadUsersToRate(currentUserId);
          } else {
            setCurrentIndex(nextIndex);
            position.setValue({ x: 0, y: 0 });
            opacity.setValue(1);
          }
        });
      } else {
        Alert.alert('Error', response.error || 'Failed to submit rating');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
      setShowRatingModal(false);
      setPendingAction(null);
      setRating(5);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
      
      // Rotate card based on horizontal movement
      const rotateValue = gesture.dx * 0.1;
      rotate.setValue(rotateValue);
    },
    onPanResponderRelease: (event, gesture) => {
      const threshold = screenWidth * 0.3;
      
      if (gesture.dx > threshold) {
        // Swiped right (like)
        handleSwipe('right', true);
      } else if (gesture.dx < -threshold) {
        // Swiped left (pass)
        handleSwipe('left', false);
      } else {
        // Snap back
        resetCardPosition();
      }
    },
  });

  const renderCard = (user, index) => {
    if (index !== currentIndex) return null;

    const rotateInterpolate = rotate.interpolate({
      inputRange: [-200, 0, 200],
      outputRange: ['-15deg', '0deg', '15deg'],
    });

    return (
      <Animated.View
        key={user.id}
        style={[
          styles.card,
          {
            transform: [
              ...position.getTranslateTransform(),
              { rotate: rotateInterpolate },
            ],
            opacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Image source={{ uri: user.photo_url }} style={styles.cardImage} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{user.name}, {user.age}</Text>
          <Text style={styles.cardBio}>{user.bio}</Text>
          <View style={styles.eloContainer}>
            <Ionicons name="trophy" size={16} color="#FFD700" />
            <Text style={styles.eloText}>{user.elo_rating.toFixed(0)} Elo</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderRatingModal = () => {
    if (!showRatingModal || !pendingAction) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.ratingModal}>
          <Text style={styles.modalTitle}>
            Rate {pendingAction.user.name}
          </Text>
          <Text style={styles.modalSubtitle}>
            How attractive do you find them? (1-10)
          </Text>
          
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingValue}>{rating}</Text>
            <View style={styles.ratingButtons}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.ratingButton,
                    rating === value && styles.selectedRatingButton,
                  ]}
                  onPress={() => setRating(value)}
                >
                  <Text
                    style={[
                      styles.ratingButtonText,
                      rating === value && styles.selectedRatingButtonText,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowRatingModal(false);
                setPendingAction(null);
                setRating(5);
                resetCardPosition();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitRating}
            >
              <Text style={styles.submitButtonText}>Submit Rating</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading profiles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (usersToRate.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No more profiles!</Text>
          <Text style={styles.emptySubtitle}>
            You've seen all available profiles. Check back later for new users!
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => loadUsersToRate(currentUserId)}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentUser = usersToRate[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>EloVe</Text>
        <Text style={styles.headerSubtitle}>
          {currentIndex + 1} of {usersToRate.length}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        {currentUser && renderCard(currentUser, currentIndex)}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={() => handleSwipe('left', false)}
        >
          <Ionicons name="close" size={32} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleSwipe('right', true)}
        >
          <Ionicons name="heart" size={32} color="white" />
        </TouchableOpacity>
      </View>

      <Text style={styles.instructions}>
        Swipe or tap buttons • Rate 1-10 to affect Elo ratings
      </Text>

      {renderRatingModal()}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '70%',
    resizeMode: 'cover',
  },
  cardInfo: {
    padding: 20,
    flex: 1,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  cardBio: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    flex: 1,
  },
  eloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  eloText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 60,
    paddingVertical: 20,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  passButton: {
    backgroundColor: '#FF4458',
  },
  likeButton: {
    backgroundColor: '#66D7A2',
  },
  instructions: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    paddingBottom: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    maxWidth: 350,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  ratingValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 20,
  },
  ratingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  selectedRatingButton: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FF6B6B',
  },
  ratingButtonText: {
    fontSize: 16,
    color: '#666',
  },
  selectedRatingButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SwipeScreen;
