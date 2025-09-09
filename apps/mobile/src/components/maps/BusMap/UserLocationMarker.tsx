import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker, Circle } from 'react-native-maps';
import { UserLocationMarkerProps } from '../../../types/map';

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({
  coordinate,
  accuracy,
  showAccuracyCircle = true,
}) => {
  return (
    <>
      <Marker
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        centerOffset={{ x: 0, y: 0 }}
      >
        <View style={styles.userMarker}>
          <View style={styles.userMarkerInner} />
        </View>
      </Marker>
      
      {showAccuracyCircle && accuracy && (
        <Circle
          center={coordinate}
          radius={accuracy}
          strokeColor="#1976D2"
          strokeWidth={1}
          fillColor="rgba(25, 118, 210, 0.1)"
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1976D2',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});

export default UserLocationMarker;