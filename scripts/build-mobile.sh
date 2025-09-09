#!/bin/bash

# Mobile App Build Script for CVR Bus Tracker
# Builds both Android and iOS versions of the React Native app

set -e

echo "📱 Starting mobile app build process..."

# Change to mobile app directory
cd apps/mobile

# Check if Node.js and React Native CLI are available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo "❌ npx is required but not installed"
    exit 1
fi

echo "✅ Node.js and npx are available"

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Determine build target from argument or build both
BUILD_TARGET=${1:-both}

case $BUILD_TARGET in
    android)
        echo "🤖 Building Android APK..."
        
        # Check if Android SDK is available
        if ! command -v adb &> /dev/null; then
            echo "⚠️  Android SDK not found - skipping Android build"
            echo "   To build Android: Install Android Studio and SDK"
            exit 0
        fi
        
        # Create bundle first
        yarn bundle:android
        
        # Build APK
        yarn build:android
        
        # Check if APK was created
        APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
        if [ -f "$APK_PATH" ]; then
            echo "✅ Android APK built successfully: $APK_PATH"
            echo "📄 APK size: $(du -h $APK_PATH | cut -f1)"
        else
            echo "❌ Android build failed - APK not found"
            exit 1
        fi
        ;;
        
    ios)
        echo "🍎 Building iOS app..."
        
        # Check if Xcode is available (macOS only)
        if ! command -v xcodebuild &> /dev/null; then
            echo "⚠️  Xcode not found - skipping iOS build"
            echo "   To build iOS: Install Xcode on macOS"
            exit 0
        fi
        
        # Install pods
        echo "📦 Installing iOS pods..."
        cd ios && pod install && cd ..
        
        # Create bundle first
        yarn bundle:ios
        
        # Build iOS
        yarn build:ios
        
        echo "✅ iOS build completed"
        ;;
        
    both|*)
        echo "🔄 Building both Android and iOS..."
        
        # Build Android
        echo "🤖 Starting Android build..."
        if command -v adb &> /dev/null; then
            yarn bundle:android
            yarn build:android
            echo "✅ Android build completed"
        else
            echo "⚠️  Skipping Android build - SDK not available"
        fi
        
        # Build iOS  
        echo "🍎 Starting iOS build..."
        if command -v xcodebuild &> /dev/null; then
            cd ios && pod install && cd ..
            yarn bundle:ios
            yarn build:ios
            echo "✅ iOS build completed"
        else
            echo "⚠️  Skipping iOS build - Xcode not available"
        fi
        ;;
esac

echo "🎉 Mobile build process completed!"
echo "📱 Built for: $BUILD_TARGET"

# Display build outputs
echo ""
echo "📂 Build outputs:"
if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
    echo "   Android: android/app/build/outputs/apk/release/app-release.apk"
fi
if [ -d "ios/build" ]; then
    echo "   iOS: ios/build/ (check for .app or .ipa files)"
fi