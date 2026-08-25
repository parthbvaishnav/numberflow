import React, { useEffect, useState } from "react";
import { AppState } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import RemoteConfigService from './src/services/RemoteConfigService';
import notificationService from './src/services/NotificationServices';
import ConsentManager from './src/services/ConsentManager';
import AgeGateModal from './src/components/AgeGateModal';
import { ThemeProvider } from './src/constants/theme';

export default function App() {
  const [showAgeGate, setShowAgeGate] = useState(false);

  const checkConsentStatus = async () => {
    await ConsentManager.init();
    if (ConsentManager.isConsentRequired()) {
      setShowAgeGate(true);
    } else {
      setShowAgeGate(false);
    }
  };

  useEffect(() => {
    // ✅ Initialize Consent & Privacy Manager for AppLovin / COPPA compliance
    checkConsentStatus();

    // ✅ Initialize Remote Config
    RemoteConfigService.init();

    // ✅ Initialize OneSignal
    notificationService.initialize(
      '10bd33b0-498e-44e6-8008-e1e1ae5b35a2'
    );

    // ✅ Re-check age consent whenever app returns to active foreground
    const handleAppStateChange = (state: any) => {
      console.log("App State:", state);
      if (state === "active") {
        checkConsentStatus();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <ThemeProvider>
      <AppNavigator />
      <AgeGateModal
        visible={showAgeGate}
        onClose={() => setShowAgeGate(false)}
      />
    </ThemeProvider>
  );
}

// import React from "react";
// import { View, Text } from "react-native";

// export default function App() {
//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <Text>App Working ✅</Text>
//     </View>
//   );
// }