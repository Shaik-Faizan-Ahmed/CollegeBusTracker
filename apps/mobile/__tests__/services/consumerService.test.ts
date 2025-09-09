import { consumerService } from '../../src/services/consumerService';
import { api } from '../../src/services/api';

// Mock the API service
jest.mock('../../src/services/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('ConsumerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBusLocation', () => {
    it('should fetch bus location successfully', async () => {
      const mockResponse = {
        data: {
          id: 'session-123',
          busNumber: '12',
          latitude: 17.3850,
          longitude: 78.4867,
          lastUpdated: new Date('2023-01-01T12:00:00Z'),
          isActive: true,
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await consumerService.getBusLocation('12');

      expect(mockedApi.get).toHaveBeenCalledWith('/buses/12');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle 404 error when no active tracker exists', async () => {
      const mockError = {
        response: { status: 404 },
      };

      mockedApi.get.mockRejectedValue(mockError);

      await expect(consumerService.getBusLocation('12'))
        .rejects
        .toThrow('No active tracker found for bus 12');
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network error');
      mockedApi.get.mockRejectedValue(mockError);

      await expect(consumerService.getBusLocation('12'))
        .rejects
        .toThrow('Failed to get bus location');
    });

    it('should handle invalid bus numbers', async () => {
      mockedApi.get.mockRejectedValue(new Error('Invalid bus number'));

      await expect(consumerService.getBusLocation('invalid'))
        .rejects
        .toThrow('Failed to get bus location');
    });
  });

  describe('getActiveBuses', () => {
    it('should fetch active buses successfully', async () => {
      const mockResponse = {
        data: {
          activeBuses: [
            {
              busNumber: '12',
              latitude: 17.3850,
              longitude: 78.4867,
              lastUpdated: new Date('2023-01-01T12:00:00Z'),
            },
            {
              busNumber: 'A5',
              latitude: 17.3900,
              longitude: 78.4900,
              lastUpdated: new Date('2023-01-01T12:05:00Z'),
            },
          ],
        },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await consumerService.getActiveBuses();

      expect(mockedApi.get).toHaveBeenCalledWith('/buses/active');
      expect(result).toEqual(mockResponse.data);
      expect(result.activeBuses).toHaveLength(2);
    });

    it('should handle empty active buses list', async () => {
      const mockResponse = {
        data: { activeBuses: [] },
      };

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await consumerService.getActiveBuses();

      expect(result.activeBuses).toEqual([]);
    });

    it('should handle network errors for active buses', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await expect(consumerService.getActiveBuses())
        .rejects
        .toThrow('Failed to get active buses');
    });

    it('should handle server errors for active buses', async () => {
      mockedApi.get.mockRejectedValue({ response: { status: 500 } });

      await expect(consumerService.getActiveBuses())
        .rejects
        .toThrow('Failed to get active buses');
    });
  });
});