import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { TouchableOpacity, View } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { FullscreenProvider } from "../hooks/FullScreenContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
TouchableOpacity.defaultProps = {
    ...TouchableOpacity.defaultProps,
    activeOpacity: 0.8,
};
export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [loaded] = useFonts({
        Exo2Regular: require("../assets/fonts/Exo2-Regular.ttf"),
        Exo2Medium: require("../assets/fonts/Exo2-Medium.ttf"),
        Exo2SemiBold: require("../assets/fonts/Exo2-SemiBold.ttf"),
        Exo2Bold: require("../assets/fonts/Exo2-Bold.ttf"),
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <FullscreenProvider>
            <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
                <PaperProvider>
                    <View style={{ flex: 1 }}>
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen
                                name="(tabs)"
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen name="+not-found" />
                        </Stack>
                    </View>
                </PaperProvider>
                <StatusBar style="auto" />
            </ThemeProvider>
        </FullscreenProvider>
    );
}
