import { useState } from "react";
import { ScrollView, View, Text, Alert } from "react-native";
import { Button, TextInput, HelperText } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { COLORS } from "../../styles/Styles";
import { useNavigation } from "@react-navigation/native";

const ApplyJob = ({ route }) => {
    const { jobId, jobTitle } = route.params;
    const nav = useNavigation();
    const [coverLetter, setCoverLetter] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const apply = async () => {
        if (!coverLetter.trim()) { setErr("Vui lòng nhập thư xin việc!"); return; }
        setErr("");
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            await authApis(token).post(endpoints['apply-job'](jobId), { cover_letter: coverLetter });
            Alert.alert("Thành công", "Đã nộp hồ sơ ứng tuyển!", [{ text: 'OK', onPress: () => nav.goBack() }]);
        } catch (ex) {
            Alert.alert("Lỗi", ex?.response?.data?.detail || "Không thể nộp hồ sơ. Có thể bạn đã ứng tuyển rồi!");
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

            <View style={{ marginTop: 16, padding: 12, borderRadius: 10, backgroundColor: '#E3F2FD', borderLeftWidth: 4, borderLeftColor: COLORS.primary }}>
                <Text style={{ color: '#1565C0', fontSize: 13, lineHeight: 20 }}>
                    💡 CV được quản lý riêng tại mục <Text style={{ fontWeight: '700' }}>Hồ sơ ứng viên</Text>. Tại đây chỉ cần viết thư giới thiệu.
                </Text>
            </View>

            {err ? <HelperText type="error" visible>{err}</HelperText> : null}

            <TextInput
                label="Thư xin việc (Cover Letter) *"
                value={coverLetter}
                onChangeText={setCoverLetter}
                multiline
                numberOfLines={10}
                style={[Styles.input, { marginTop: 16 }]}
                placeholder="Giới thiệu bản thân và lý do bạn phù hợp với vị trí này..."
            />

            <Button
                mode="contained"
                onPress={apply}
                loading={loading}
                disabled={loading}
                icon="send"
                style={[Styles.btn, { marginTop: 24, backgroundColor: COLORS.primary }]}
                contentStyle={{ paddingVertical: 6 }}
            >
                Nộp hồ sơ ứng tuyển
            </Button>
        </ScrollView>
    );
};

export default ApplyJob;