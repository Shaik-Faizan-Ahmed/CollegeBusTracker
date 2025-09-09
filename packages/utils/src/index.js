"use strict";
// CVR Bus Tracker - Shared Utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = exports.calculateDistance = exports.formatTimestamp = exports.validateBusNumber = void 0;
/**
 * Validates bus number format (should be alphanumeric)
 */
const validateBusNumber = (busNumber) => {
    return /^[A-Za-z0-9]+$/.test(busNumber) && busNumber.length >= 1 && busNumber.length <= 20;
};
exports.validateBusNumber = validateBusNumber;
/**
 * Formats timestamp for display
 */
const formatTimestamp = (date) => {
    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
exports.formatTimestamp = formatTimestamp;
/**
 * Calculates distance between two coordinates in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
exports.calculateDistance = calculateDistance;
/**
 * Generates unique ID
 */
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
exports.generateId = generateId;
//# sourceMappingURL=index.js.map