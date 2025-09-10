# iOS Build Setup for CVR Bus Tracker

## Prerequisites

1. **Xcode**: Latest version installed from Mac App Store
2. **Apple Developer Account**: Required for distribution certificates
3. **CocoaPods**: Installed and updated (`pod --version`)

## Bundle ID Configuration

The app uses bundle ID: `com.cvrbustracker` (to be configured in Xcode)

## Development Setup

```bash
# Install pods
cd ios
pod install

# Open workspace (not .xcodeproj)
open mobile.xcworkspace
```

## Code Signing Configuration

### Development
1. Open `mobile.xcworkspace` in Xcode
2. Select project → mobile target
3. Go to "Signing & Capabilities"
4. Set Team to your Apple Developer account
5. Bundle Identifier: `com.cvrbustracker`

### Distribution (App Store)
1. Create App Store distribution certificate in Apple Developer Console
2. Create App Store provisioning profile for `com.cvrbustracker`
3. In Xcode, select "Release" configuration
4. Set signing to use distribution certificate

## Build Configurations

### Debug Build
```bash
npx react-native run-ios --configuration Debug
```

### Release Build (for testing)
```bash
npx react-native run-ios --configuration Release
```

### Archive for App Store
1. Open Xcode
2. Product → Archive
3. Select archive and "Distribute App"
4. Choose "App Store Connect"
5. Upload to TestFlight

## App Icon Setup

Icons are managed in `mobile/Images.xcassets/AppIcon.appiconset/`

Required sizes:
- iPhone: 120px, 180px
- iPad: 152px, 167px  
- App Store: 1024px
- Settings: 58px, 87px
- Spotlight: 80px, 120px

## Launch Screen

Configure in `mobile/LaunchScreen.storyboard`:
- CVR Bus Tracker branding
- Loading indicator
- Proper safe area constraints

## Info.plist Configuration

Key settings already configured:
- Location usage descriptions
- Google Maps API key placeholder
- App Transport Security settings
- Supported orientations

## Environment Variables

Create `.env.local` with:
```
GOOGLE_MAPS_API_KEY_IOS=your_ios_api_key_here
```

## TestFlight Distribution

1. Archive app in Xcode
2. Upload to App Store Connect
3. Configure TestFlight settings:
   - Beta App Information
   - Test Information
   - Beta Groups and Testers

## App Store Submission

1. Complete app metadata in App Store Connect
2. Add screenshots and app preview
3. Set pricing and availability
4. Submit for review

## Common Issues

### Build Failures
- Clean build folder: Xcode → Product → Clean Build Folder
- Delete derived data: ~/Library/Developer/Xcode/DerivedData
- Reinstall pods: `cd ios && pod install`

### Signing Issues
- Check certificate validity in Keychain Access
- Verify provisioning profile includes all devices
- Ensure bundle ID matches exactly

### Archive Issues
- Use Release configuration for archiving
- Check all dependencies are properly linked
- Verify Info.plist is valid

## Version Management

Update version in:
1. `Info.plist` → CFBundleShortVersionString (marketing version)
2. `Info.plist` → CFBundleVersion (build number)
3. Xcode project settings

Format: Marketing version (1.0.0) and Build number (1, 2, 3...)