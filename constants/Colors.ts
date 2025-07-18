/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#00bfff";
const tintColorDark = "#00bfff";

export const Colors = {
    light: {
        text: "#11181C",
        background: "#fff",
        tint: tintColorLight,
        icon: "#687076",
        tabIconDefault: "#687076",
        tabIconSelected: tintColorLight,
        white: "#fff",
        error: "#f44336",
    },
    dark: {
        text: "#ECEDEE",
        background: "#0a1929",
        tint: tintColorDark,
        icon: "#9BA1A6",
        tabIconDefault: "#9BA1A6",
        tabIconSelected: tintColorDark,
        black: "#000",
        // backgroundPress: "rgba(140, 82, 255, 0.5)",
        backgroundPress: "rgba(0, 187, 255, 0.5)",
        error: "#f44336",
    },
};
