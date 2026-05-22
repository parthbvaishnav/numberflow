import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RATING_SUBMITTED_KEY = 'RATING_SUBMITTED';
const RATING_LAST_SHOWN_KEY = 'RATING_LAST_SHOWN';

// Number of days to wait before showing again (3 days)
const DAYS_DELAY = 3;
const MS_IN_DAY = 24 * 60 * 60 * 1000;

export default function RatingModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    checkRatingStatus();
  }, []);

  const checkRatingStatus = async () => {
    try {
      const submitted = await AsyncStorage.getItem(RATING_SUBMITTED_KEY);
      if (submitted === 'true') {
        return; // Already rated
      }

      const lastShown = await AsyncStorage.getItem(RATING_LAST_SHOWN_KEY);
      const now = Date.now();

      if (!lastShown) {
        // Show immediately the first time (or you could set it to wait 3 days first)
        // We'll wait until they play a bit, so let's set lastShown to now and wait 3 days.
        // Wait, the user wants it to appear if not given yet. Let's show it the first time.
        setVisible(true);
        await AsyncStorage.setItem(RATING_LAST_SHOWN_KEY, String(now));
      } else {
        const timePassed = now - parseInt(lastShown, 10);
        if (timePassed > DAYS_DELAY * MS_IN_DAY) {
          setVisible(true);
          await AsyncStorage.setItem(RATING_LAST_SHOWN_KEY, String(now));
        }
      }
    } catch (e) {
      console.log('Error checking rating status:', e);
    }
  };

  const handleRateNow = async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(RATING_SUBMITTED_KEY, 'true');
      
      // Open store URL
      const url = Platform.OS === 'ios'
        ? 'itms-apps://itunes.apple.com/app/idYOUR_APP_ID?action=write-review'
        : 'market://details?id=com.yourpackage.name';
        
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to web link if market:// is not supported
          const webUrl = Platform.OS === 'ios'
            ? 'https://apps.apple.com/app/idYOUR_APP_ID?action=write-review'
            : 'https://play.google.com/store/apps/details?id=com.yourpackage.name';
          Linking.openURL(webUrl);
        }
      });
    } catch (e) {
      console.log('Error submitting rating:', e);
    }
  };

  const handleRemindLater = () => {
    setVisible(false);
    // It will show again in 3 days since we already updated RATING_LAST_SHOWN_KEY
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Enjoying the Game?</Text>
          <Text style={styles.subtitle}>
            If you like the game, please take a moment to rate it. It really helps us!
          </Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.laterBtn} onPress={handleRemindLater}>
              <Text style={styles.laterText}>Later</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rateBtn} onPress={handleRateNow}>
              <Text style={styles.rateText}>Rate Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    backgroundColor: '#16212b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderColor: '#3a4f63',
    borderWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#c8dcea',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  laterBtn: {
    flex: 1,
    backgroundColor: '#3a4f63',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  laterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rateBtn: {
    flex: 1,
    backgroundColor: '#4da9ff',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  rateText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
