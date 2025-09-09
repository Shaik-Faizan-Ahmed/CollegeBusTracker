"use strict";
// CVR Bus Tracker - Shared Types
// All types shared between frontend and backend
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUS_SESSION_CONSTRAINTS = void 0;
exports.BUS_SESSION_CONSTRAINTS = {
    busNumber: {
        minLength: 1,
        maxLength: 10,
        pattern: /^[A-Za-z0-9]+$/
    },
    trackerId: {
        minLength: 1,
        maxLength: 50
    },
    latitude: {
        min: -90,
        max: 90
    },
    longitude: {
        min: -180,
        max: 180
    },
    accuracy: {
        min: 0
    }
};
//# sourceMappingURL=index.js.map