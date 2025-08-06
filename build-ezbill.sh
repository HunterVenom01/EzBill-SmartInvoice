#!/bin/bash

echo "🚀 Building EzBill APK for Android 7.0+..."

# Install dependencies
npm install

# Setup Android platform
npx cap add android

# Copy resources including splash screen
cp -r src/assets/* android/app/src/main/assets/
cp src/splash.html android/app/src/main/assets/
cp -r src/css/* android/app/src/main/assets/css/
cp -r src/js/* android/app/src/main/assets/js/

# Generate icons for all densities
mkdir -p android/app/src/main/res/mipmap-mdpi
mkdir -p android/app/src/main/res/mipmap-hdpi
mkdir -p android/app/src/main/res/mipmap-xhdpi
mkdir -p android/app/src/main/res/mipmap-xxhdpi
mkdir -p android/app/src/main/res/mipmap-xxxhdpi

# Assuming ImageMagick is installed for icon resizing
# convert assets/images/ezbill-logo.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
# convert assets/images/ezbill-logo.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
# convert assets/images/ezbill-logo.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
# convert assets/images/ezbill-logo.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
# convert assets/images/ezbill-logo.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# Sync with Capacitor
npx cap sync android

# Build release APK
cd android
./gradlew clean
./gradlew assembleRelease

if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ EzBill APK built successfully!"
    echo "📱 Location: android/app/build/outputs/apk/release/app-release.apk"
    echo "📦 Size: $(du -h app/build/outputs/apk/release/app-release.apk | cut -f1)"
    mkdir -p ../dist
    cp app/build/outputs/apk/release/app-release.apk ../dist/EzBill-v1.0.apk
    echo "📲 Ready for distribution: dist/EzBill-v1.0.apk"
else
    echo "❌ Build failed!"
    exit 1
fi
