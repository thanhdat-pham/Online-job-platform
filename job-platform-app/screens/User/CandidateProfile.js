import { useState, useEffect, useContext } from "react";
import { ScrollView, View, Alert, TouchableOpacity, Text, Image } from "react-native";
import { Button, HelperText, Switch } from "react-native-paper";
import * as DocPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/Contexts";
import Styles, { COLORS } from "../../styles/Styles";
import { WebView } from 'react-native-webview';
const CandidateProfile = ({ navigation }) => {
    const [user] = useContext(MyUserContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const [cvFile, setCvFile] = useState(null);

    const load = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await authApis(token).get(endpoints['candidate-profile']);
            setProfile(res.data);
        } catch (ex) { console.error(ex); }
        finally { setLoading(false); }
    };

    const set = (key, val) => setProfile(prev => ({ ...prev, [key]: val }));

    const pickCV = async () => {
        try {
            const result = await DocPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ],
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets?.length > 0) {
                setCvFile(result.assets[0]);
            }
        } catch (ex) {
            console.error('Lỗi chọn file:', ex);
            Alert.alert('Lỗi', 'Không thể chọn file. Vui lòng thử lại!');
        }
    };

    const save = async () => {
        setErr('');
        setSaving(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const form = new FormData();
            form.append('is_looking_for_job', profile.is_looking_for_job ? 'true' : 'false');

            if (cvFile) {
                const uri = cvFile.uri;
                const name = cvFile.name || 'cv.pdf';
                const type = cvFile.mimeType || 'application/pdf';

                form.append('cv_file', {
                    uri: uri,
                    name: name,
                    type: type,
                });
            }
            const res = await authApis(token).patch(endpoints['candidate-profile'], form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                transformRequest: (data) => data,
            });
            setProfile(res.data);
            setCvFile(null);
            Alert.alert("Thành công", "Đã cập nhật hồ sơ!");
            setCvFile(null);
            navigation.goBack(); // Tự động quay về trang Profile sau khi lưu thành công
        } catch (ex) {
            console.error('Lỗi lưu hồ sơ:', ex.response?.data || ex.message || ex);
            setErr("Có lỗi xảy ra. Vui lòng thử lại!");
        } finally { setSaving(false); }
    };

    useEffect(() => { load(); }, []);

    if (loading) return (
        <View style={Styles.center}><Text style={{ color: COLORS.textLight }}>Đang tải hồ sơ...</Text></View>
    );

    return (
        <ScrollView style={Styles.container} contentContainerStyle={[Styles.padding, { paddingBottom: 40 }]}>
            <Text style={[Styles.subject, { marginBottom: 12 }]}>👤 Hồ sơ ứng viên</Text>

            {profile?.avatar ? (
                <Image source={{ uri: profile.avatar }} style={[Styles.avatarLarge, { alignSelf: 'center', marginBottom: 16 }]} />
            ) : null}

            {err ? <HelperText type="error" visible>{err}</HelperText> : null}

            {/* ĐÃ XÓA ô nhập TextInput Họ và tên ở đây */}

            <View style={[Styles.row, { marginVertical: 12, justifyContent: 'space-between' }]}>
                <Text style={{ color: COLORS.text, fontWeight: '600' }}>Đang tìm việc</Text>
                <Switch
                    value={profile?.is_looking_for_job ?? true}
                    onValueChange={v => set('is_looking_for_job', v)}
                    color={COLORS.primary}
                />
            </View>

            {/* CV Upload */}
            <TouchableOpacity
                onPress={pickCV}
                style={{ padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: COLORS.primary, fontWeight: '700' }}>
                    {cvFile ? `✅ ${cvFile.name}` : profile?.cv_file ? '📎 CV hiện tại (nhấn để đổi)' : '📎 Tải lên CV (PDF/DOC)'}
                </Text>
            </TouchableOpacity>
            {profile?.cv_file && !cvFile && (
                <Text style={{ fontSize: 12, color: COLORS.textLight, textAlign: 'center', marginBottom: 8 }}>
                    CV hiện tại đã được tải lên
                </Text>
            )}

            <Button mode="contained" onPress={save} loading={saving} disabled={saving}
                style={[Styles.btn, { backgroundColor: COLORS.primary }]}
                contentStyle={{ paddingVertical: 6 }}>
                Lưu hồ sơ
            </Button>
        </ScrollView>
    );
};

export default CandidateProfile;