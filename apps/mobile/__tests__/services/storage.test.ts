import AsyncStorage from '@react-native-async-storage/async-storage';
import { BusStorageService } from '../../src/services/storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('BusStorageService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getRecentBusNumbers', () => {
    it('should return empty array when no data is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await BusStorageService.getRecentBusNumbers();
      
      expect(result).toEqual([]);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('cvr_bus_tracker_recent_buses');
    });

    it('should return stored bus numbers array', async () => {
      const storedBuses = ['15', 'A1', 'B12'];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedBuses));

      const result = await BusStorageService.getRecentBusNumbers();
      
      expect(result).toEqual(storedBuses);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('cvr_bus_tracker_recent_buses');
    });

    it('should return empty array when stored data is invalid JSON', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await BusStorageService.getRecentBusNumbers();
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load recent bus numbers:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should return empty array when stored data is not an array', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify('not an array'));

      const result = await BusStorageService.getRecentBusNumbers();
      
      expect(result).toEqual([]);
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      const error = new Error('AsyncStorage error');
      mockAsyncStorage.getItem.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await BusStorageService.getRecentBusNumbers();
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load recent bus numbers:', error);
      
      consoleSpy.mockRestore();
    });
  });

  describe('addRecentBusNumber', () => {
    it('should add new bus number to empty list', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await BusStorageService.addRecentBusNumber('15');
      
      expect(result).toEqual(['15']);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'cvr_bus_tracker_recent_buses', 
        JSON.stringify(['15'])
      );
    });

    it('should add new bus number to front of existing list', async () => {
      const existingBuses = ['A1', 'B2'];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingBuses));
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await BusStorageService.addRecentBusNumber('15');
      
      expect(result).toEqual(['15', 'A1', 'B2']);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'cvr_bus_tracker_recent_buses', 
        JSON.stringify(['15', 'A1', 'B2'])
      );
    });

    it('should move existing bus number to front when added again', async () => {
      const existingBuses = ['15', 'A1', 'B2'];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingBuses));
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await BusStorageService.addRecentBusNumber('A1');
      
      expect(result).toEqual(['A1', '15', 'B2']);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'cvr_bus_tracker_recent_buses', 
        JSON.stringify(['A1', '15', 'B2'])
      );
    });

    it('should limit list to maximum of 5 items', async () => {
      const existingBuses = ['15', 'A1', 'B2', 'C3', '20'];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingBuses));
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await BusStorageService.addRecentBusNumber('A5');
      
      expect(result).toHaveLength(5);
      expect(result).toEqual(['A5', '15', 'A1', 'B2', 'C3']);
      expect(result).not.toContain('20'); // Last item should be removed
    });

    it('should handle storage errors gracefully', async () => {
      const existingBuses = ['15', 'A1'];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingBuses));
      const error = new Error('Storage error');
      mockAsyncStorage.setItem.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await BusStorageService.addRecentBusNumber('B2');
      
      // Should return the existing list when save fails
      expect(result).toEqual(existingBuses);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save recent bus number:', error);
      
      consoleSpy.mockRestore();
    });
  });

  describe('clearRecentBusNumbers', () => {
    it('should remove the recent buses storage key', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue();

      await BusStorageService.clearRecentBusNumbers();
      
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('cvr_bus_tracker_recent_buses');
    });

    it('should handle removal errors gracefully', async () => {
      const error = new Error('Removal error');
      mockAsyncStorage.removeItem.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await BusStorageService.clearRecentBusNumbers();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear recent bus numbers:', error);
      
      consoleSpy.mockRestore();
    });
  });

  describe('removeRecentBusNumber', () => {
    it('should remove specific bus number from list', async () => {
      const existingBuses = ['15', 'A1', 'B2', 'C3'];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingBuses));
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await BusStorageService.removeRecentBusNumber('A1');
      
      expect(result).toEqual(['15', 'B2', 'C3']);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'cvr_bus_tracker_recent_buses', 
        JSON.stringify(['15', 'B2', 'C3'])
      );
    });

    it('should return unchanged list when bus number not found', async () => {
      const existingBuses = ['15', 'A1', 'B2'];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingBuses));
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await BusStorageService.removeRecentBusNumber('C3');
      
      expect(result).toEqual(existingBuses);
    });

    it('should handle removal errors gracefully', async () => {
      const existingBuses = ['15', 'A1', 'B2'];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingBuses));
      const error = new Error('Removal error');
      mockAsyncStorage.setItem.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await BusStorageService.removeRecentBusNumber('A1');
      
      // Should return the existing list when save fails
      expect(result).toEqual(existingBuses);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to remove recent bus number:', error);
      
      consoleSpy.mockRestore();
    });

    it('should handle empty list gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await BusStorageService.removeRecentBusNumber('A1');
      
      expect(result).toEqual([]);
    });
  });
});