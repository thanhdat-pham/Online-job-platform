import { useState, useContext } from "react";
import { ScrollView, View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { Button, TextInput, HelperText } from "react-native-paper";
import * as ImgPicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/Contexts";
import Styles, { COLORS } from "../../styles/Styles";
import { useNavigation } from "@react-navigation/native";

const ApplyJob = ({ route }) => {
    const { jobId, jobTitle } = route.params;
    const [user] = useContext(MyUserContext);
    const nav = useNavigation();
    const [coverLetter, setCoverLetter] = useState("");
    const [cv, setCv] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const pickCV = async () => {
        let { status } = await ImgPicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { alert("Cần cấp quyền truy cập thư viện!"); return; }
        const result = await ImgPicker.launchImageLibraryAsync({ mediaTypes: ImgPicker.MediaTypeOptions.All });
        if (!result.canceled) setCv(result.assets[0]);
    };

    const apply = async () => {
        if (!coverLetter.trim()) { setErr("Vui lòng nhập thư xin việc!"); return; }
        if (!cv) { setErr("Vui lòng chọn file CV!"); return; }
        setErr("");
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const form = new FormData();
            form.append('cover_letter', coverLetter);
            form.append('cv', { uri: cv.uri, name: cv.fileName || 'cv.pdf', type: cv.mimeType || 'application/pdf' });

            await authApis(token).post(endpoints['apply-job'](jobId), form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            Alert.alert("Thành công", "Đã nộp hồ sơ ứng tuyển!", [{ text: 'OK', onPress: () => nav.goBack() }]);
        } catch (ex) {
            console.error(ex);
            Alert.alert("Lỗi", "Không thể nộp hồ sơ. Có thể bạn đã ứng tuyển rồi!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={Styles.container} contentContainerStyle={{ padding: 16 }}>
            <View style={[Styles.card, { marginHorizontal: 0, backgroundColor: COLORS.chip }]}>
                <Text style={{ fontWeight: '700', color: COLORS.primary, fontSize: 15 }}>📋 Ứng tuyển vị trí:</Text>
                <Text style={{ color: COLORS.text, marginTop: 4, fontWeight: '600' }}>{jobTitle}</Text>
            </View>

            {err ? <HelperText type="error" visible>{err}</HelperText> : null}

            <TextInput
                label="Thư xin việc (Cover Letter)"
                value={coverLetter}
                onChangeText={setCoverLetter}
                multiline
                numberOfLines={8}
                style={[Styles.input, { marginTop: 16 }]}
                placeholder="Giới thiệu bản thân và lý do bạn phù hợp với vị trí này..."
            />

            <TouchableOpacity
                onPress={pickCV}
                style={{ marginTop: 16, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed', alignItems: 'center' }}>
                <Text style={{ color: COLORS.primary, fontWeight: '700' }}>
                    {cv ? `✅ ${cv.fileName || 'File đã chọn'}` : '📎 Chọn file CV (PDF, DOC, ảnh...)'}
                </Text>
            </TouchableOpacity>

            <Button
                mode="contained"
                onPress={apply}
                loading={loading}
                disabled={loading}
                style={[Styles.btn, { marginTop: 24, backgroundColor: COLORS.primary }]}
                contentStyle={{ paddingVertical: 6 }}
            >
                Nộp hồ sơ
            </Button>
        </ScrollView>
    );
};

export default ApplyJob;
