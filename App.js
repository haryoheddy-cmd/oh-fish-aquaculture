import { useEffect, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { House, Fish, Wallet, Warehouse, User } from 'lucide-react-native';

import { initDatabase } from './src/db/schema';
import { COLORS } from './src/theme';
import HomeScreen from './src/screens/HomeScreen';
import KolamScreen from './src/screens/KolamScreen';
import KeuanganScreen from './src/screens/KeuanganScreen';
import VendorStokScreen from './src/screens/VendorStokScreen';
import ProfilScreen from './src/screens/ProfilScreen';
import QuickAddFab from './src/components/QuickAddFab';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    initDatabase()
      .then(() => setIsDbReady(true))
      .catch((error) => setDbError(error));
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {dbError ? <ErrorScreen message={dbError.message} /> : !isDbReady ? <SplashScreen /> : <AppShell />}
    </SafeAreaProvider>
  );
}

function SplashScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={[styles.splashCredit, { bottom: insets.bottom + 24 }]}>Designed & Developed by Haryo Heddy N.</Text>
    </View>
  );
}

function ErrorScreen({ message }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Gagal menyiapkan database: {message}</Text>
    </View>
  );
}

function AppShell() {
  const insets = useSafeAreaInsets();
  const navigationRef = useNavigationContainerRef();
  const [currentRouteName, setCurrentRouteName] = useState(null);

  const updateCurrentRoute = () => {
    setCurrentRouteName(navigationRef.current?.getCurrentRoute()?.name ?? null);
  };

  return (
    <View style={styles.appRoot}>
      <NavigationContainer ref={navigationRef} onReady={updateCurrentRoute} onStateChange={updateCurrentRoute}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.muted,
            tabBarStyle: [styles.tabBar, { height: 64 + insets.bottom, paddingBottom: 10 + insets.bottom }],
            tabBarLabelStyle: styles.tabBarLabel,
          }}
        >
          <Tab.Screen
            name="Beranda"
            component={HomeScreen}
            options={{ tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }}
          />
          <Tab.Screen
            name="Kolam & Pakan"
            component={KolamScreen}
            options={{ tabBarIcon: ({ color, size }) => <Fish color={color} size={size} /> }}
          />
          <Tab.Screen
            name="Keuangan"
            component={KeuanganScreen}
            options={{ tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }}
          />
          <Tab.Screen
            name="Stok & Vendor"
            component={VendorStokScreen}
            options={{ tabBarIcon: ({ color, size }) => <Warehouse color={color} size={size} /> }}
          />
          <Tab.Screen
            name="Profil"
            component={ProfilScreen}
            options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      {currentRouteName !== 'Profil' ? <QuickAddFab /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
  },
  splashCredit: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.muted,
    opacity: 0.6,
  },
  tabBar: {
    height: 64,
    paddingBottom: 10,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
