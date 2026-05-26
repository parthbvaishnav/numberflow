import { LogLevel, OneSignal } from 'react-native-onesignal';

class NotificationService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize(appId) {

    console.log('appId:', appId);

    if (this.isInitialized) return;

    try {

      // Init OneSignal
      OneSignal.initialize(appId);

      // Permission
      OneSignal.Notifications.requestPermission(true);

      // Subscription Observer
      OneSignal.User.pushSubscription.addEventListener('change', (event) => {

        console.log('Subscription changed:', event);

        console.log(
          'Push ID:',
          OneSignal.User.pushSubscription.getId()
        );
 
        console.log(
          'Push Token:',
          OneSignal.User.pushSubscription.getToken()
        );
      });

      // Foreground Notification
      OneSignal.Notifications.addEventListener(
        'foregroundWillDisplay',
        (event) => {

          console.log(
            'Foreground notification:',
            event.getNotification()
          );

          event.preventDefault();

          event.getNotification().display();
        }
      );

      // Click Listener
      OneSignal.Notifications.addEventListener(
        'click',
        (event) => {

          console.log(
            'Notification clicked:',
            event
          );

          const data =
            event.notification.additionalData;

          if (data) {
            this.handleNotification(data);
          }
        }
      );

      this.isInitialized = true;

      console.log('OneSignal initialized');

    } catch (error) {

      console.log(
        'OneSignal init error:',
        error
      );
    }
  }

  handleNotification(data) {

    if (data?.screen === 'play') {
      console.log('Navigate to Play Screen');
    } else {
      console.log('Navigate to Home Screen');
    }
  }

  async getUserId() {

    try {

      return OneSignal.User.pushSubscription.getId();

    } catch (e) {

      return null;
    }
  }

  setExternalUserId(id) {
    OneSignal.login(id);
  }

  sendTags(tags) {
    OneSignal.User.addTags(tags);
  }
}

export default new NotificationService();