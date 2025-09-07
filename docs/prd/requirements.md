# Requirements

## Functional Requirements

**FR1:** The system shall provide a two-option main screen interface with "Track Bus" and "Become Tracker" buttons for immediate access to core functionality

**FR2:** The Track Bus flow shall allow users to enter a bus number and view the bus's real-time location on an integrated map display

**FR3:** The Become Tracker flow shall allow users to enter a bus number and begin sharing their GPS location as an active tracker for that bus

**FR4:** The system shall display the active tracker's real-time location on an interactive map with basic zoom and pan functionality

**FR5:** The system shall update the active tracker's location every 10-15 seconds to maintain real-time accuracy

**FR6:** The system shall prevent multiple active trackers per bus by notifying users when a tracker is already active for their selected bus number

**FR7:** The system shall request and manage GPS location permissions from users with appropriate privacy controls

**FR8:** The system shall allow active trackers to stop tracking at any time, making the bus available for a new tracker

**FR9:** The system shall display bus locations with visual indicators showing the bus number and tracker status on the map

**FR10:** The system shall gracefully handle scenarios where no tracker is currently active for a requested bus number, displaying appropriate messaging

**FR11:** The system shall notify users attempting to become trackers when their selected bus already has an active tracker

## Non-Functional Requirements

**NFR1:** The mobile app shall launch in under 3 seconds on target devices (Android 8.0+, iOS 12.0+)

**NFR2:** The system shall maintain GPS location accuracy within 10-20 meters under normal conditions

**NFR3:** The app shall support real-time WebSocket connections for live location streaming with automatic reconnection

**NFR4:** The system shall handle peak usage periods (200-300 concurrent users) without performance degradation

**NFR5:** Location data shall be encrypted in transit using HTTPS/WSS protocols

**NFR6:** The app crash rate shall remain below 1% across all supported devices and operating systems

**NFR7:** The system shall gracefully degrade functionality when network connectivity is poor or intermittent

**NFR8:** The backend infrastructure shall auto-scale to handle varying load patterns during academic periods

**NFR9:** The system shall process and display location updates within 2 seconds of receiving tracker data

**NFR10:** The app shall maintain responsive UI performance with map rendering completing within 2 seconds of data receipt
