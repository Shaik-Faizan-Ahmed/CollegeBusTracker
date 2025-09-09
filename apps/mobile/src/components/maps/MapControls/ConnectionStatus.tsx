import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isReconnecting = false,
}) => {
  if (isConnected && !isReconnecting) {
    return null; // Don't show anything when connected
  }

  const getStatusInfo = () => {
    if (isReconnecting) {
      return {
        text: 'Reconnecting...',
        color: '#FF9800',
        icon: '🔄',
      };
    }
    
    return {
      text: 'Disconnected',
      color: '#F44336',
      icon: '⚠️',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={[styles.container, { backgroundColor: statusInfo.color }]}>
      <Text style={styles.icon}>{statusInfo.icon}</Text>
      <Text style={styles.text}>{statusInfo.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ConnectionStatus;