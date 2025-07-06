import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ExpoGoNotice = () => {
  return (
    <View style={styles.container}>
      <View style={styles.noticeCard}>
        <Ionicons name="information-circle" size={20} color="#4A90E2" />
        <Text style={styles.noticeText}>
          You're using Expo Go. Photo library access may be limited. Camera functionality works normally.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
  },
  noticeText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#2C5282',
    lineHeight: 16,
  },
});

export default ExpoGoNotice;
