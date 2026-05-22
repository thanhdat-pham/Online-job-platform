import { useState, useEffect, useContext } from "react";
import { ScrollView, View, Alert, Text } from "react-native";
import { Button, HelperText, Switch, TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/Contexts";
import Styles, { COLORS } from "../../styles/Styles";

const SectionLabel = ({ icon, label }) => (   // ← giữ nguyên dòng này
    <Text style={{ fontWeight: '700', fontSize: 15, color: COLORS.primary, marginTop: 20, marginBottom: 6 }}>
        {icon}  {label}
    </Text>
);

const CandidateProfile = ({ navigation }) => {
    const [user, dispatch] = useContext(MyUserContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const set = (key, val) => setProfile(prev => ({ ...prev, [key]: val }));

    useEffect(() => {
        (async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const res = await authApis(token).get(endpoints['candidate-profile']);
                setProfile(res.data);
            } catch (ex) { console.error(ex); }
            finally { setLoading(false); }
        })();
    }, []);

    const save = async () => {
        setErr(''); setSaving(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await authApis(token).patch(endpoints['candidate-profile'], {
                is_looking_for_job: profile.is_looking_for_job,
                education: profile.education || '',
                skills: profile.skills || '',
                experience: profile.experience || '',
                additional_info: profile.additional_info || '',
            });
            setProfile(res.data);
            const userRes = await authApis(token).get(endpoints['current-user']);
            dispatch({ type: "LOGIN", payload: userRes.data });
            Alert.alert("Thành công", "Đã cập nhật hồ sơ!", [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (ex) {
            console.error(ex.response?.data || ex.message);
            setErr("Có lỗi xảy ra. Vui lòng thử lại!");
        } finally { setSaving(false); }
    };

    if (loading) return (
        <View style={Styles.center}>
            <Text style={{ color: COLORS.textLight }}>Đang tải...</Text>
        </View>
    );

    return (
        <ScrollView style={Styles.container} contentContainerStyle={[Styles.padding, { paddingBottom: 40 }]}>
            <Text style={[Styles.subject, { marginBottom: 4 }]}>👤 Hồ sơ ứng viên</Text>

            {err ? <HelperText type="error" visible>{err}</HelperText> : null}

            <View style={[Styles.card, { marginHorizontal: 0, marginTop: 12 }]}>
                <Text style={{ color: COLORS.textLight, fontSize: 12 }}>Họ và tên</Text>
                <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 16, marginTop: 2 }}>
                    {profile?.full_name || user?.username}
                </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingHorizontal: 4 }}>
                <View>
                    <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 15 }}>Đang tìm việc</Text>
                    <Text style={{ color: COLORS.textLight, fontSize: 12, marginTop: 2 }}>Nhà tuyển dụng sẽ thấy bạn</Text>
                </View>
                <Switch
                    value={profile?.is_looking_for_job ?? true}
                    onValueChange={v => set('is_looking_for_job', v)}
                    color={COLORS.primary}
                />
            </View>

            <SectionLabel icon="🎓" label="Học vấn" />
            <TextInput
                value={profile?.education || ''}
                onChangeText={v => set('education', v)}
                multiline numberOfLines={4}
                placeholder="Trường, chuyên ngành, bằng cấp..."
                style={Styles.input}
            />

            <SectionLabel icon="💡" label="Kỹ năng" />
            <TextInput
                value={profile?.skills || ''}
                onChangeText={v => set('skills', v)}
                multiline numberOfLines={4}
                placeholder="Các kỹ năng của bạn..."
                style={Styles.input}
            />

            <SectionLabel icon="💼" label="Kinh nghiệm" />
            <TextInput
                value={profile?.experience || ''}
                onChangeText={v => set('experience', v)}
                multiline numberOfLines={4}
                placeholder="Công ty, vị trí, thời gian, mô tả..."
                style={Styles.input}
            />

            <SectionLabel icon="📝" label="Bổ sung" />
            <TextInput
                value={profile?.additional_info || ''}
                onChangeText={v => set('additional_info', v)}
                multiline numberOfLines={4}
                placeholder="Chứng chỉ, giải thưởng, sở thích..."
                style={Styles.input}
            />

            <Button
                mode="contained"
                onPress={save}
                loading={saving}
                disabled={saving}
                icon="content-save"
                style={[Styles.btn, { backgroundColor: COLORS.primary, marginTop: 28 }]}
                contentStyle={{ paddingVertical: 6 }}
            >
                Lưu hồ sơ
            </Button>
        </ScrollView>
    );
};

export default CandidateProfile;