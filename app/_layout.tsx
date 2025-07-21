import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaView, TouchableOpacity, View } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { FullscreenProvider } from "../hooks/FullScreenContext";
import { Provider } from "react-redux";
import { store } from "../store/store";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AnimeHistoryProvider } from "../store/AnimeHistoryContext";
import { apiConfig } from "@/AxiosConfig";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import useNetworkState from "../hooks/NetworkState";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SIZE } from "@/constants/Constants";
import * as NavigationBar from "expo-navigation-bar";
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
TouchableOpacity.defaultProps = {
    ...TouchableOpacity.defaultProps,
    activeOpacity: 0.8,
};
export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [loaded] = useFonts({
        Exo2Regular: require("../assets/fonts/RobotoCondensed-Regular.ttf"),
        Exo2Medium: require("../assets/fonts/RobotoCondensed-Medium.ttf"),
        Exo2SemiBold: require("../assets/fonts/RobotoCondensed-SemiBold.ttf"),
        Exo2Bold: require("../assets/fonts/RobotoCondensed-Bold.ttf"),
    });
    const isConnected = useNetworkState();

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
            NavigationBar.setBackgroundColorAsync(Colors.dark.background);
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    if (!isConnected) {
        return (
            <SafeAreaView
                style={{
                    flex: 1,
                    justifyContent: "center",
                    backgroundColor: Colors.dark.background,
                }}
            >
                <MaterialCommunityIcons
                    name="wifi-off"
                    size={SIZE(100)}
                    color={Colors.light.tabIconSelected}
                    style={{ alignSelf: "center" }}
                />
                <ThemedText
                    style={{
                        textAlign: "center",
                        color: Colors.light.tabIconSelected,
                    }}
                    type="title"
                >
                    Check your internet connection
                </ThemedText>
            </SafeAreaView>
        );
    }

    apiConfig.interceptors.request.use(
        (response) => {
            return response;
        },
        (error) => {
            console.log(error, "error - main axios");
            if (error == "[AxiosError: Network Error]") {
                return (
                    <SafeAreaView
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            backgroundColor: Colors.dark.background,
                        }}
                    >
                        <MaterialCommunityIcons
                            name="server-network-off"
                            size={SIZE(100)}
                            color={Colors.light.tabIconSelected}
                            style={{ alignSelf: "center" }}
                        />
                        <ThemedText
                            style={{
                                textAlign: "center",
                                color: Colors.light.tabIconSelected,
                            }}
                            type="title"
                        >
                            Server Error
                        </ThemedText>
                    </SafeAreaView>
                );
            }
            return Promise.reject(error);
        }
    );

    return (
        <Provider store={store}>
            <AnimeHistoryProvider>
                <FullscreenProvider>
                    <ThemeProvider
                        value={
                            colorScheme === "dark" ? DarkTheme : DefaultTheme
                        }
                    >
                        <PaperProvider>
                            <SafeAreaProvider>
                                <View style={{ flex: 1 }}>
                                    <Stack
                                        screenOptions={{ headerShown: false }}
                                    >
                                        <Stack.Screen
                                            name="(tabs)"
                                            options={{ headerShown: false }}
                                        />
                                        <Stack.Screen name="+not-found" />
                                    </Stack>
                                </View>
                            </SafeAreaProvider>
                        </PaperProvider>
                    </ThemeProvider>
                </FullscreenProvider>
            </AnimeHistoryProvider>
        </Provider>
    );
}
