const fs = require('fs');
const path = require('path');

const appGradle = path.join(__dirname, '../node_modules/react-native-fbads/android/app/build.gradle');
const rootGradle = path.join(__dirname, '../node_modules/react-native-fbads/android/build.gradle');
const adSettingsJava = path.join(__dirname, '../node_modules/react-native-fbads/android/app/src/main/java/suraj/tiwari/reactnativefbads/AdSettingsManager.java');

[appGradle, rootGradle].forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('jcenter()')) {
      content = content.replace(/jcenter\(\)/g, 'google()\n        mavenCentral()');
    }

    if (content.includes('audience-network-sdk:6.2.+')) {
      content = content.replace('audience-network-sdk:6.2.+', 'audience-network-sdk:6.22.0');
    }

    if (content.includes('com.android.support:recyclerview-v7')) {
      content = content.replace(/implementation "com.android.support:recyclerview-v7:[^"]+"/, 'implementation "androidx.recyclerview:recyclerview:1.3.2"');
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[patch-fbads] Patched gradle file:', filePath);
  }
});

if (fs.existsSync(adSettingsJava)) {
  let javaContent = fs.readFileSync(adSettingsJava, 'utf8');
  if (javaContent.includes('FacebookSdk.')) {
    javaContent = javaContent.replace('import com.facebook.FacebookSdk;', '// import com.facebook.FacebookSdk;');
    javaContent = javaContent.replace('FacebookSdk.setAdvertiserIDCollectionEnabled(enabled);', '// Handled directly by Audience Network SDK');
    fs.writeFileSync(adSettingsJava, javaContent, 'utf8');
    console.log('[patch-fbads] Patched AdSettingsManager.java symbol error.');
  }
}
