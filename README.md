This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.



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


  # Generate Release APK
  cd android
  ./gradlew assembleRelease

  android/app/build/outputs/apk/release/app-release.apk

  # Generate Release AAB

  cd android
  gradlew clean
  ./gradlew bundleRelease

  android/app/build/outputs/bundle/release/app-release.aab


  # check Keystore status
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