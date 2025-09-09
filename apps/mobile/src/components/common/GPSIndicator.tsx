import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export type SignalStrength = 'none' | 'weak' | 'good' | 'excellent';

export interface GPSIndicatorProps {
  signalStrength: SignalStrength;
  accuracy: number | null;
  showLabel?: boolean;
}

export const GPSIndicator: React.FC<GPSIndicatorProps> = ({
  signalStrength,
  accuracy,
  showLabel = true,
}) => {
  const getSignalColor = (strength: SignalStrength): string => {
    switch (strength) {
      case 'excellent':
        return '#38A169';
      case 'good':
        return '#68D391';
      case 'weak':
        return '#D69E2E';
      case 'none':
      default:
        return '#E53E3E';
    }
  };

  const getSignalText = (strength: SignalStrength): string => {
    switch (strength) {
      case 'excellent':
        return 'Excellent GPS';
      case 'good':
        return 'Good GPS';
      case 'weak':
        return 'Weak GPS';
      case 'none':
      default:
        return 'No GPS Signal';
    }
  };

  const getSignalBars = (strength: SignalStrength): number => {
    switch (strength) {
      case 'excellent':
        return 4;
      case 'good':
        return 3;
      case 'weak':
        return 2;
      case 'none':
      default:
        return 1;
    }
  };

  const signalColor = getSignalColor(signalStrength);
  const activeBars = getSignalBars(signalStrength);

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {[1, 2, 3, 4].map(bar => (
          <View
            key={bar}
            style={[
              styles.bar,
              {
                height: bar * 4 + 4,
                backgroundColor: bar <= activeBars ? signalColor : '#E2E8F0',
              },
            ]}
          />
        ))}
      </View>
      
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.signalText, {color: signalColor}]}>
            {getSignalText(signalStrength)}
          </Text>
          {accuracy !== null && (
            <Text style={styles.accuracyText}>
              ±{Math.round(accuracy)}m
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 8,
  },
  bar: {
    width: 6,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  labelContainer: {
    flex: 1,
  },
  signalText: {
    fontSize: 14,
    fontWeight: '600',
  },
  accuracyText: {
    fontSize: 12,
    color: '#718096',
  },
});