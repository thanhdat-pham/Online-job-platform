import { useState, useEffect, useContext } from "react";
import { ScrollView, View, Alert, Text } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/Contexts";
import Styles, { COLORS } from "../../styles/Styles";

const EmployerProfile = ({ navigation }) => {
    const [user, dispatch] = useContext(MyUserContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const set = (key, val) => setProfile(prev => ({ ...prev, [key]: val }));

    useEffect(() => {
        (async () => {
            try {
                const token = await AsyncStorage.getItem('token');

                const res = await authApis(token).get(endpoints['employer-profile']);
                setProfile(res.data);
            } catch (ex) { console.error(ex); }
            finally { setLoading(false); }
        })();
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            const token = await AsyncStorage.getItem('token');

            const res = await authApis(token).patch(endpoints['employer-profile'], {
                full_name: profile.full_name,
                position: profile.position,
                bio: profile.bio,
            });
            setProfile(res.data);
            Alert.alert("Thành công", "Đã cập nhật hồ sơ nhà tuyển dụng!");
        } catch (ex) {
            Alert.alert("Lỗi", "Không thể lưu thông tin.");
        } finally { setSaving(false); }
    };

    if (loading) return <View style={Styles.center}><Text>Đang tải...</Text></View>;

    return (
        <ScrollView style={Styles.container} contentContainerStyle={[Styles.padding, { paddingBottom: 40 }]}>
            <Text style={[Styles.subject, { marginBottom: 12 }]}>🏢 Hồ sơ Nhà tuyển dụng</Text>

            <TextInput label="Người đại diện" value={profile?.full_name || ''} onChangeText={v => set('full_name', v)} style={Styles.input} />
            <TextInput label="Chức vụ" value={profile?.position || ''} onChangeText={v => set('position', v)} style={Styles.input} />
            <TextInput label="Giới thiệu bản thân/Công ty" value={profile?.bio || ''} onChangeText={v => set('bio', v)} multiline numberOfLines={4} style={Styles.input} />

            <Button mode="contained" onPress={save} loading={saving} style={{ marginTop: 20, backgroundColor: COLORS.primary }}>
                Lưu hồ sơ
            </Button>
        </ScrollView>
    );
};

export default EmployerProfile;