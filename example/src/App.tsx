import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LooksScreen } from './LooksScreen';
import { SignInScreen } from './SignInScreen';
import { useTheme } from './theme';

const TABS = [
  { key: 'sign-in', title: 'Sign in', Screen: SignInScreen },
  { key: 'looks', title: 'Looks', Screen: LooksScreen },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function App() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <Main />
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

function Main() {
  const theme = useTheme();
  const [tab, setTab] = useState<TabKey>('sign-in');
  const Screen = TABS.find((entry) => entry.key === tab)?.Screen ?? SignInScreen;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={[styles.tabs, { borderColor: theme.separator }]}>
        {TABS.map(({ key, title }) => (
          <Pressable
            key={key}
            testID={`tab-${key}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: key === tab }}
            onPress={() => setTab(key)}
            style={styles.tab}
          >
            <Text
              style={[styles.tabText, { color: key === tab ? theme.accent : theme.secondaryText }]}
            >
              {title}
            </Text>
          </Pressable>
        ))}
      </View>
      <Screen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 15, fontWeight: '600' },
});
