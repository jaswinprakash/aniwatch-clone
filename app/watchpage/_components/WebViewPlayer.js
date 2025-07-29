import { useKeepAwake } from "expo-keep-awake";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import { BackHandler, Platform, StyleSheet, View } from "react-native";
import WebView from "react-native-webview";
import { Colors } from "react-native/Libraries/NewAppScreen";
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
    const latestValuesRef = useRef({
        animeId: null,
        selectedEpisode: null,
        currentTime: null,
        selectedEpisodeId: null,
        selectedEpisodeName: null,
    });

    useKeepAwake(isFullscreen ? "fullscreen-video" : undefined);

    useEffect(() => {
        const animeData = history.find(
            (item) =>
                item.animeId === route?.params?.id &&
                item.episodeNumber === selectedEpisode
        );
        const newCurrentTime = animeData ? animeData.currentTime : 0;
        setCurrentTime(newCurrentTime);
        timeSetRef.current = false; // Reset flag when episode changes
    }, [route?.params?.id, selectedEpisode, history]);

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
        };
    }, []);
    const onEnterFullscreen = () => {
        setIsFullscreenContext(true);
        setIsFullscreen(true);
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
    };

    const onExitFullscreen = () => {
        setIsFullscreenContext(false);
        setIsFullscreen(false);
        ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT_UP
        );

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
    };

    const nextEpisode = () => {
        const nextEpisode = episodes.find(
            (episode) => episode.number === selectedEpisode + 1
        );
        if (nextEpisode) {
            setSelectedEpisode(nextEpisode.number);
            setSelectedEpisodeName(nextEpisode.title);
            startStream(nextEpisode.episodeId, nextEpisode.number);
        }
    };

    const handleLoad = (request) => {
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
    };

    const handleWebViewLoad = () => {
        setWebViewLoaded(true);
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            webViewRef.current?.injectJavaScript(getInjectedJavaScript());
        }, 1000);
    };

    const getInjectedJavaScript = () => {
        const baseScript = `
            (function() {
                console.log('Injecting JavaScript...');
                
                // Find video element with retry mechanism
                function findVideo(attempts = 0) {
                    var video = document.querySelector('video');
                    if (video) {
                        window.videoElement = video;
                        setupVideoHandlers();
                        return;
                    }
                    
                    if (attempts < 20) {
                        setTimeout(function() {
                            findVideo(attempts + 1);
                        }, 500);
                    }
                }
                
                function setupVideoHandlers() {
                    if (!window.videoElement) return;
                    
                    console.log('Video element found, setting up handlers');
                    
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
                                    window.videoElement.play().catch(function(e) {
                                        console.log('Auto-play error:', e);
                                    });
                                }, 500);
                            }
                        }
                    }
                    
                    // Set initial time when metadata is loaded
                    if (window.videoElement.readyState >= 1) {
                        setInitialTime();
                    } else {
                        window.videoElement.addEventListener('loadedmetadata', setInitialTime);
                        window.videoElement.addEventListener('canplay', setInitialTime);
                    }
                    
                    // Time update reporting with throttling
                    var lastReportedTime = 0;
                    var reportInterval = setInterval(function() {
                        if (window.videoElement && Math.abs(window.videoElement.currentTime - lastReportedTime) > 0.5) {
                            lastReportedTime = window.videoElement.currentTime;
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
                    }, 1000);
                    
                    // Video ended event
                    window.videoElement.addEventListener('ended', function() {
                        try {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'ended'
                            }));
                        } catch (e) {
                            console.log('Ended message error:', e);
                        }
                    });
                    
                    // Play/pause tracking
                    window.videoElement.addEventListener('play', function() {
                        console.log('Video playing');
                    });
                    
                    window.videoElement.addEventListener('pause', function() {
                        console.log('Video paused');
                    });
                    
                    // Error handling
                    window.videoElement.addEventListener('error', function(e) {
                        console.log('Video error:', e);
                    });
                }
                
                // Platform-specific fullscreen handling
                ${
                    Platform.OS === "android"
                        ? `
                    // Android fullscreen handling
                    document.addEventListener('fullscreenchange', function() {
                        var isFullscreenNow = !!document.fullscreenElement;
                        console.log('Fullscreen change:', isFullscreenNow);
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
                    // iOS fullscreen handling
                    function setupIOSFullscreen() {
                        if (!window.videoElement) return;
                        
                        window.videoElement.addEventListener('webkitbeginfullscreen', function() {
                            console.log('iOS fullscreen begin');
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
                            console.log('iOS fullscreen end');
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
                    
                    // Setup iOS fullscreen after video is found
                    var originalSetupVideoHandlers = setupVideoHandlers;
                    setupVideoHandlers = function() {
                        originalSetupVideoHandlers();
                        setupIOSFullscreen();
                    };
                `
                }
                
                // Start finding video
                findVideo();
                
                return true;
            })();
        `;

        return baseScript;
    };

    const handleMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log("WebView message:", data);

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
                    break;
                case "ended":
                    console.log("Video ended, moving to next episode");
                    nextEpisode();
                    break;
                case "fullscreen":
                    console.log("Fullscreen state changed:", data.isFullscreen);
                    if (data.isFullscreen) {
                        onEnterFullscreen();
                    } else {
                        onExitFullscreen();
                    }
                    break;
            }
        } catch (error) {
            console.error("Error parsing message from WebView:", error);
        }
    };

    return (
        <View
            style={isFullscreen ? styles.fullscreenContainer : styles.container}
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
                                "User-Agent":
                                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
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
                        onError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.warn("WebView error:", nativeEvent);
                        }}
                        onHttpError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.warn("HTTP error:", nativeEvent);
                        }}
                        onLoadStart={() => {
                            console.log("WebView load started");
                            setWebViewLoaded(false);
                            timeSetRef.current = false;
                        }}
                        onLoadEnd={() => {
                            console.log("WebView load ended");
                        }}
                        // iOS specific props for better video handling
                        {...(Platform.OS === "ios" && {
                            scrollEnabled: false,
                            bounces: false,
                            allowsBackForwardNavigationGestures: false,
                        })}
                    />
                )
            )}
        </View>
    );
};

export default React.memo(WebViewPlayer);

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
