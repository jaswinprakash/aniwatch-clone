import * as Network from "expo-network";
import { useEffect, useState } from "react";

const useNetworkState = () => {
    const [isConnected, setIsConnected] = useState(null);

    useEffect(() => {
        // Function to fetch initial network state
        const fetchNetworkState = async () => {
            try {
                const state = await Network.getNetworkStateAsync();
                setIsConnected(state.isConnected);
                // console.log("Initial Network State:", state);
            } catch (error) {
                console.error("Error fetching network state:", error);
            }
        };

        // Listener for network state changes
        const subscription = Network.addNetworkStateListener((state) => {
            // console.log(
            //     `Network type: ${state.type}, Connected: ${state.isConnected}, Internet Reachable: ${state.isInternetReachable}`
            // );
            setIsConnected(state.isConnected);
        });

        fetchNetworkState();

        // Cleanup function to remove listener
        return () => {
            subscription.remove();
        };
    }, []);

    return isConnected;
};

export default useNetworkState;
