export interface AppConfig {
    apiBaseUrl: string;
    websocketUrl: string;
    googleMapsApiKey: string;
    debug: boolean;
}
export interface DatabaseConfig {
    url: string;
    serviceRoleKey: string;
}
export interface ServerConfig {
    port: number;
    nodeEnv: string;
    corsOrigins: string[];
}
export declare const DEFAULT_CONFIG: Partial<AppConfig>;
export declare const DEFAULT_SERVER_CONFIG: Partial<ServerConfig>;
export declare const validateConfig: (config: any) => boolean;
export declare const validateDatabaseConfig: (config: any) => boolean;
//# sourceMappingURL=index.d.ts.map