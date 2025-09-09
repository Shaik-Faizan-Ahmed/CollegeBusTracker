"use strict";
// CVR Bus Tracker - Shared Configuration
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDatabaseConfig = exports.validateConfig = exports.DEFAULT_SERVER_CONFIG = exports.DEFAULT_CONFIG = void 0;
// Default configurations
exports.DEFAULT_CONFIG = {
    debug: false,
};
exports.DEFAULT_SERVER_CONFIG = {
    port: 3000,
    nodeEnv: 'development',
    corsOrigins: ['http://localhost:8081'],
};
// Configuration validation
const validateConfig = (config) => {
    const requiredFields = ['apiBaseUrl', 'websocketUrl'];
    return requiredFields.every(field => field in config && config[field]);
};
exports.validateConfig = validateConfig;
const validateDatabaseConfig = (config) => {
    const requiredFields = ['url', 'serviceRoleKey'];
    return requiredFields.every(field => field in config && config[field]);
};
exports.validateDatabaseConfig = validateDatabaseConfig;
//# sourceMappingURL=index.js.map