// Create a new file hooks/useScreenOrientation.ts
import * as NavigationBar from "expo-navigation-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect } from "react";

export function useScreenOrientation() {
    useEffect(() => {
        let isMounted = true;
        let subscription: ScreenOrientation.Subscription | null = null;

        const checkOrientation = async () => {
            try {
                const orientation =
                    await ScreenOrientation.getOrientationAsync();
                const isLandscape =
                    orientation ===
                        ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
                    orientation ===
                        ScreenOrientation.Orientation.LANDSCAPE_RIGHT;

                if (isMounted) {
                    await NavigationBar.setVisibilityAsync(
                        isLandscape ? "hidden" : "visible"
                    );
                }
            } catch (error) {
                console.warn("Orientation check failed:", error);
            }
        };

        const setup = async () => {
            await checkOrientation();
            subscription =
                ScreenOrientation.addOrientationChangeListener(
                    checkOrientation
                );
        };

        setup();

        return () => {
            isMounted = false;
            if (subscription) {
                ScreenOrientation.removeOrientationChangeListener(subscription);
            }
        };
    }, []);
}
