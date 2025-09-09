import {NavigationContainerRef} from '@react-navigation/native';
import {RootStackParamList} from '@cvr-bus-tracker/shared-types';

// Navigation reference for imperative navigation
export let navigationRef: React.RefObject<
  NavigationContainerRef<RootStackParamList>
>;

export const setNavigationRef = (
  ref: React.RefObject<NavigationContainerRef<RootStackParamList>>,
) => {
  navigationRef = ref;
};

// Helper function to navigate from anywhere in the app
export const navigate = (name: keyof RootStackParamList, params?: any) => {
  if (navigationRef?.current) {
    navigationRef.current.navigate(name, params);
  }
};
