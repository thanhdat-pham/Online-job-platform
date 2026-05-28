import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";
import { authApis } from "../../configs/Apis";
import { COLORS } from "../../styles/Styles";

const CandidateProfileView = () => {
    const route = useRoute();
    const { candidateId } = route.params ?? {};
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!candidateId) {
            setLoading(false);
            return;
        }
        const fetch = async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem("token");
                const res = await authApis(token).get(`/candidates/${candidateId}/profile/`);
                setProfile(res.data);
            } catch (e) {
               
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [candidateId]);

    if (!candidateId) return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: COLORS.textLight }}>Không tìm thấy thông tin ứng viên.</Text>
        </View>
    );

    if (loading) return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );

    if (!profile) return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: COLORS.textLight }}>Không tìm thấy hồ sơ ứng viên.</Text>
        </View>
    );

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#f6f8fa" }} contentContainerStyle={{ padding: 16 }}>
            <View style={s.card}>
                <View style={[s.avatar, { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" }]}>
                    <Text style={{ fontSize: 36 }}>{'\u{1F464}'}</Text>
                </View>
                <Text style={s.name}>{profile.full_name || "Chưa cập nhật"}</Text>
                <View style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 }}>
                    <Text style={{ color: "#fff", fontSize: 12 }}>Ứng viên</Text>
                </View>
            </View>

            <View style={s.card}>
                <Text style={s.sectionTitle}>Thông tin cơ bản</Text>
                <View style={s.row}>
                    <Text style={s.label}>Họ và tên</Text>
                    <Text style={s.value}>{profile.full_name || "Chưa cập nhật"}</Text>
                </View>
                <View style={s.row}>
                    <Text style={s.label}>Học vấn</Text>
                    <Text style={s.value}>{profile.education || "Chưa cập nhật"}</Text>
                </View>
                <View style={s.row}>
                    <Text style={s.label}>Đang tìm việc</Text>
                    <Text style={s.value}>{profile.is_looking_for_job ? '\u{2705} Có' : '\u{274C} Không'}</Text>
                </View>
            </View>

            {profile.skills ? (
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Kỹ năng</Text>
                    <Text style={[s.value, { textAlign: "left" }]}>{profile.skills}</Text>
                </View>
            ) : null}

            {profile.experience ? (
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Kinh nghiệm</Text>
                    <Text style={[s.value, { textAlign: "left" }]}>{profile.experience}</Text>
                </View>
            ) : null}

            {profile.additional_info ? (
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Thông tin thêm</Text>
                    <Text style={[s.value, { textAlign: "left" }]}>{profile.additional_info}</Text>
                </View>
            ) : null}
        </ScrollView>
    );
};

export default CandidateProfileView;

const s = StyleSheet.create({
    card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, alignItems: "center" },
    avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
    name: { fontSize: 18, fontWeight: "700", color: "#111827" },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 12, alignSelf: "flex-start" },
    row: { flexDirection: "row", justifyContent: "space-between", width: "100%", paddingVertical: 6, borderBottomWidth: 1, borderColor: "#f3f4f6" },
    label: { fontSize: 13, color: COLORS.textLight, fontWeight: "600" },
    value: { fontSize: 13, color: "#374151", flex: 1, textAlign: "right" },
});