import { useContext, useState } from "react";
import { Alert, ScrollView } from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/Contexts";
import Styles, { COLORS } from "../../styles/Styles";

const ChangePassword = ({ navigation }) => {
    const [, dispatch] = useContext(MyUserContext);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

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

            await AsyncStorage.removeItem("token");

            Alert.alert(
                "Thành công",
                "Đổi mật khẩu thành công! Vui lòng đăng nhập lại.",
                [
                    {
                        text: "OK",
                        onPress: () => {

                            dispatch({ type: "LOGOUT" });

                            navigation.reset({
                                index: 0,
                                routes: [{ name: "main-tabs" }],
                            });
                        },
                    },
                ]
            );
        } catch (e) {
            const msg =
                e?.response?.data?.detail ||
                e?.response?.data?.old_password?.[0] ||
                "Đổi mật khẩu thất bại.";
            setErr(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            style={Styles.container}
            contentContainerStyle={[Styles.padding, { paddingBottom: 40 }]}
        >
            <TextInput
                label="Mật khẩu cũ"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOld}
                style={Styles.input}
                right={
                    <TextInput.Icon
                        icon={showOld ? "eye-off" : "eye"}
                        onPress={() => setShowOld(!showOld)}
                    />
                }
            />
            <TextInput
                label="Mật khẩu mới"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                style={Styles.input}
                right={
                    <TextInput.Icon
                        icon={showNew ? "eye-off" : "eye"}
                        onPress={() => setShowNew(!showNew)}
                    />
                }
            />
            <TextInput
                label="Xác nhận mật khẩu mới"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showConfirm}
                style={Styles.input}
                right={
                    <TextInput.Icon
                        icon={showConfirm ? "eye-off" : "eye"}
                        onPress={() => setShowConfirm(!showConfirm)}
                    />
                }
            />
            {err ? (
                <HelperText type="error" visible>
                    {err}
                </HelperText>
            ) : null}
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