import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_BUSES_KEY = 'cvr_bus_tracker_recent_buses';
const MAX_RECENT_BUSES = 5;

/**
 * Storage service for managing recent bus numbers
 */
export class BusStorageService {
  /**
   * Get list of recent bus numbers
   * @returns Promise<string[]> - Array of recent bus numbers
   */
  static async getRecentBusNumbers(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem(RECENT_BUSES_KEY);
      if (!stored) {
        return [];
      }
      
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Failed to load recent bus numbers:', error);
      return [];
    }
  }

  /**
   * Add a bus number to recent list
   * @param busNumber - The bus number to add
   * @returns Promise<string[]> - Updated list of recent bus numbers
   */
  static async addRecentBusNumber(busNumber: string): Promise<string[]> {
    try {
      const current = await this.getRecentBusNumbers();
      
      // Remove if already exists to move to front
      const filtered = current.filter(num => num !== busNumber);
      
      // Add to front and limit to MAX_RECENT_BUSES
      const updated = [busNumber, ...filtered].slice(0, MAX_RECENT_BUSES);
      
      await AsyncStorage.setItem(RECENT_BUSES_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.warn('Failed to save recent bus number:', error);
      return await this.getRecentBusNumbers();
    }
  }

  /**
   * Clear all recent bus numbers
   * @returns Promise<void>
   */
  static async clearRecentBusNumbers(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECENT_BUSES_KEY);
    } catch (error) {
      console.warn('Failed to clear recent bus numbers:', error);
    }
  }

  /**
   * Remove a specific bus number from recent list
   * @param busNumber - The bus number to remove
   * @returns Promise<string[]> - Updated list of recent bus numbers
   */
  static async removeRecentBusNumber(busNumber: string): Promise<string[]> {
    try {
      const current = await this.getRecentBusNumbers();
      const filtered = current.filter(num => num !== busNumber);
      
      await AsyncStorage.setItem(RECENT_BUSES_KEY, JSON.stringify(filtered));
      return filtered;
    } catch (error) {
      console.warn('Failed to remove recent bus number:', error);
      return await this.getRecentBusNumbers();
    }
  }
}