// import { DeviceMotion } from "expo-sensors";
// import { useEffect } from "react";

// // Add this hook to your component
// const useDeviceOrientation = (toggleFullScreen) => {
//     useEffect(() => {
//         let subscription;

//         // const handleOrientationChange = ({ rotation }) => {
//         //     const { gamma } = rotation; // gamma represents the left-to-right tilt
//         //     if (gamma > 0.5 || gamma < -0.5) {
//         //         // Device is in landscape mode
//         //         toggleFullScreen(true);
//         //     } else {
//         //         // Device is in portrait mode
//         //         toggleFullScreen(false);
//         //     }
//         // };

//         const handleOrientationChange = ({ rotation }) => {
//             if (!rotation) return; // Safeguard against undefined rotation

//             const { gamma } = rotation; // gamma represents the left-to-right tilt
//             if (gamma === undefined) return; // Safeguard against undefined gamma

//             if (gamma > 0.5 || gamma < -0.5) {
//                 // Device is in landscape mode
//                 toggleFullScreen(true);
//             } else {
//                 // Device is in portrait mode
//                 toggleFullScreen(false);
//             }
//         };

//         // Start listening to device motion
//         DeviceMotion.setUpdateInterval(500); // Check orientation every 500ms
//         subscription = DeviceMotion.addListener(handleOrientationChange);

//         // Cleanup listener on unmount
//         return () => {
//             if (subscription) {
//                 subscription.remove();
//             }
//         };
//     }, [toggleFullScreen]);
// };

// export default useDeviceOrientation;

import { DeviceMotion } from "expo-sensors";
import { useEffect } from "react";

const useDeviceOrientation = (toggleFullScreen2) => {
    useEffect(() => {
        let subscription;

        const handleOrientationChange = ({ rotation }) => {
            if (!rotation) return; // Safeguard against undefined rotation

            const { gamma } = rotation; // gamma represents the left-to-right tilt
            if (gamma === undefined) return; // Safeguard against undefined gamma

            if (gamma > 0.5 || gamma < -0.5) {
                // Device is in landscape mode
                toggleFullScreen2(true);
            } else {
                // Device is in portrait mode
                toggleFullScreen2(false);
            }
        };

        // Start listening to device motion
        DeviceMotion.setUpdateInterval(500); // Check orientation every 500ms
        subscription = DeviceMotion.addListener(handleOrientationChange);

        // Cleanup listener on unmount
        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, [toggleFullScreen2]);
};

export default useDeviceOrientation;
