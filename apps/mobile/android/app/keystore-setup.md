# Android Keystore Setup for Production Builds

## Generate Production Keystore

Run this command to generate a production keystore:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore cvr-bus-tracker-upload-key.keystore -alias cvr-upload-key -keyalg RSA -keysize 2048 -validity 10000
```

**Important**: Store this keystore file securely and never commit it to version control.

## Gradle Properties Configuration

Create or update `android/gradle.properties` with:

```properties
CVR_UPLOAD_STORE_FILE=cvr-bus-tracker-upload-key.keystore
CVR_UPLOAD_KEY_ALIAS=cvr-upload-key
CVR_UPLOAD_STORE_PASSWORD=YourStorePassword
CVR_UPLOAD_KEY_PASSWORD=YourKeyPassword
```

## Build Commands

### Generate Signed APK
```bash
cd android
./gradlew assembleRelease
```

### Generate Signed AAB (App Bundle) - Recommended for Play Store
```bash
cd android
./gradlew bundleRelease
```

## Build Output Locations

- **APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`

## Security Notes

1. **Never commit keystores to version control**
2. **Keep backup copies of keystore in secure locations**
3. **Document keystore passwords securely**
4. **Use different keystores for debug and release builds**

## App Bundle Benefits

- Smaller download sizes for users
- Dynamic delivery features
- Required for new apps on Google Play (2021+)
- Better optimization by Google Play

## Testing Release Build

Before store submission, test the release build:

```bash
npx react-native run-android --variant=release
```

## Google Play Console Upload

1. Upload the AAB file (recommended) or APK
2. Complete store listing with metadata
3. Set up content rating
4. Configure app pricing and distribution
5. Review and publish