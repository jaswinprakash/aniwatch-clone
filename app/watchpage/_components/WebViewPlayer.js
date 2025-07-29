import { useKeepAwake } from "expo-keep-awake";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    BackHandler,
    Platform,
    StyleSheet,
    View,
    AppState,
} from "react-native";
import WebView from "react-native-webview";
import { Colors } from "react-native/Libraries/NewAppScreen";
// import NetInfo from "@react-native-community/netinfo";
import { SIZE } from "../../../constants/Constants";
import { useFullscreen } from "../../../hooks/FullScreenContext";
import { useAnimeHistory } from "../../../store/AnimeHistoryContext";
import { useThrottledPlayback } from "../../../store/useThrottledPlayback";
import PlayerLoader from "./PlayerLoader";
import { useManualPlaybackSave } from "../../../lib/playBackUtils";

const WebViewPlayer = ({
    route,
    episodes,
    selectedEpisode,
    setSelectedEpisode,
    startStream,
    idForWebview,
    activeTab,
    uri,
    videoLoading,
    error,
    episodeLoading,
    selectedEpisodeId,
    setSelectedEpisodeName,
    selectedEpisodeName,
}) => {
    const throttledUpdate = useThrottledPlayback();
    const saveToDatabase = useManualPlaybackSave();
    const history = useAnimeHistory();
    const [currentTime, setCurrentTime] = useState(0);
    const webViewRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [webViewLoaded, setWebViewLoaded] = useState(false);
    const wasPlayingRef = useRef(false);
    const timeSetRef = useRef(false);
    const { setIsFullscreenContext } = useFullscreen();
    const [isWifi, setIsWifi] = useState(true);
    const [isUserActive, setIsUserActive] = useState(true);
    const orientationLock = useRef(null);
    const lastInteractionRef = useRef(Date.now());

    const latestValuesRef = useRef({
        animeId: null,
        selectedEpisode: null,
        currentTime: null,
        selectedEpisodeId: null,
        selectedEpisodeName: null,
    });

    // Network awareness
    // useEffect(() => {
    //     const unsubscribe = NetInfo.addEventListener((state) => {
    //         setIsWifi(state.isConnected && state.isWifiEnabled);
    //     });
    //     return () => unsubscribe();
    // }, []);

    // Keep awake only when needed
    useKeepAwake(
        isFullscreen && wasPlayingRef.current ? "fullscreen-video" : undefined
    );

    // History and time restoration
    useEffect(() => {
        const animeData = history.find(
            (item) =>
                item.animeId === route?.params?.id &&
                item.episodeNumber === selectedEpisode
        );
        const newCurrentTime = animeData ? animeData.currentTime : 0;
        setCurrentTime(newCurrentTime);
        timeSetRef.current = false;
    }, [route?.params?.id, selectedEpisode, history]);

    // Back handler
    useEffect(() => {
        const backAction = () => {
            if (isFullscreen) {
                webViewRef.current?.injectJavaScript(`
                    (function() {
                        try {
                            if (document.fullscreenElement) {
                                document.exitFullscreen();
                            } else if (window.videoElement && window.videoElement.webkitDisplayingFullscreen) {
                                window.videoElement.webkitExitFullscreen();
                            }
                        } catch (e) {
                            console.log('Exit fullscreen error:', e);
                        }
                        return true;
                    })();
                `);
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [isFullscreen]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            const {
                animeId,
                selectedEpisode,
                currentTime,
                selectedEpisodeId,
                selectedEpisodeName,
            } = latestValuesRef.current;

            if (
                animeId &&
                selectedEpisode &&
                currentTime &&
                selectedEpisodeId &&
                selectedEpisodeName
            ) {
                saveToDatabase(
                    animeId,
                    selectedEpisode,
                    currentTime,
                    selectedEpisodeId,
                    selectedEpisodeName
                );
            }

            if (orientationLock.current) {
                ScreenOrientation.unlockAsync();
            }
        };
    }, []);

    // App state changes
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === "background") {
                webViewRef.current?.injectJavaScript(`
                    if (window.videoElement && !window.videoElement.paused) {
                        window.videoElement.pause();
                    }
                `);
            } else if (nextAppState === "active") {
                setIsUserActive(true);
                lastInteractionRef.current = Date.now();
            }
        };

        const sub = AppState.addEventListener("change", handleAppStateChange);
        return () => sub.remove();
    }, []);

    // User activity timeout
    useEffect(() => {
        const activityCheckInterval = setInterval(() => {
            if (
                isFullscreen &&
                Date.now() - lastInteractionRef.current > 30000
            ) {
                setIsUserActive(false);
            }
        }, 10000);

        return () => clearInterval(activityCheckInterval);
    }, [isFullscreen]);

    // CPU throttling when inactive
    useEffect(() => {
        if (!isUserActive && isFullscreen) {
            webViewRef.current?.injectJavaScript(`
                if (window.videoElement) {
                    window.videoElement.playbackRate = 0.8;
                }
            `);
        } else {
            webViewRef.current?.injectJavaScript(`
                if (window.videoElement) {
                    window.videoElement.playbackRate = 1.0;
                }
            `);
        }
    }, [isUserActive, isFullscreen]);

    const handleUserInteraction = useCallback(() => {
        setIsUserActive(true);
        lastInteractionRef.current = Date.now();
    }, []);

    const onEnterFullscreen = useCallback(() => {
        setIsFullscreenContext(true);
        setIsFullscreen(true);
        handleUserInteraction();

        if (Platform.OS === "ios") {
            ScreenOrientation.unlockAsync();
            ScreenOrientation.lockAsync(
                ScreenOrientation.OrientationLock.LANDSCAPE
            );
        } else {
            ScreenOrientation.lockAsync(
                ScreenOrientation.OrientationLock.LANDSCAPE
            );
        }
        orientationLock.current = true;
    }, []);

    const onExitFullscreen = useCallback(() => {
        setIsFullscreenContext(false);
        setIsFullscreen(false);
        ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
        orientationLock.current = false;

        if (wasPlayingRef.current) {
            setTimeout(() => {
                webViewRef.current?.injectJavaScript(`
                    (function() {
                        try {
                            if (window.videoElement && window.videoElement.paused) {
                                window.videoElement.play().catch(e => console.log('Resume play error:', e));
                            }
                        } catch (e) {
                            console.log('Resume error:', e);
                        }
                        return true;
                    })();
                `);
            }, 500);
        }
    }, []);

    const nextEpisode = useCallback(() => {
        const nextEpisode = episodes.find(
            (episode) => episode.number === selectedEpisode + 1
        );
        if (nextEpisode) {
            setSelectedEpisode(nextEpisode.number);
            setSelectedEpisodeName(nextEpisode.title);
            startStream(nextEpisode.episodeId, nextEpisode.number);
        }
    }, [episodes, selectedEpisode]);

    const handleLoad = useCallback(
        (request) => {
            if (
                request.url.includes(
                    `https://megaplay.buzz/stream/s-2/${idForWebview}/${activeTab}`
                )
            ) {
                return true;
            }

            WebBrowser.openBrowserAsync(request.url, {
                toolbarColor: Colors.dark.background,
                controlsColor: Colors.dark.tabIconSelected,
                dismissButtonStyle: "close",
            });
            return false;
        },
        [idForWebview, activeTab]
    );

    const getInjectedJavaScript = useCallback(() => {
        return `
            (function() {
                console.log('Injecting optimized JavaScript...');
                
                // Video element finder with single attempt
                function findVideo() {
                    var video = document.querySelector('video');
                    if (video) {
                        window.videoElement = video;
                        setupVideoHandlers();
                        return true;
                    }
                    return false;
                }
                
                function setupVideoHandlers() {
                    if (!window.videoElement || window.videoElement._handlersSetup) return;
                    
                    console.log('Setting up optimized video handlers');
                    
                    // Initial time setup
                    var initialTime = ${currentTime};
                    var timeSet = false;
                    
                    function setInitialTime() {
                        if (timeSet || !window.videoElement) return;
                        
                        if (window.videoElement.readyState >= 1) {
                            console.log('Setting initial time to:', initialTime);
                            window.videoElement.currentTime = initialTime;
                            timeSet = true;
                            
                            if (initialTime > 0) {
                                setTimeout(function() {
                                    window.videoElement.play().catch(console.log);
                                }, 500);
                            }
                        }
                    }
                    
                    // Efficient event listeners
                    var lastUpdate = 0;
                    var updateInterval;
                    
                    function handleTimeUpdate() {
                        var now = Date.now();
                        if (now - lastUpdate > 1000) {
                            lastUpdate = now;
                            try {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'timeupdate',
                                    currentTime: window.videoElement.currentTime,
                                    isPlaying: !window.videoElement.paused,
                                }));
                            } catch (e) {
                                console.log('Message post error:', e);
                            }
                        }
                    }
                    
                    function setupListeners() {
                        if (window.videoElement._handlersSetup) return;
                        
                        window.videoElement.addEventListener('loadedmetadata', setInitialTime);
                        window.videoElement.addEventListener('canplay', setInitialTime);
                        
                        // Throttled timeupdate
                        updateInterval = setInterval(handleTimeUpdate, 1000);
                        
                        window.videoElement.addEventListener('ended', function() {
                            try {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'ended'
                                }));
                            } catch (e) {
                                console.log('Ended message error:', e);
                            }
                        });
                        
                        window.videoElement._handlersSetup = true;
                    }
                    
                    // Cleanup function
                    window.cleanupVideoHandlers = function() {
                        if (window.videoElement && window.videoElement._handlersSetup) {
                            clearInterval(updateInterval);
                            window.videoElement.removeEventListener('loadedmetadata', setInitialTime);
                            window.videoElement.removeEventListener('canplay', setInitialTime);
                            window.videoElement._handlersSetup = false;
                        }
                    };
                    
                    setupListeners();
                    
                    // Initial check
                    setInitialTime();
                }
                
                // Fullscreen handling
                ${
                    Platform.OS === "android"
                        ? `
                document.addEventListener('fullscreenchange', function() {
                    var isFullscreenNow = !!document.fullscreenElement;
                    try {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ 
                            type: 'fullscreen', 
                            isFullscreen: isFullscreenNow 
                        }));
                    } catch (e) {
                        console.log('Fullscreen message error:', e);
                    }
                });
                `
                        : `
                function setupIOSFullscreen() {
                    if (!window.videoElement) return;
                    
                    window.videoElement.addEventListener('webkitbeginfullscreen', function() {
                        try {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'fullscreen',
                                isFullscreen: true
                            }));
                        } catch (e) {
                            console.log('iOS fullscreen begin message error:', e);
                        }
                    });
                    
                    window.videoElement.addEventListener('webkitendfullscreen', function() {
                        try {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'fullscreen',
                                isFullscreen: false
                            }));
                        } catch (e) {
                            console.log('iOS fullscreen end message error:', e);
                        }
                    });
                }
                `
                }
                
                // Initial setup
                if (!findVideo()) {
                    var observer = new MutationObserver(function() {
                        if (findVideo()) {
                            observer.disconnect();
                            ${
                                Platform.OS === "ios"
                                    ? "setupIOSFullscreen();"
                                    : ""
                            }
                        }
                    });
                    
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                } else {
                    ${Platform.OS === "ios" ? "setupIOSFullscreen();" : ""}
                }
                
                return true;
            })();
        `;
    }, [currentTime]);

    const injectedScript = useMemo(
        () => getInjectedJavaScript(),
        [getInjectedJavaScript]
    );

    const handleWebViewLoad = useCallback(() => {
        setWebViewLoaded(true);
        setTimeout(() => {
            webViewRef.current?.injectJavaScript(injectedScript);
        }, 1000);
    }, [injectedScript]);

    const handleMessage = useCallback(
        (event) => {
            try {
                const data = JSON.parse(event.nativeEvent.data);

                switch (data.type) {
                    case "timeupdate":
                        wasPlayingRef.current = data.isPlaying;
                        throttledUpdate(
                            route?.params?.id,
                            selectedEpisode,
                            data.currentTime,
                            selectedEpisodeId,
                            selectedEpisodeName
                        );
                        latestValuesRef.current = {
                            animeId: route?.params?.id,
                            selectedEpisode,
                            currentTime: data.currentTime,
                            selectedEpisodeId,
                            selectedEpisodeName,
                        };
                        handleUserInteraction();
                        break;

                    case "ended":
                        nextEpisode();
                        break;

                    case "fullscreen":
                        if (data.isFullscreen) {
                            onEnterFullscreen();
                        } else {
                            onExitFullscreen();
                        }
                        break;
                }
            } catch (error) {
                console.error("Error parsing message:", error);
            }
        },
        [
            route?.params?.id,
            selectedEpisode,
            selectedEpisodeId,
            selectedEpisodeName,
        ]
    );

    return (
        <View
            style={isFullscreen ? styles.fullscreenContainer : styles.container}
            onTouchStart={handleUserInteraction}
        >
            <StatusBar hidden={isFullscreen} style="auto" />
            {videoLoading ? (
                <PlayerLoader
                    uri={uri}
                    videoLoading={videoLoading}
                    selectedEpisode={selectedEpisode}
                    error={error}
                    episodeLoading={episodeLoading}
                />
            ) : (
                idForWebview &&
                activeTab && (
                    <WebView
                        ref={webViewRef}
                        source={{
                            uri: `https://megaplay.buzz/stream/s-2/${idForWebview}/${activeTab}`,
                            headers: {
                                Referer: "https://megaplay.buzz/",
                                "User-Agent": Platform.select({
                                    ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
                                    android:
                                        "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36",
                                }),
                                ...(!isWifi
                                    ? { "X-Stream-Quality": "480p" }
                                    : {}),
                            },
                        }}
                        style={styles.webview}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsFullscreenVideo={true}
                        allowsInlineMediaPlayback={Platform.OS === "ios"}
                        allowsAirPlayForMediaPlayback={Platform.OS === "ios"}
                        mediaPlaybackRequiresUserAction={false}
                        onLoad={handleWebViewLoad}
                        onMessage={handleMessage}
                        onShouldStartLoadWithRequest={handleLoad}
                        setSupportMultipleWindows={false}
                        cacheEnabled={true}
                        androidLayerType="hardware"
                        overScrollMode="never"
                        androidHardwareAccelerationDisabled={false}
                        renderToHardwareTextureAndroid={true}
                        onError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.warn("WebView error:", nativeEvent);
                        }}
                        onHttpError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.warn("HTTP error:", nativeEvent);
                        }}
                        onLoadStart={() => {
                            setWebViewLoaded(false);
                            timeSetRef.current = false;
                        }}
                        {...(Platform.OS === "ios" && {
                            scrollEnabled: false,
                            bounces: false,
                            allowsBackForwardNavigationGestures: false,
                            decelerationRate: "normal",
                        })}
                    />
                )
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: SIZE(250),
        width: "100%",
        backgroundColor: "#000",
    },
    fullscreenContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#000",
    },
    webview: {
        flex: 1,
        backgroundColor: "#000",
    },
});

export default React.memo(WebViewPlayer);
