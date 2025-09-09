# Google Maps API Setup Guide

This guide walks you through setting up Google Maps API for the CVR Bus Tracker mobile app.

## Prerequisites

- Google Cloud Console account
- Android Studio (for Android development)
- Xcode (for iOS development)

## Step 1: Google Cloud Console Setup

### 1.1 Create a New Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select existing project
3. Enter project name: `CVR Bus Tracker` (or preferred name)
4. Click "Create"

### 1.2 Enable Required APIs

1. Navigate to "APIs & Services" > "Library"
2. Search and enable the following APIs:
   - **Maps SDK for Android**
   - **Maps SDK for iOS** 
   - **Geocoding API** (optional, for address lookups)
   - **Places API** (optional, for location search)

### 1.3 Create API Keys

#### For Android:
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key
4. Click "Restrict Key"
5. Under "Application restrictions", select "Android apps"
6. Click "Add an item" and enter:
   - **Package name**: `com.mobile` (from AndroidManifest.xml)
   - **SHA-1 certificate fingerprint**: Get from Android Studio or use debug key
7. Under "API restrictions", select "Restrict key" and choose:
   - Maps SDK for Android
   - Any other APIs you enabled
8. Click "Save"

#### For iOS:
1. Create another API key following steps 1-3 above
2. Click "Restrict Key"
3. Under "Application restrictions", select "iOS apps"
4. Click "Add an item" and enter:
   - **Bundle ID**: `com.mobile` (from Info.plist)
5. Under "API restrictions", select "Restrict key" and choose:
   - Maps SDK for iOS
   - Any other APIs you enabled
6. Click "Save"

## Step 2: Configure Mobile App

### 2.1 Android Configuration

The Android configuration is already set up in the codebase. You just need to:

1. Copy your Android API key
2. Create `.env.local` file in `apps/mobile/` directory:
```bash
# Copy from .env.example and fill in your keys
GOOGLE_MAPS_API_KEY_ANDROID=your_actual_android_api_key_here
GOOGLE_MAPS_API_KEY_IOS=your_actual_ios_api_key_here
```

The build system will automatically:
- Read the API key from `.env.local`
- Inject it into the AndroidManifest.xml during build
- Configure location permissions

### 2.2 iOS Configuration

The iOS configuration is already set up. The API key will be automatically injected from your `.env.local` file during the build process.

## Step 3: Getting Debug SHA-1 Certificate (Android)

### Method 1: Android Studio
1. Open Android Studio
2. Open the `android` folder of the project
3. Click on "Gradle" tab (right side)
4. Navigate to `:app` > `Tasks` > `android` > `signingReport`
5. Double-click `signingReport`
6. Copy the SHA-1 from the debug certificate

### Method 2: Command Line
```bash
cd apps/mobile/android
./gradlew signingReport
```

### Method 3: Keytool (if above methods don't work)
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

## Step 4: Test the Setup

### Android Testing:
```bash
cd apps/mobile
npx react-native run-android
```

### iOS Testing:
```bash
cd apps/mobile/ios
pod install
cd ..
npx react-native run-ios
```

## Troubleshooting

### Common Issues:

1. **"Map loading failed"**
   - Check if API key is correctly set in `.env.local`
   - Verify API key restrictions in Google Cloud Console
   - Ensure billing is enabled for your Google Cloud project

2. **"This app is not authorized to use Google Maps"**
   - Verify the package name matches exactly
   - Check SHA-1 certificate fingerprint is correct
   - Ensure Maps SDK is enabled for the API key

3. **iOS build fails**
   - Run `pod install` in the `ios/` directory
   - Clean and rebuild the project

4. **Environment variables not loading**
   - Ensure `.env.local` file exists in `apps/mobile/`
   - Check file permissions
   - Restart the Metro bundler

### Debug Mode Testing

For initial testing, you can use unrestricted API keys (remove all restrictions) and then add restrictions once everything works.

## Security Notes

- **Never commit API keys to version control**
- Use different API keys for development and production
- Regularly rotate API keys
- Monitor API key usage in Google Cloud Console
- Set up billing alerts to avoid unexpected charges

## Billing Information

Google Maps API has a free tier:
- **Maps SDK**: $2.00 per 1,000 requests after first 28,000 requests/month
- **Geocoding API**: $5.00 per 1,000 requests after first 40,000 requests/month

For a college bus tracker with moderate usage, you should stay within the free tier.

## Support

If you encounter issues:
1. Check Google Cloud Console logs
2. Verify API quotas and billing
3. Review React Native Maps documentation: https://github.com/react-native-maps/react-native-maps