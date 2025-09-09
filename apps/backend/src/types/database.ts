export interface Database {
  public: {
    Tables: {
      bus_sessions: {
        Row: {
          id: string;
          bus_number: string;
          tracker_id: string;
          latitude: number;
          longitude: number;
          accuracy: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          bus_number: string;
          tracker_id: string;
          latitude: number;
          longitude: number;
          accuracy?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          bus_number?: string;
          tracker_id?: string;
          latitude?: number;
          longitude?: number;
          accuracy?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
        };
      };
    };
    Views: {
      active_buses: {
        Row: {
          bus_number: string;
          latitude: number;
          longitude: number;
          accuracy: number;
          last_updated: string;
          seconds_since_update: number;
        };
      };
    };
  };
}