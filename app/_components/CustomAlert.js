import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Modal from "react-native-modal";
import { SIZE } from "../../constants/Constants";
import { Colors } from "@/constants/Colors";
import { ThemedText } from "../../components/ThemedText";
import { TouchableRipple } from "react-native-paper";

const CustomAlert = ({
    visible,
    title,
    message,
    onCancel,
    onConfirm,
    cancelText = "Cancel",
    confirmText = "Confirm",
}) => {
    return (
        <Modal
            animationIn={"fadeInUp"}
            animationOut={"fadeOutDown"}
            onBackButtonPress={onCancel}
            onBackdropPress={onCancel}
            backdropOpacity={0.5}
            isVisible={visible}
            useNativeDriver={false}
            useNativeDriverForBackdrop={true}
        >
            <View style={styles.alertContainer}>
                <ThemedText numberOfLines={2} style={styles.title}>
                    {title}
                </ThemedText>
                <ThemedText style={styles.message}>{message}</ThemedText>

                <View style={styles.buttonContainer}>
                    <TouchableRipple
                        rippleColor={Colors.dark.backgroundPress}
                        borderless={true}
                        style={[styles.button, styles.cancelButton]}
                        onPress={onCancel}
                    >
                        <ThemedText style={styles.cancelText}>
                            {cancelText}
                        </ThemedText>
                    </TouchableRipple>

                    <TouchableRipple
                        rippleColor={Colors.dark.backgroundPress}
                        borderless={true}
                        style={[styles.button, styles.confirmButton]}
                        onPress={onConfirm}
                    >
                        <ThemedText style={styles.confirmText}>
                            {confirmText}
                        </ThemedText>
                    </TouchableRipple>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    alertContainer: {
        backgroundColor: Colors.dark.background,
        borderRadius: SIZE(10),
        padding: SIZE(20),
    },
    title: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    message: {
        color: "#AAA",
        fontSize: SIZE(16),
        marginBottom: SIZE(20),
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    button: {
        paddingVertical: SIZE(8),
        paddingHorizontal: SIZE(15),
        borderRadius: SIZE(5),
        marginLeft: SIZE(10),
    },
    cancelButton: {
        backgroundColor: "#333",
    },
    confirmButton: {
        backgroundColor: "#E74C3C",
    },
    cancelText: {
        color: "#FFF",
    },
    confirmText: {
        color: "#FFF",
        fontWeight: "bold",
    },
});

export default CustomAlert;
