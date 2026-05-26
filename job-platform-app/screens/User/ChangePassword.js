import { useState } from "react";
import { View, Alert, ScrollView } from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { COLORS } from "../../styles/Styles";

const ChangePassword = ({ navigation }) => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const handleSubmit = async () => {
        setErr("");
        if (!oldPassword || !newPassword || !confirm) {
            setErr("Vui lòng nhập đầy đủ các trường.");
            return;
        }
        if (newPassword !== confirm) {
            setErr("Mật khẩu mới và xác nhận không khớp.");
            return;
        }
        if (newPassword.length < 6) {
            setErr("Mật khẩu mới phải có ít nhất 6 ký tự.");
            return;
        }
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            await authApis(token).post(endpoints["change-password"], {
                old_password: oldPassword,
                new_password: newPassword,
            });
            Alert.alert("Thành công", "Đổi mật khẩu thành công!", [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
        } catch (e) {
            const msg = e?.response?.data?.detail || "Đổi mật khẩu thất bại.";
            setErr(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={Styles.container} contentContainerStyle={[Styles.padding, { paddingBottom: 40 }]}>
            <TextInput
                label="Mật khẩu cũ"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                style={Styles.input}
            />
            <TextInput
                label="Mật khẩu mới"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                style={Styles.input}
            />
            <TextInput
                label="Xác nhận mật khẩu mới"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                style={Styles.input}
            />
            {err ? <HelperText type="error" visible>{err}</HelperText> : null}
            <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                style={{ marginTop: 20, backgroundColor: COLORS.primary }}
            >
                Đổi mật khẩu
            </Button>
        </ScrollView>
    );
};

export default ChangePassword;