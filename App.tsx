import React, { useEffect } from "react";
import { AppState } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import RemoteConfigService from './src/services/RemoteConfigService';
import notificationService from './src/services/NotificationServices';

export default function App() {
  useEffect(() => {
    // ✅ Initialize Remote Config
    RemoteConfigService.init();

    // ✅ Initialize OneSignal
    notificationService.initialize(
      '10bd33b0-498e-44e6-8008-e1e1ae5b35a2'
    );

    // ✅ (Optional) App state tracking
    const handleAppStateChange = (state: any) => {
      console.log("App State:", state);
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  return <AppNavigator />;
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