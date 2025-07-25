import { apiConfig } from "@/AxiosConfig";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { SIZE } from "@/constants/Constants";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useScreenOrientation } from "@/hooks/useScreenOrientation";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import LottieView from "lottie-react-native";
import { useEffect } from "react";
import { Platform, SafeAreaView, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { FullscreenProvider } from "../hooks/FullScreenContext";
import useNetworkState from "../hooks/NetworkState";
import { AnimeHistoryProvider } from "../store/AnimeHistoryContext";
import { store } from "../store/store";

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
    useScreenOrientation();

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    if (!isConnected) {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        if (Platform.OS === "android") {
            NavigationBar.setVisibilityAsync("visible");
        }
        return (
            <SafeAreaView
                style={{
                    flex: 1,
                    justifyContent: "center",
                    backgroundColor: Colors.dark.background,
                }}
            >
                <LottieView
                    source={require("../assets/lottie/offline.json")}
                    autoPlay
                    loop
                    style={{
                        width: SIZE(200),
                        height: SIZE(200),
                        alignSelf: "center",
                    }}
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
            <GestureHandlerRootView>
                <AnimeHistoryProvider>
                    <FullscreenProvider>
                        <ThemeProvider
                            value={
                                colorScheme === "dark"
                                    ? DarkTheme
                                    : DefaultTheme
                            }
                        >
                            <PaperProvider>
                                <SafeAreaProvider>
                                    <StatusBar style="auto" />
                                    <View
                                        style={{
                                            backgroundColor:
                                                Colors.dark.background,
                                            flex: 1,
                                        }}
                                    >
                                        <Stack
                                            screenOptions={{
                                                headerShown: false,
                                            }}
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
            </GestureHandlerRootView>
        </Provider>
    );
}
