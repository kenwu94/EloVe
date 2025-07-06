import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const MatchesScreen = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      if (!userId) {
        navigation.replace('CreateProfile');
        return;
      }

      const response = await ApiService.getUserMatches(userId);
      if (response.success) {
        setMatches(response.matches);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const formatMatchDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderMatch = ({ item }) => {
    const { other_user, created_at } = item;

    return (
      <TouchableOpacity style={styles.matchCard}>
        <Image 
          source={{ uri: other_user?.photo_url || 'https://via.placeholder.com/120x160?text=No+Photo' }} 
          style={styles.matchImage} 
        />
        
        <View style={styles.matchInfo}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchName}>{other_user?.name || 'Unknown User'}</Text>
            <View style={styles.matchBadge}>
              <Ionicons name="heart" size={12} color="white" />
              <Text style={styles.matchBadgeText}>Match</Text>
            </View>
          </View>
          
          <Text style={styles.matchAge}>Age {other_user?.age || 'Unknown'}</Text>
          
          {other_user?.bio && (
            <Text style={styles.matchBio} numberOfLines={2}>
              {other_user.bio}
            </Text>
          )}
          
          <View style={styles.matchFooter}>
            <View style={styles.eloContainer}>
              <Ionicons name="trophy" size={14} color="#FFD700" />
              <Text style={styles.eloText}>{(other_user?.elo_rating || 1200).toFixed(0)} Elo</Text>
            </View>
            <Text style={styles.matchDate}>{formatMatchDate(created_at)}</Text>
          </View>
        </View>

        <View style={styles.matchActions}>
          <TouchableOpacity style={styles.messageButton}>
            <Ionicons name="chatbubble" size={20} color="#FF6B6B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewButton}>
            <Ionicons name="eye" size={20} color="#4ECDC4" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No matches yet</Text>
      <Text style={styles.emptySubtitle}>
        Start swiping to find your matches! When someone likes you back, they'll appear here.
      </Text>
      <TouchableOpacity
        style={styles.startSwipingButton}
        onPress={() => navigation.navigate('Swipe')}
      >
        <Ionicons name="heart" size={20} color="white" />
        <Text style={styles.startSwipingText}>Start Swiping</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Ionicons name="heart" size={24} color="#FF6B6B" />
        <Text style={styles.title}>My Matches</Text>
      </View>
      <Text style={styles.subtitle}>
        {matches.length} {matches.length === 1 ? 'match' : 'matches'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.match_id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.listContainer,
          matches.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
      />
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
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  matchCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  matchInfo: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  matchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  matchAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  matchBio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eloText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  matchDate: {
    fontSize: 12,
    color: '#999',
  },
  matchActions: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4ECDC420',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  startSwipingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startSwipingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default MatchesScreen;
