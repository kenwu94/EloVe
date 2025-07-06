import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const ProfileScreen = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      if (!userId) {
        navigation.replace('CreateProfile');
        return;
      }

      const [userResponse, statsResponse] = await Promise.all([
        ApiService.getUser(userId),
        ApiService.getUserStats(userId),
      ]);

      if (userResponse.success) {
        setCurrentUser(userResponse.user);
      }

      if (statsResponse.success) {
        setUserStats(statsResponse);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You\'ll need to create a new profile to continue.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('currentUserId');
            navigation.replace('CreateProfile');
          },
        },
      ]
    );
  };

  const getTierColor = (tier) => {
    const colors = {
      Elite: '#FF6B6B',
      'Very Attractive': '#FF8E8E',
      Attractive: '#4ECDC4',
      Average: '#45B7D1',
      'Below Average': '#96CEB4',
      Low: '#FFEAA7',
    };
    return colors[tier] || '#95A5A6';
  };

  const getTierIcon = (tier) => {
    const icons = {
      Elite: 'crown',
      'Very Attractive': 'star',
      Attractive: 'thumbs-up',
      Average: 'trending-up',
      'Below Average': 'trending-down',
      Low: 'arrow-down',
    };
    return icons[tier] || 'person';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const tierColor = getTierColor(userStats?.attractiveness_tier);
  const tierIcon = getTierIcon(userStats?.attractiveness_tier);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image 
            source={{ uri: currentUser?.photo_url || 'https://via.placeholder.com/120x160?text=No+Photo' }} 
            style={styles.profileImage} 
          />
          
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{currentUser?.name || 'Unknown User'}</Text>
            <Text style={styles.age}>Age {currentUser?.age || 'Unknown'}</Text>
            
            {currentUser?.bio ? (
              <Text style={styles.bio}>{currentUser.bio}</Text>
            ) : (
              <Text style={styles.noBio}>No bio added</Text>
            )}
          </View>

          {/* Elo Rating */}
          <View style={styles.eloSection}>
            <View style={styles.eloContainer}>
              <Text style={styles.eloRating}>{currentUser.elo_rating.toFixed(0)}</Text>
              <Text style={styles.eloLabel}>Elo Rating</Text>
            </View>
            
            <View style={[styles.tierContainer, { backgroundColor: tierColor + '20' }]}>
              <Ionicons name={tierIcon} size={20} color={tierColor} />
              <Text style={[styles.tierText, { color: tierColor }]}>
                {userStats?.attractiveness_tier || 'Average'}
              </Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        {userStats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>My Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="eye-outline" size={24} color="#4ECDC4" />
                <Text style={styles.statValue}>{userStats.stats.total_ratings_given}</Text>
                <Text style={styles.statLabel}>Profiles Rated</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="heart-outline" size={24} color="#FF6B6B" />
                <Text style={styles.statValue}>{userStats.stats.matches_given}</Text>
                <Text style={styles.statLabel}>Likes Given</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={24} color="#45B7D1" />
                <Text style={styles.statValue}>{userStats.stats.total_ratings_received}</Text>
                <Text style={styles.statLabel}>Times Rated</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="flame-outline" size={24} color="#FFA726" />
                <Text style={styles.statValue}>{userStats.stats.matches_received}</Text>
                <Text style={styles.statLabel}>Likes Received</Text>
              </View>
            </View>

            {/* Detailed Stats */}
            <View style={styles.detailedStats}>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Match Rate (Given)</Text>
                <Text style={styles.statRowValue}>
                  {userStats.stats.match_rate_given.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Match Rate (Received)</Text>
                <Text style={styles.statRowValue}>
                  {userStats.stats.match_rate_received.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Average Rating Given</Text>
                <Text style={styles.statRowValue}>
                  {parseFloat(userStats.stats.average_rating_given).toFixed(1)}/10
                </Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Average Rating Received</Text>
                <Text style={styles.statRowValue}>
                  {parseFloat(userStats.stats.average_rating_received).toFixed(1)}/10
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Elo Explanation */}
        <View style={styles.explanationSection}>
          <Text style={styles.sectionTitle}>How Elo Rating Works</Text>
          
          <View style={styles.explanationCard}>
            <Ionicons name="information-circle-outline" size={24} color="#45B7D1" />
            <View style={styles.explanationText}>
              <Text style={styles.explanationTitle}>Your Elo rating changes based on:</Text>
              <Text style={styles.explanationItem}>• Ratings you give (1-10 scale)</Text>
              <Text style={styles.explanationItem}>• Whether you like/skip profiles</Text>
              <Text style={styles.explanationItem}>• Ratings others give you</Text>
              <Text style={styles.explanationItem}>• Mutual matches boost your rating</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('PhotoManager')}
          >
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.actionButtonText}>Manage Photos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Matches')}
          >
            <Ionicons name="chatbubbles" size={20} color="white" />
            <Text style={styles.actionButtonText}>View Matches</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <Ionicons name="trophy" size={20} color="#FF6B6B" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Leaderboard
            </Text>
          </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  age: {
    fontSize: 18,
    color: '#666',
    marginTop: 4,
  },
  bio: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  noBio: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 12,
  },
  eloSection: {
    alignItems: 'center',
    width: '100%',
  },
  eloContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  eloRating: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  eloLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tierText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  detailedStats: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statRowLabel: {
    fontSize: 16,
    color: '#666',
  },
  statRowValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  explanationSection: {
    marginBottom: 20,
  },
  explanationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  explanationText: {
    flex: 1,
    marginLeft: 16,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  explanationItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.48,
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#FF6B6B',
  },
});

export default ProfileScreen;
