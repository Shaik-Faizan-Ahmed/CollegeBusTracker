import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';

interface RecentBusListProps {
  recentBuses: string[];
  onSelectBus: (busNumber: string) => void;
  onClearHistory: () => void;
}

const RecentBusList: React.FC<RecentBusListProps> = ({
  recentBuses,
  onSelectBus,
  onClearHistory,
}) => {
  if (recentBuses.length === 0) {
    return null;
  }

  const renderBusItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.busButton}
      onPress={() => onSelectBus(item)}
      accessibilityRole="button"
      accessibilityLabel={`Select bus ${item}`}
      accessibilityHint="Tap to select this bus number"
    >
      <Text style={styles.busButtonText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Bus Numbers</Text>
        <TouchableOpacity
          onPress={onClearHistory}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear recent bus numbers"
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={recentBuses}
        renderItem={renderBusItem}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  listContainer: {
    paddingVertical: 4,
  },
  busButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    minHeight: 44, // Minimum touch target
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  busButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default RecentBusList;