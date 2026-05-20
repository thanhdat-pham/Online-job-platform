import { ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { Button, HelperText, TextInput, Text, RadioButton } from "react-native-paper";
import * as ImgPicker from "expo-image-picker";
import { useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import Styles, { COLORS } from "../../styles/Styles";

const CANDIDATE_FIELDS = [
    { field: 'first_name', label: 'Tên', icon: 'text' },
    { field: 'last_name', label: 'Họ và tên lót', icon: 'text' },
    { field: 'email', label: 'Email', icon: 'email' },
    { field: 'username', label: 'Tên đăng nhập', icon: 'account' },
    { field: 'password', label: 'Mật khẩu', icon: 'eye', secureTextEntry: true },
    { field: 'confirm', label: 'Xác nhận mật khẩu', icon: 'eye', secureTextEntry: true },
];

const EMPLOYER_EXTRA = [
    { field: 'company_name', label: 'Tên công ty', icon: 'office-building' },
    { field: 'tax_code', label: 'Mã số thuế', icon: 'identifier' },
    { field: 'company_address', label: 'Địa chỉ công ty', icon: 'map-marker' },
    { field: 'company_description', label: 'Mô tả công ty', icon: 'text', multiline: true },
];

const Register = () => {
    const [form, setForm] = useState({});
    const [role, setRole] = useState('candidate');
    const [avatar, setAvatar] = useState(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();

    const pickAvatar = async () => {
        let { status } = await ImgPicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const res = await ImgPicker.launchImageLibraryAsync({ mediaTypes: ImgPicker.MediaTypeOptions.Images });
        if (!res.canceled) setAvatar(res.assets[0]);
    };

    const validate = () => {
        const fields = role === 'employer' ? [...CANDIDATE_FIELDS, ...EMPLOYER_EXTRA] : CANDIDATE_FIELDS;
        for (let f of fields)
            if (!f.multiline && !form[f.field]) { setErr(`Vui lòng nhập ${f.label}!`); return false; }
        if (form.password !== form.confirm) { setErr("Mật khẩu không khớp!"); return false; }
        return true;
    };

    const register = async () => {
        if (!validate()) return;
        setErr("");
        try {
            setLoading(true);
            const fd = new FormData();
            fd.append('role', role.toUpperCase());
            for (let key of Object.keys(form)) {
                if (key !== 'confirm') fd.append(key, form[key]);
            }
            if (avatar) {
                fd.append('avatar', { uri: avatar.uri, name: avatar.fileName || 'avatar.jpg', type: 'image/jpeg' });
            }
            await Apis.post(endpoints['register'], fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            Alert.alert("Thành công", role === 'employer' ? "Đăng ký thành công! Vui lòng chờ admin duyệt tài khoản." : "Đăng ký thành công!", [
                { text: 'Đăng nhập', onPress: () => nav.navigate('login') }
            ]);
        } catch (ex) {
            console.error(ex);
            setErr("Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại.");
        } finally {
            setLoading(false);
        }
    };

    const fields = [...CANDIDATE_FIELDS, ...(role === 'employer' ? EMPLOYER_EXTRA : [])];

    return (
        <ScrollView style={Styles.container} contentContainerStyle={[Styles.padding, { paddingTop: 30, paddingBottom: 40 }]}>
            <Text style={[Styles.subject, { marginBottom: 12 }]}>📝 Đăng ký tài khoản</Text>

            {/* Role selection */}
            <Text style={{ fontWeight: '700', color: COLORS.primary, marginBottom: 6 }}>Loại tài khoản:</Text>
            <RadioButton.Group onValueChange={setRole} value={role}>
                <RadioButton.Item label="Ứng viên" value="candidate" color={COLORS.primary} />
                <RadioButton.Item label="Nhà tuyển dụng" value="employer" color={COLORS.primary} />
            </RadioButton.Group>

            {err ? <HelperText type="error" visible>{err}</HelperText> : null}

            {fields.map(f => (
                <TextInput
                    key={f.field}
                    style={Styles.input}
                    label={f.label}
                    value={form[f.field] || ''}
                    onChangeText={t => setForm({ ...form, [f.field]: t })}
                    secureTextEntry={f.secureTextEntry}
                    multiline={f.multiline}
                    numberOfLines={f.multiline ? 3 : 1}
                    right={f.icon ? <TextInput.Icon icon={f.icon} /> : null}
                />
            ))}

            <TouchableOpacity onPress={pickAvatar} style={{ padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed', alignItems: 'center', marginTop: 10 }}>
                <Text style={{ color: COLORS.primary, fontWeight: '700' }}>
                    {avatar ? '✅ Ảnh đại diện đã chọn' : '🖼 Chọn ảnh đại diện (bắt buộc)'}
                </Text>
            </TouchableOpacity>
            {avatar && <Image source={{ uri: avatar.uri }} style={[Styles.avatarLarge, { alignSelf: 'center', marginTop: 8 }]} />}

            <Button
                mode="contained"
                onPress={register}
                loading={loading}
                disabled={loading}
                style={[Styles.btn, { marginTop: 20, backgroundColor: COLORS.primary }]}
                contentStyle={{ paddingVertical: 6 }}
            >
                Đăng ký
            </Button>
        </ScrollView>
    );
};

export default Register;
