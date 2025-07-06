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

const LeaderboardScreen = ({ navigation }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [appStats, setAppStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      setCurrentUserId(userId);

      const [leaderboardResponse, statsResponse] = await Promise.all([
        ApiService.getLeaderboard(),
        ApiService.getAppStats(),
      ]);

      if (leaderboardResponse.success) {
        setLeaderboard(leaderboardResponse.leaderboard);
      }

      if (statsResponse.success) {
        setAppStats(statsResponse.stats);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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

  const renderUser = ({ item, index }) => {
    const isCurrentUser = item.id === currentUserId;
    const tierColor = getTierColor(item.tier);
    const tierIcon = getTierIcon(item.tier);

    return (
      <View style={[styles.userCard, isCurrentUser && styles.currentUserCard]}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rank, { color: tierColor }]}>#{item.rank}</Text>
          {item.rank <= 3 && (
            <Ionicons
              name={item.rank === 1 ? 'trophy' : 'medal'}
              size={20}
              color={item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : '#CD7F32'}
            />
          )}
        </View>

        <Image
          source={{ uri: item.photo_url || 'https://via.placeholder.com/50x50?text=No+Photo' }}
          style={styles.avatar}
        />

        <View style={styles.userInfo}>
          <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
            {item.name || 'Unknown User'}
            {isCurrentUser && ' (You)'}
          </Text>
          <Text style={styles.userAge}>Age {item.age || 'Unknown'}</Text>
          
          <View style={styles.tierContainer}>
            <Ionicons name={tierIcon} size={16} color={tierColor} />
            <Text style={[styles.tierText, { color: tierColor }]}>
              {item.tier || 'Unranked'}
            </Text>
          </View>
        </View>

        <View style={styles.eloContainer}>
          <Text style={styles.eloRating}>{(item.elo_rating || 1200).toFixed(0)}</Text>
          <Text style={styles.eloLabel}>Elo</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Ionicons name="trophy" size={24} color="#FFD700" />
        <Text style={styles.title}>Leaderboard</Text>
      </View>
      
      {appStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{appStats.total_users}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{appStats.highest_elo.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Highest Elo</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{appStats.average_elo.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Average Elo</Text>
          </View>
        </View>
      )}

      <View style={styles.tierLegend}>
        <Text style={styles.legendTitle}>Attractiveness Tiers</Text>
        <View style={styles.legendItems}>
          {[
            { tier: 'Elite', range: '2000+' },
            { tier: 'Very Attractive', range: '1700-1999' },
            { tier: 'Attractive', range: '1400-1699' },
            { tier: 'Average', range: '1100-1399' },
            { tier: 'Below Average', range: '800-1099' },
            { tier: 'Low', range: '<800' },
          ].map((item) => (
            <View key={item.tier} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: getTierColor(item.tier) },
                ]}
              />
              <Text style={styles.legendText}>
                {item.tier} ({item.range})
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={leaderboard}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
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
  header: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tierLegend: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentUserCard: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 40,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  currentUserText: {
    color: '#FF6B6B',
  },
  userAge: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tierText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  eloContainer: {
    alignItems: 'center',
  },
  eloRating: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  eloLabel: {
    fontSize: 12,
    color: '#666',
  },
});

export default LeaderboardScreen;
