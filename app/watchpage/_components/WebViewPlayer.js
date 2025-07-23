import { StyleSheet, View, BackHandler, Platform } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useThrottledPlayback } from "../../../store/useThrottledPlayback";
import { useAnimeHistory } from "../../../store/AnimeHistoryContext";
import WebView from "react-native-webview";
import { SIZE } from "../../../constants/Constants";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { useFullscreen } from "../../../hooks/FullScreenContext";
import { useKeepAwake } from "expo-keep-awake";
import PlayerLoader from "./PlayerLoader";

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
}) => {
    const throttledUpdate = useThrottledPlayback();
    const history = useAnimeHistory();
    const [currentTime, setCurrentTime] = useState(0);
    const webViewRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const wasPlayingRef = useRef(false);
    const { setIsFullscreenContext } = useFullscreen();

    useKeepAwake(isFullscreen ? "fullscreen-video" : undefined);
    useEffect(() => {
        const animeData = history.find(
            (item) =>
                item.animeId === route?.params?.id &&
                item.episodeNumber === selectedEpisode
        );
        setCurrentTime(animeData ? animeData.currentTime : 0);
    }, [route?.params?.id, selectedEpisode]);

    useEffect(() => {
        const backAction = () => {
            if (isFullscreen) {
                webViewRef.current.injectJavaScript(`
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                    true; // Return true to prevent default back behavior
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

    const onEnterFullscreen = () => {
        setIsFullscreenContext(true);
        setIsFullscreen(true);
        ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.LANDSCAPE
        );
    };

    const onExitFullscreen = () => {
        setIsFullscreenContext(false);
        setIsFullscreen(false);
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        if (wasPlayingRef.current) {
            setTimeout(() => {
                webViewRef.current.injectJavaScript(`
                    var video = document.querySelector('video');
                    if (video) {
                        video.play();
                    }
                    true;
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
            startStream(nextEpisode.episodeId, nextEpisode.number);
        } else {
            console.log("No next episode available.");
        }
    };

    const INJECTED_JAVASCRIPT = `
      (function() {
          var video = document.querySelector('video');
          if (!video) return;
          
          // Set initial time
          var initialTime = ${currentTime};
          var setTime = function() { video.currentTime = initialTime; };
          if (video.readyState >= 1) { // HAVE_METADATA
            setTime();
          } else {
            video.addEventListener('loadedmetadata', setTime);
          }

          // Report time updates
          setInterval(function() {
              if (video) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'timeupdate',
                      currentTime: video.currentTime,
                      isPlaying: !video.paused,
                  }));
              }
          }, 1000);

          // Report when video ends
          video.addEventListener('ended', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ended' }));
          });

          // Report fullscreen changes
          document.addEventListener('fullscreenchange', function() {
              var isFullscreenNow = !!document.fullscreenElement;
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                  type: 'fullscreen', 
                  isFullscreen: isFullscreenNow 
              }));
          });
      })();
    `;

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
                        javaScriptEnabled
                        domStorageEnabled
                        allowsFullscreenVideo
                        mediaPlaybackRequiresUserAction={false}
                        injectedJavaScript={INJECTED_JAVASCRIPT}
                        onMessage={(event) => {
                            try {
                                const data = JSON.parse(event.nativeEvent.data);
                                switch (data.type) {
                                    case "timeupdate":
                                        wasPlayingRef.current = data.isPlaying;
                                        throttledUpdate(
                                            route?.params?.id,
                                            selectedEpisode,
                                            data.currentTime
                                        );
                                        break;
                                    case "ended":
                                        nextEpisode();
                                        break;
                                    case "fullscreen":
                                        if (data.isFullscreen) {
                                            onEnterFullscreen();
                                        } else {
                                            webViewRef.current
                                                .injectJavaScript(`
                                            var video = document.querySelector('video');
                                            if (video) video.pause();
                                            true;
                                        `);

                                            onExitFullscreen();
                                        }
                                        break;
                                }
                            } catch (error) {
                                console.error(
                                    "Error parsing message from WebView:",
                                    error
                                );
                            }
                        }}
                        // onNavigationStateChange={(webViewState) => {
                        //     if (
                        //         webViewState.url.includes("https://megaplay.buzz")
                        //     ) {
                        //         webViewRef.current.injectJavaScript(`
                        //             var video = document.querySelector('video');
                        //             if (video) video.pause();
                        //             true;
                        //         `);
                        //     }
                        // }}
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
