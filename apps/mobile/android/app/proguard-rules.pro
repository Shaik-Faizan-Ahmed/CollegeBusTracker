# Proguard rules for CVR Bus Tracker
# React Native optimizations

-keep class com.facebook.react.devsupport.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.swmansion.reanimated.** { *; }

# React Native Geolocation
-keep class com.reactnativecommunity.geolocation.** { *; }

# React Native Maps  
-keep class com.airbnb.android.react.maps.** { *; }
-keep class com.google.android.gms.maps.** { *; }

# Zustand state management
-keep class zustand.** { *; }

# Keep source file names and line numbers for better crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile