import {navigate, setNavigationRef} from '../../src/services/navigation';
import {NavigationContainerRef} from '@react-navigation/native';
import {RootStackParamList} from '@cvr-bus-tracker/shared-types';

describe('Navigation Service', () => {
  let mockNavigationRef: jest.Mocked<
    React.RefObject<NavigationContainerRef<RootStackParamList>>
  >;
  let mockNavigation: jest.Mocked<NavigationContainerRef<RootStackParamList>>;

  beforeEach(() => {
    mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
      canGoBack: jest.fn(),
      reset: jest.fn(),
      dispatch: jest.fn(),
      isFocused: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      getCurrentOptions: jest.fn(),
      getCurrentRoute: jest.fn(),
      getId: jest.fn(),
      getParent: jest.fn(),
      getState: jest.fn(),
      getRootState: jest.fn(),
      setParams: jest.fn(),
    } as any;

    mockNavigationRef = {
      current: mockNavigation,
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setNavigationRef', () => {
    it('sets the navigation reference correctly', () => {
      expect(() => setNavigationRef(mockNavigationRef)).not.toThrow();
    });
  });

  describe('navigate', () => {
    it('navigates to specified screen when navigation ref is available', () => {
      setNavigationRef(mockNavigationRef);

      navigate('Home');

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Home', undefined);
    });

    it('navigates with parameters when provided', () => {
      setNavigationRef(mockNavigationRef);
      const params = {userId: '123'};

      navigate('TrackBus', params);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('TrackBus', params);
    });

    it('does not crash when navigation ref is null', () => {
      const nullRef = {current: null} as any;
      setNavigationRef(nullRef);

      expect(() => navigate('Home')).not.toThrow();
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });

    it('handles all screen types from RootStackParamList', () => {
      setNavigationRef(mockNavigationRef);

      navigate('Home');
      navigate('TrackBus');
      navigate('BecomeTracker');

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(3);
      expect(mockNavigation.navigate).toHaveBeenNthCalledWith(
        1,
        'Home',
        undefined,
      );
      expect(mockNavigation.navigate).toHaveBeenNthCalledWith(
        2,
        'TrackBus',
        undefined,
      );
      expect(mockNavigation.navigate).toHaveBeenNthCalledWith(
        3,
        'BecomeTracker',
        undefined,
      );
    });
  });
});
