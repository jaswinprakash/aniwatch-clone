import React, { useEffect, useState } from "react";
import { View, Text, ViewStyle, TextStyle } from "react-native";
import axios from "axios";
import vttToJson from "vtt-to-json";
const { default: srtParser2 } = require("srt-parser-2");

/**
 * Converts a timestamp string (hh:mm:ss,ms) into seconds
 */
const timeToSeconds = (seconds: string) => {
    const time = seconds.split(":");
    return time[0] && time[1] && time[2]
        ? +time[0] * 60 * 60 + +time[1] * 60 + +time[2]
        : 0;
};

/**
 * Parses subtitle files (SRT/VTT) into an array of subtitle objects
 */
const subtitleParser = async (subtitleUrl: string) => {
    const { data: subtitleData } = await axios.get(subtitleUrl);
    const subtitleType = subtitleUrl.split(".").pop();
    const result: Subtitle[] = [];

    if (subtitleType === "srt") {
        const parser = new srtParser2();
        const parsedSubtitles = parser.fromSrt(subtitleData);
        parsedSubtitles.forEach(({ startTime, endTime, text }) => {
            result.push({
                start: timeToSeconds(startTime.split(",")[0]),
                end: timeToSeconds(endTime.split(",")[0]),
                part: text,
            });
        });
    } else if (subtitleType === "vtt") {
        const parsedSubtitles = await vttToJson(subtitleData);
        parsedSubtitles.forEach(({ start, end, part }) => {
            result.push({
                start: start / 1000, // Convert milliseconds to seconds
                end: end / 1000,
                part: part.trim(),
                // part.slice(0, part.length - part.split(' ')[part.split(' ').length - 1].length)
            });
        });
    }
    return result;
};

/**
 * Subtitle Interface
 */
interface Subtitle {
    start: number;
    end: number;
    part: string;
}

/**
 * Props Interface
 */
interface SubtitlesProps {
    selectedsubtitle: { file: string };
    currentTime: number;
    containerStyle?: ViewStyle;
    textStyle?: TextStyle;
}

/**
 * Subtitles Component
 */
const Subtitles: React.FC<SubtitlesProps> = ({
    selectedsubtitle,
    currentTime,
    containerStyle = {},
    textStyle = {},
}) => {
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [text, setText] = useState("");

    useEffect(() => {
        const parseSubtitles = async () => {
            if (selectedsubtitle?.file) {
                const parsedSubtitles = await subtitleParser(
                    selectedsubtitle.file
                );
                setSubtitles(parsedSubtitles);
            }
        };
        parseSubtitles();
    }, [selectedsubtitle]);

    useEffect(() => {
        let start = 0;
        let end = subtitles.length - 1;
        while (start <= end) {
            const mid = Math.floor((start + end) / 2);
            const subtitle = subtitles[mid] || { start: 0, end: 0, part: "" };
            if (currentTime >= subtitle.start && currentTime <= subtitle.end) {
                setText(subtitle.part.trim());
                return;
            } else if (currentTime < subtitle.start) {
                end = mid - 1;
            } else {
                start = mid + 1;
            }
        }
        setText("");
    }, [currentTime, subtitles]);

    return (
        <View
            style={[
                {
                    position: "absolute",
                    bottom: 50,
                    width: "100%",
                    alignItems: "center",
                },
                containerStyle,
            ]}
        >
            {text ? (
                <Text
                    testID="react-native-subtitles-text"
                    style={{
                        fontSize: 25,
                        color: "white",
                        textAlign: "center",
                        padding: 15,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        textShadowColor: "#000",
                        textShadowOffset: { width: 2, height: 2 },
                        textShadowRadius: 2,
                        ...textStyle,
                    }}
                >
                    {text}
                </Text>
            ) : null}
        </View>
    );
};

export default Subtitles;
