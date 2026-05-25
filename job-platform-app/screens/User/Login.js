import { ScrollView, View } from "react-native";
import { Button, HelperText, TextInput, Text } from "react-native-paper";
import { useContext, useState } from "react";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../configs/Contexts";
import Styles, { COLORS } from "../../styles/Styles";

const LOGIN_FIELDS = [
    { field: 'username', label: 'Tên đăng nhập', icon: 'account' },
    { field: 'password', label: 'Mật khẩu', icon: 'eye', secureTextEntry: true },
];


const Login = () => {
    const [form, setForm] = useState({});
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const nav = useNavigation();
    const [, dispatch] = useContext(MyUserContext);

    const validate = () => {
        for (let f of LOGIN_FIELDS)
            if (!form[f.field]) { setErr(`Vui lòng nhập ${f.label}!`); return false; }
        return true;
    };

    const login = async () => {
        if (!validate()) return;
        setErr("");
        try {
            setLoading(true);
            let res = await Apis.post(endpoints['login'], {
                username: form.username,
                password: form.password,
            });
            await AsyncStorage.setItem('token', res.data.access_token);

            let u = await authApis(res.data.access_token).get(endpoints['current-user']);
            dispatch({ type: "LOGIN", payload: u.data });
        } catch (ex) {
            console.error(ex);
            setErr("Sai tên đăng nhập hoặc mật khẩu!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={Styles.container} contentContainerStyle={[Styles.padding, { paddingTop: 40 }]}>
            <Text style={[Styles.subject, { marginBottom: 20 }]}>🔐 Đăng nhập</Text>

            {err ? <HelperText type="error" visible>{err}</HelperText> : null}

            {LOGIN_FIELDS.map(f => (
                <TextInput
                    key={f.field}
                    style={Styles.input}
                    label={f.label}
                    value={form[f.field] || ''}
                    onChangeText={t => setForm({ ...form, [f.field]: t })}

                    secureTextEntry={f.field === 'password' && !showPassword}
                    right={
                        f.field === 'password' ? (
                            <TextInput.Icon
                                icon={showPassword ? "eye-off" : "eye"}
                                onPress={() => setShowPassword(!showPassword)}
                            />
                        ) : (
                            <TextInput.Icon icon={f.icon} />
                        )
                    }
                />
            ))}

            <Button
                mode="contained"
                onPress={login}
                loading={loading}
                disabled={loading}
                style={[Styles.btn, { marginTop: 16, backgroundColor: COLORS.primary }]}
                contentStyle={{ paddingVertical: 6 }}
            >
                Đăng nhập
            </Button>

            <Button onPress={() => nav.navigate('register')} style={{ marginTop: 8 }}>
                Chưa có tài khoản? Đăng ký ngay
            </Button>
        </ScrollView>
    );
};

export default Login;
