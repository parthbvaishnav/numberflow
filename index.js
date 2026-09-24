/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee, { EventType } from '@notifee/react-native';

// ✅ Mandatory Notifee background event handler (ensures notifications fire & handle actions when app is killed/backgrounded)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  console.log('[Notifee] Background event received:', type, notification?.id);

  if (type === EventType.PRESS) {
    console.log('[Notifee] User tapped notification in background:', notification?.id);
  }
});

AppRegistry.registerComponent(appName, () => App);
