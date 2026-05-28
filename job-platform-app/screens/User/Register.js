import { ScrollView, TouchableOpacity, Image, Alert, View, FlatList, Modal } from "react-native";
import { Button, HelperText, TextInput, Text, RadioButton } from "react-native-paper";
import * as ImgPicker from "expo-image-picker";
import { useState, useEffect } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import Styles, { COLORS } from "../../styles/Styles";

const CANDIDATE_FIELDS = [
    { field: 'full_name', label: 'Họ và tên', icon: 'text' },
    { field: 'email', label: 'Email ', icon: 'email' },
    { field: 'username', label: 'Tên đăng nhập', icon: 'account' },
    { field: 'password', label: 'Mật khẩu', icon: 'eye', secureTextEntry: true },
    { field: 'confirm', label: 'Xác nhận mật khẩu', icon: 'eye', secureTextEntry: true },
    { field: 'phone_number', label: 'Số điện thoại', icon: 'phone' },
];

const Register = () => {
    const [form, setForm] = useState({});
    const [role, setRole] = useState('candidate');
    const [avatar, setAvatar] = useState(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const [presetCompanies, setPresetCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [useCustomCompany, setUseCustomCompany] = useState(false);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [companyLogo, setCompanyLogo] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const nav = useNavigation();

    useEffect(() => {
        if (role === 'employer') loadPresetCompanies();
    }, [role]);

    const loadPresetCompanies = async () => {
        try {
            const res = await Apis.get(endpoints['preset_companies']);
            setPresetCompanies(res.data);
        } catch (e) {
            console.warn("Không tải được danh sách công ty:", e);
        }
    };

    const register = async () => {
        setErr("");
        if (!form.full_name || !form.email || !form.username || !form.password || !form.phone_number) {
            setErr("Vui lòng điền đầy đủ thông tin.");
            return;
        }
        if (form.password !== form.confirm) {
            setErr("Mật khẩu xác nhận không khớp.");
            return;
        }
        if (!avatar) {
            setErr("Vui lòng chọn ảnh đại diện.");
            return;
        }

        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('role', role.toUpperCase());
            for (let key in form) if (key !== 'confirm') fd.append(key, form[key]);

            if (role === 'employer') {
                if (useCustomCompany) {
                    fd.append('company_name', form.company_name || "");
                    fd.append('company_address', form.company_address || "");
                    if (companyLogo) fd.append('company_logo', { uri: companyLogo.uri, name: 'logo.jpg', type: 'image/jpeg' });
                } else if (selectedCompany) {
                    fd.append('company_id', selectedCompany.id);
                }
            }
            if (avatar) fd.append('avatar', { uri: avatar.uri, name: 'avatar.jpg', type: 'image/jpeg' });

            await Apis.post(endpoints['register'], fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            Alert.alert("Thành công", "Đăng ký thành công!", [{ text: 'Đăng nhập', onPress: () => nav.navigate('login') }]);
        } catch (ex) {

            const errData = ex?.response?.data;
            if (errData && typeof errData === 'object') {
                const messages = Object.entries(errData)
                    .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                    .join('\n');
                setErr(messages);
            } else {
                setErr("Đăng ký thất bại. Vui lòng thử lại.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={Styles.container} contentContainerStyle={[Styles.padding, { paddingTop: 30, paddingBottom: 40 }]}>
            <Text style={[Styles.subject, { marginBottom: 12 }]}>📝 Đăng ký tài khoản</Text>

            <RadioButton.Group onValueChange={setRole} value={role}>
                <RadioButton.Item label="Ứng viên" value="candidate" color={COLORS.primary} />
                <RadioButton.Item label="Nhà tuyển dụng" value="employer" color={COLORS.primary} />
            </RadioButton.Group>
            {CANDIDATE_FIELDS.map(f => {

                if (f.field === 'password' || f.field === 'confirm') {
                    return (
                        <TextInput
                            key={f.field}
                            style={Styles.input}
                            label={f.label}
                            value={form[f.field] || ''}
                            onChangeText={t => setForm({ ...form, [f.field]: t })}
                            secureTextEntry={!showPassword}
                            right={
                                <TextInput.Icon
                                    icon={showPassword ? "eye-off" : "eye"}
                                    onPress={() => setShowPassword(!showPassword)}
                                />
                            }
                        />
                    );
                }


                return (
                    <TextInput
                        key={f.field}
                        style={Styles.input}
                        label={f.label}
                        value={form[f.field] || ''}
                        onChangeText={t => setForm({ ...form, [f.field]: t })}
                        secureTextEntry={f.secureTextEntry}
                        right={f.icon ? <TextInput.Icon icon={f.icon} /> : null}
                    />
                );
            })}
            {role === 'employer' && (
                <View style={{ marginTop: 20 }}>
                    <Text style={{ fontWeight: '700', color: COLORS.primary, marginBottom: 10 }}>🏢 Thông tin công ty:</Text>
                    {!useCustomCompany ? (
                        <>
                            <TouchableOpacity onPress={() => setShowCompanyModal(true)} style={{ padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.primary, alignItems: 'center' }}>
                                <Text style={{ color: COLORS.primary }}>{selectedCompany ? `✅ ${selectedCompany.name}` : '🏢 Chọn từ danh sách công ty'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setUseCustomCompany(true); setSelectedCompany(null); }}>
                                <Text style={{ color: COLORS.primary, textAlign: 'center', marginTop: 10, textDecorationLine: 'underline' }}>+ Công ty chưa có trong danh sách? Nhập mới</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity onPress={() => setUseCustomCompany(false)}><Text style={{ color: COLORS.primary, marginBottom: 10 }}>← Quay lại chọn từ danh sách</Text></TouchableOpacity>
                            <TextInput style={Styles.input} label="Tên công ty" value={form.company_name || ''} onChangeText={t => setForm({ ...form, company_name: t })} />
                            <TextInput style={Styles.input} label="Địa chỉ công ty" value={form.company_address || ''} onChangeText={t => setForm({ ...form, company_address: t })} />
                            <TouchableOpacity
                                onPress={async () => {
                                    let res = await ImgPicker.launchImageLibraryAsync();
                                    if (!res.canceled) setCompanyLogo(res.assets[0]);
                                }}
                                style={{
                                    padding: 14,
                                    borderRadius: 10,
                                    borderWidth: 1.5,
                                    borderStyle: 'dashed',
                                    borderColor: COLORS.primary,
                                    alignItems: 'center',
                                    marginTop: 10
                                }}
                            >
                                <Text style={{ color: COLORS.primary }}>
                                    {companyLogo ? ' Đã chọn logo công ty' : 'Chọn logo công ty'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}

            <TouchableOpacity onPress={async () => {
                let res = await ImgPicker.launchImageLibraryAsync();
                if (!res.canceled) setAvatar(res.assets[0]);
            }} style={{ padding: 14, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.primary, alignItems: 'center', marginTop: 20 }}>
                <Text style={{ color: COLORS.primary }}>{avatar ? '✅ Đã chọn avatar' : '🖼 Chọn avatar'}</Text>
            </TouchableOpacity>

            <Button mode="contained" onPress={register} loading={loading} style={{ marginTop: 20 }}>Đăng ký</Button>

            <Modal visible={showCompanyModal} animationType="slide">
                <View style={{ flex: 1, padding: 20, paddingTop: 50 }}>
                    <FlatList data={presetCompanies} keyExtractor={item => String(item.id)} renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => { setSelectedCompany(item); setShowCompanyModal(false); }} style={{ padding: 15, borderBottomWidth: 1 }}>
                            <Text>{item.name}</Text>
                        </TouchableOpacity>
                    )} />
                    <Button onPress={() => setShowCompanyModal(false)}>Đóng</Button>
                </View>
            </Modal>
        </ScrollView>
    );
};

export default Register;