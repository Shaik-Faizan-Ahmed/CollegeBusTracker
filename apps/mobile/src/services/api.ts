import {ApiResponse, ApiError} from '@cvr-bus-tracker/shared-types';
import {getMobileConfig} from '../config/environment';

export class ApiClient {
  private baseUrl: string;

  constructor() {
    const config = getMobileConfig();
    this.baseUrl = config.apiBaseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;

    console.error('CVR_BUS_TRACKER_API_REQUEST_START');
    console.error('CVR_URL:', url);
    console.error('CVR_BASEURL:', this.baseUrl);
    console.error('CVR_ENDPOINT:', endpoint);
    console.error('CVR_OPTIONS:', JSON.stringify(options, null, 2));
    
    console.log('🔥🔥🔥 API REQUEST DETAILS 🔥🔥🔥');
    console.log('🔥 Base URL:', this.baseUrl);
    console.log('🔥 Endpoint:', endpoint);
    console.log('🔥 Full URL:', url);
    console.log('🔥 Options:', JSON.stringify(options, null, 2));

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };
    console.log('🔥 Final config:', JSON.stringify(config, null, 2));

    try {
      console.log('🔥 About to call fetch...');
      const response = await fetch(url, config);
      console.log('🔥 Fetch completed!');
      console.log('🔥 Response status:', response.status);
      console.log('🔥 Response statusText:', response.statusText);
      console.log('🔥 Response ok:', response.ok);
      console.log('🔥 Response url:', response.url);
      console.log('🔥 Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('🔥 Raw response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('🔥 Parsed response data:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('🔥 Failed to parse JSON:', parseError);
        throw new Error(`Failed to parse JSON response: ${responseText}`);
      }

      if (!response.ok) {
        console.log('🔥 Response not OK, treating as error');
        console.log('🔥 Error data:', JSON.stringify(data, null, 2));
        
        // Handle structured error responses
        if (data && data.error) {
          const error = data.error;
          console.log('🔥 Structured error:', JSON.stringify(error, null, 2));
          
          // Handle specific error codes
          if (error.code === 'BUS_ALREADY_TRACKED') {
            throw new Error(`Bus ${error.existingTracker?.busNumber || 'unknown'} already has an active tracker. Last updated: ${error.existingTracker?.lastUpdated || 'unknown'}`);
          }
          
          throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Handle ApiError format
        const apiError = data as ApiError;
        throw new Error(apiError?.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const successResponse = data as ApiResponse<T>;
      console.log('🔥 Success response:', JSON.stringify(successResponse, null, 2));
      
      // Handle both direct data and wrapped { data: ... } responses
      if (successResponse.data !== undefined) {
        console.log('🔥 Returning data (wrapped):', JSON.stringify(successResponse.data, null, 2));
        return successResponse.data;
      }
      
      console.log('🔥 Returning data (direct):', JSON.stringify(data, null, 2));
      return data as T;
    } catch (error) {
      console.error('CVR_BUS_TRACKER_API_ERROR');
      console.error('CVR_ERROR_URL:', url);
      console.error('CVR_ERROR_CONFIG:', JSON.stringify(config, null, 2));
      console.error('CVR_ERROR_MESSAGE:', error instanceof Error ? error.message : String(error));
      
      console.error('🔥🔥🔥 API REQUEST ERROR 🔥🔥🔥');
      console.error('🔥 URL:', url);
      console.error('🔥 Config:', JSON.stringify(config, null, 2));
      console.error('🔥 Error type:', typeof error);
      console.error('🔥 Error instance:', error instanceof Error);
      console.error('🔥 Error message:', error instanceof Error ? error.message : String(error));
      console.error('🔥 Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('🔥 Full error object:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {method: 'GET', headers});
  }

    async post<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
  }

  async put<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers,
    });
  }

  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(endpoint, {method: 'DELETE', headers});
  }
}

// Singleton instance
export const apiClient = new ApiClient();
