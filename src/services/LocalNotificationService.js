// src/services/LocalNotificationService.js
//
// Automated Local Offline Notifications for Number Flow: Connect Puzzle.
// Powered by @notifee/react-native.

let notifee = null;
let AndroidImportance = null;
let TriggerType = null;
let RepeatFrequency = null;

try {
  const mod = require('@notifee/react-native');
  notifee = mod.default || mod;
  AndroidImportance = mod.AndroidImportance;
  TriggerType = mod.TriggerType;
  RepeatFrequency = mod.RepeatFrequency;
} catch (e) {
  console.warn('[LocalNotificationService] @notifee/react-native not available:', e?.message || e);
}

const CHANNEL_ID = 'numberflow_daily_reminders';
const CHANNEL_NAME = 'Daily Puzzle Reminders';

class LocalNotificationService {
  _initialized = false;
  _channelCreated = false;

  async init() {
    if (!notifee) return;
    if (this._initialized) return;

    try {
      // 1. Request Permission (Android 13+ and iOS)
      await notifee.requestPermission();

      // 2. Create high-importance Android Notification Channel
      if (AndroidImportance) {
        await notifee.createChannel({
          id: CHANNEL_ID,
          name: CHANNEL_NAME,
          importance: AndroidImportance.HIGH,
          vibration: true,
          sound: 'default',
        });
        this._channelCreated = true;
      }

      this._initialized = true;
      console.log('[LocalNotificationService] Initialized and notification channel ready.');

      // 3. Schedule all smart retention reminders
      await this.scheduleAllReminders();
    } catch (err) {
      console.warn('[LocalNotificationService] Initialization error:', err);
    }
  }

  /**
   * Schedule all periodic and inactivity retention reminders
   */
  async scheduleAllReminders() {
    if (!notifee || !TriggerType) return;

    try {
      // Cancel previous scheduled reminders to avoid duplicates
      await notifee.cancelTriggerNotifications([
        'daily_spin_reminder',
        'streak_protection_reminder',
        'inactivity_reminder_48h',
      ]);

      const now = Date.now();

      // 1. Daily Spin & Coins Reminder (Next 8:00 PM)
      const next8PM = new Date();
      next8PM.setHours(20, 0, 0, 0); // 8:00 PM
      if (next8PM.getTime() <= now) {
        next8PM.setDate(next8PM.getDate() + 1); // tomorrow 8 PM
      }

      const spinTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: next8PM.getTime(),
        repeatFrequency: RepeatFrequency ? RepeatFrequency.DAILY : undefined,
      };

      await notifee.createTriggerNotification(
        {
          id: 'daily_spin_reminder',
          title: 'Free Coins & Lucky Spin Ready! 🎁',
          body: 'Your daily spin has recharged! Spin the wheel now to claim bonus coins & hints.',
          android: {
            channelId: CHANNEL_ID,
            pressAction: { id: 'default' },
            smallIcon: 'ic_launcher',
          },
        },
        spinTrigger
      );

      // 2. Streak Protection Reminder (24 hours from now)
      const streakTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: now + 24 * 60 * 60 * 1000, // +24 hours
      };

      await notifee.createTriggerNotification(
        {
          id: 'streak_protection_reminder',
          title: 'Keep Your Streak Alive! 🔥',
          body: 'Don\'t let your daily puzzle streak reset! Solve 1 quick level to keep your streak going.',
          android: {
            channelId: CHANNEL_ID,
            pressAction: { id: 'default' },
            smallIcon: 'ic_launcher',
          },
        },
        streakTrigger
      );

      // 3. Inactivity Re-engagement (48 hours from now)
      const inactivityTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: now + 48 * 60 * 60 * 1000, // +48 hours
      };

      await notifee.createTriggerNotification(
        {
          id: 'inactivity_reminder_48h',
          title: 'We Miss You, Solver! 🧩',
          body: 'New challenging Number Flow puzzles and secret rewards are waiting for you!',
          android: {
            channelId: CHANNEL_ID,
            pressAction: { id: 'default' },
            smallIcon: 'ic_launcher',
          },
        },
        inactivityTrigger
      );

      console.log('[LocalNotificationService] Smart retention reminders successfully scheduled.');
    } catch (err) {
      console.warn('[LocalNotificationService] Failed to schedule reminders:', err);
    }
  }

  /**
   * Send an immediate test notification for developer verification
   */
  async sendTestNotification() {
    if (!notifee) return;
    try {
      await notifee.displayNotification({
        title: 'Number Flow Alert 🚀',
        body: 'Local notifications are configured and working perfectly!',
        android: {
          channelId: CHANNEL_ID,
          smallIcon: 'ic_launcher',
        },
      });
    } catch (e) {
      console.warn('[LocalNotificationService] Test notification failed:', e);
    }
  }
}

export default new LocalNotificationService();
