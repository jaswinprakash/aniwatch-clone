import { Text, type TextProps, StyleSheet } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";
import { SIZE } from "@/constants/Constants";
export type ThemedTextProps = TextProps & {
    lightColor?: string;
    darkColor?: string;
    type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
    style,
    lightColor,
    darkColor,
    type = "default",
    ...rest
}: ThemedTextProps) {
    const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

    return (
        <Text
            style={[
                { color },
                type === "default" ? styles.default : undefined,
                type === "title" ? styles.title : undefined,
                type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
                type === "subtitle" ? styles.subtitle : undefined,
                type === "link" ? styles.link : undefined,
                style,
            ]}
            {...rest}
        />
    );
}

const styles = StyleSheet.create({
    default: {
        fontSize: SIZE(16),
        lineHeight: SIZE(24),
        fontFamily: "Exo2Regular",
    },
    defaultSemiBold: {
        fontSize: SIZE(16),
        lineHeight: SIZE(24),
        fontFamily: "Exo2SemiBold",
    },
    title: {
        fontSize: SIZE(32),
        lineHeight: SIZE(32),
        fontFamily: "Exo2Bold",
    },
    subtitle: {
        fontSize: SIZE(20),
        fontFamily: "Exo2Bold",
    },
    link: {
        lineHeight: SIZE(30),
        fontSize: SIZE(16),
        fontFamily: "Exo2Regular",
        color: "#0a7ea4",
    },
});
