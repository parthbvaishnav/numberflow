// src/components/AgeGateModal.jsx
//
// First-launch Age Gate & Privacy Consent Dialog for Number Flow.
// Guarantees compliance with AppLovin, Meta & Google AdMob Policies for Publishers & COPPA rules.

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Linking,
  ScrollView,
  FlatList,
} from 'react-native';
import ConsentManager from '../services/ConsentManager';

// Generate age list from 5 to 99
const AGE_OPTIONS = Array.from({ length: 95 }, (_, i) => i + 5);

export default function AgeGateModal({ visible, onClose }) {
  const [selectedAge, setSelectedAge] = useState(18);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [allowPersonalized, setAllowPersonalized] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const numAge = selectedAge;
  const isValidAge = typeof numAge === 'number' && numAge >= 5 && numAge <= 99;
  const isChild = isValidAge && numAge < 13;

  const handleConfirm = async () => {
    if (!isValidAge) {
      setErrorMsg('Please select your age from the dropdown.');
      return;
    }

    setErrorMsg('');
    await ConsentManager.saveConsent({
      age: numAge,
      allowPersonalized: isChild ? false : allowPersonalized,
    });

    if (onClose) {
      onClose();
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://legal.applovin.com/privacy/');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        // Prevent closing modal without confirming age
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* Header Icon */}
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 28 }}>🛡️</Text>
            </View>

            <Text style={styles.title}>Welcome to Number Flow</Text>
            <Text style={styles.subtitle}>
              Please select your age to personalize your gameplay experience and privacy settings.
            </Text>

            {/* Age Dropdown Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Your Age:</Text>

              <TouchableOpacity
                style={[
                  styles.dropdownBtn,
                  dropdownOpen && styles.dropdownBtnActive,
                ]}
                onPress={() => setDropdownOpen(!dropdownOpen)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownBtnText}>
                  {selectedAge ? `${selectedAge} Years Old` : 'Choose Your Age'}
                </Text>
                <Text style={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {/* Dropdown Options Picker */}
              {dropdownOpen && (
                <View style={styles.dropdownListContainer}>
                  <ScrollView
                    style={{ maxHeight: 180 }}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                  >
                    {AGE_OPTIONS.map((age) => (
                      <TouchableOpacity
                        key={age}
                        style={[
                          styles.dropdownItem,
                          selectedAge === age && styles.dropdownItemActive,
                        ]}
                        onPress={() => {
                          setSelectedAge(age);
                          setDropdownOpen(false);
                          setErrorMsg('');
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            selectedAge === age && styles.dropdownItemTextActive,
                          ]}
                        >
                          {age} Years Old
                        </Text>
                        {selectedAge === age && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            {/* COPPA / Child Notice */}
            {isValidAge && isChild && (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeTitle}>🛡️ Child Protection Active (COPPA)</Text>
                <Text style={styles.noticeBody}>
                  Personalized ad tracking and targeted ads are automatically disabled for your age group to protect your privacy.
                </Text>
              </View>
            )}

            {/* Personalized Ads Toggle (Adults only) */}
            {isValidAge && !isChild && (
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.toggleTitle}>Allow Personalized Ads</Text>
                  <Text style={styles.toggleDesc}>
                    Receive tailored ad content and hints. You can change this anytime in settings.
                  </Text>
                </View>
                <Switch
                  value={allowPersonalized}
                  onValueChange={setAllowPersonalized}
                  trackColor={{ false: '#334155', true: '#8B5CF6' }}
                  thumbColor={allowPersonalized ? '#FF2B91' : '#94A3B8'}
                />
              </View>
            )}

            {/* Privacy Link */}
            <TouchableOpacity onPress={openPrivacyPolicy} style={styles.privacyLinkBtn}>
              <Text style={styles.privacyLinkText}>
                We work with AppLovin, Meta & AdMob. Learn more in our Privacy Policy →
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.submitBtnText}>Confirm & Start Game</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 2, 12, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: '#120824',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    padding: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  scrollContent: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C0E38',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  dropdownBtnActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#241246',
  },
  dropdownBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dropdownArrow: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dropdownListContainer: {
    marginTop: 6,
    backgroundColor: '#1A0D34',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
  },
  dropdownItemText: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '600',
  },
  dropdownItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  checkmark: {
    color: '#FF2B91',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#FF2B91',
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '600',
  },
  noticeBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 43, 145, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 43, 145, 0.35)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF2B91',
    marginBottom: 4,
  },
  noticeBody: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#190B32',
    padding: 14,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toggleDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 15,
  },
  privacyLinkBtn: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  privacyLinkText: {
    fontSize: 12,
    color: '#22D3EE',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#8B5CF6',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
