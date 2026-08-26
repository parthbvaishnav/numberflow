
# Create new app
npx @react-native-community/cli init APP_NAME

# Run App
npx react-native run-android


cd android 
gradlew clean
gradlew assembleRelease


  # Delete build caches
  root path
rd /s /q android\app\.cxx
rd /s /q android\app\build
rd /s /q android\build
rd /s /q node_modules
del package-lock.json yarn.lock




# Keystore
keytool -genkeypair -v -storetype PKCS12 -keystore numberflow.keystore -alias numberflow -keyalg RSA -keysize 2048 -validity 10000

Password: 1234567890



D:\PC\RN\numberflow>keytool -genkeypair -v -storetype PKCS12 -keystore numberflow.keystore -alias numberflow -keyalg RSA -keysize 2048 -validity 10000
Enter keystore password:  

Re-enter new password:

Enter the distinguished name. Provide a single dot (.) to leave a sub-component empty or press ENTER to use the default value in braces.
What is your first and last name?
  [Unknown]:  NP Game
What is the name of your organizational unit?
  [Unknown]:  NP Game Studio 
What is the name of your organization?
  [Unknown]:  NP Game Studio
What is the name of your City or Locality?
  [Unknown]:  Surat
What is the name of your State or Province?
  [Unknown]:  Gujarat
What is the two-letter country code for this unit?
  [Unknown]:  IN
Is CN=NP Game, OU=NP Game Studio, O=NP Game Studio, L=Surat, ST=Gujarat, C=IN correct?
  [no]: yes


# android/app/build.gradle
  signingConfigs {
    release {
        if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
  }

  buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        shrinkResources false
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
  }


  # Generate Release APK (Standard Build)
  cd android
  ./gradlew assembleRelease

  # Fast Single-Architecture Release APK (Local Device Testing - 70% Faster)
  cd android
  ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a

  APK Output Path: android/app/build/outputs/apk/release/app-release.apk

  # Generate Release AAB (For Google Play Store Upload)
  cd android
  ./gradlew bundleRelease

  AAB Output Path: android/app/build/outputs/bundle/release/app-release.aab

  # Note: Do NOT run 'gradlew clean' before every build!
  # Run 'gradlew clean' ONLY when adding new native dependencies or editing build configs.


  # Check Keystore status
  keytool -list -v -keystore numberflow.keystore




{
  "ads": {
    "is_adsShow": false,
    "is_adOpenShow": false,
    "BannerAds": false,
    "default": {
      "inter": "G",
      "interReward": "G",
      "rewarded": "G",
      "open": "G", 
      "BannerBottom": "G",
      "G": {
        "I":  "ca-app-pub-3940256099942544/1033173712",
        "O":  "ca-app-pub-3940256099942544/9257395921",
        "R":  "ca-app-pub-3940256099942544/5224354917",
        "IR": "ca-app-pub-3940256099942544/5354046379",
        "BB": "ca-app-pub-3940256099942544/9214589741"
      },
      "F": {
        "I": "IMG_16_9_LINK#YOUR_PLACEMENT_ID",
        "O": "IMG_16_9_LINK#YOUR_PLACEMENT_ID",
        "R": "VID_HD_9_16_39S_APP_INSTALL#YOUR_PLACEMENT_ID",
        "IR": "VID_HD_9_16_39S_APP_INSTALL#YOUR_PLACEMENT_ID",
        "BB": "VID_HD_9_16_39S_APP_INSTALL#YOUR_PLACEMENT_ID"
      }
    }
  }
}



npm start -- --reset-cache