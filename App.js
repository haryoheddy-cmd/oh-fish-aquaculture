import { useEffect, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { House, Fish, Wallet, Warehouse, User, Lightbulb } from 'lucide-react-native';

import { initDatabase } from './src/db/schema';
import { COLORS } from './src/theme';
import HomeScreen from './src/screens/HomeScreen';
import KolamScreen from './src/screens/KolamScreen';
import KeuanganScreen from './src/screens/KeuanganScreen';
import VendorStokScreen from './src/screens/VendorStokScreen';
import TipsScreen from './src/screens/TipsScreen';
import ProfilScreen from './src/screens/ProfilScreen';
import QuickAddFab from './src/components/QuickAddFab';

const Tab = createBottomTabNavigator();

// Splash screen ditampilkan minimal sekian lama supaya credit di bawahnya
// sempat terbaca, meski initDatabase() sering selesai nyaris instan
// (terutama setelah database pernah diinisialisasi sebelumnya di sesi JS yang sama).
const MIN_SPLASH_DURATION_MS = 1200;

// Harus sama dengan expo.plugins["expo-splash-screen"].backgroundColor di app.json,
// supaya transisi dari splash native ke layar loading JS ini terlihat menyatu (tanpa "kedip" warna).
const SPLASH_BACKGROUND_COLOR = '#1E90FF';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    const startedAt = Date.now();
    initDatabase()
      .then(() => {
        const sisaWaktu = Math.max(MIN_SPLASH_DURATION_MS - (Date.now() - startedAt), 0);
        setTimeout(() => setIsDbReady(true), sisaWaktu);
      })
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
  return (
    <View style={styles.splashScreen}>
      <Image source={require('./assets/icon.png')} style={styles.splashLogo} resizeMode="contain" />
      <View style={styles.creditContainer}>
        <Text style={styles.creditDeveloper}>Developed by Haryo Heddy Nugroho</Text>
        <Text style={styles.creditTagline}>Smart Aquaculture Solution</Text>
        <Text style={styles.creditVersion}>v1.0.0</Text>
      </View>
      <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.7)" style={styles.splashSpinner} />
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
            name="Tips"
            component={TipsScreen}
            options={{ tabBarIcon: ({ color, size }) => <Lightbulb color={color} size={size} /> }}
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
  splashScreen: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  splashLogo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  splashSpinner: {
    marginTop: 28,
  },
  creditContainer: {
    alignItems: 'center',
  },
  creditDeveloper: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  creditTagline: {
    fontSize: 11,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.85)',
    marginVertical: 2,
  },
  creditVersion: {
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
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
