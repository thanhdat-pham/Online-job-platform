import { useEffect, useState, useContext, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { Button, IconButton } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/Contexts";
import { COLORS } from "../../styles/Styles";

const JobDetail = () => {
    const route = useRoute();
    const { jobId } = route.params;
    const [user] = useContext(MyUserContext);

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchJob = useCallback(async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            const res = await (token ? authApis(token) : Apis).get(endpoints["job-detail"](jobId));
            setJob(res.data);
            setIsSaved(res.data.is_saved);

            if (token) {
                try {
                    const appRes = await authApis(token).get(endpoints["my-applications"]);
                    const apps = appRes.data.results ?? appRes.data;
                    setApplied(apps.some(a => (a.job?.id ?? a.job) === jobId));
                } catch (_) { }
            }
        } catch (ex) {
            Alert.alert("Lỗi", "Không thể tải thông tin công việc.");
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    useFocusEffect(useCallback(() => {
        fetchJob();
    }, [fetchJob]));

    const handleApply = async () => {
        try {
            setApplying(true);
            const token = await AsyncStorage.getItem("token");
            await authApis(token).post(endpoints["apply-job"](jobId), {});
            setApplied(true);
            Alert.alert("Thành công", "Ứng tuyển thành công!");
        } catch (ex) {
            Alert.alert("Lỗi", ex.response?.data?.detail || "Ứng tuyển thất bại.");
        } finally {
            setApplying(false);
        }
    };

    const handleToggleSave = async () => {
        const previousState = isSaved;
        setIsSaved(!isSaved);
        setSaving(true);
        try {
            const token = await AsyncStorage.getItem("token");
            await authApis(token).post(endpoints["save-job"](jobId));
        } catch (ex) {
            setIsSaved(previousState);
            Alert.alert("Lỗi", "Không thể cập nhật trạng thái lưu.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );

    if (!job) return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: COLORS.textLight }}>Không tìm thấy công việc.</Text>
        </View>
    );

    const salary = job.salary_min && job.salary_max
        ? `${Number(job.salary_min).toLocaleString()} - ${Number(job.salary_max).toLocaleString()} VND`
        : job.salary_min ? `Từ ${Number(job.salary_min).toLocaleString()} VND` : "Thỏa thuận";

    return (
        <View style={{ flex: 1, backgroundColor: "#f6f8fa" }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                <View style={s.card}>
                    <Text style={s.title}>{job.title}</Text>
                    <Text style={s.company}>🏢 {job.employer?.company_name || "Công ty"}</Text>
                    <Text style={s.infoText}>📍 {job.location || "Không xác định"}</Text>
                    <Text style={[s.infoText, { color: "#16a34a", fontWeight: "600", marginTop: 4 }]}>💰 {salary}</Text>
                    <View style={[s.infoRow, { marginTop: 6 }]}>
                        <Text style={s.infoText}>📅 Hạn: {job.deadline ? new Date(job.deadline).toLocaleDateString("vi-VN") : "Không giới hạn"}</Text>
                        <Text style={s.infoText}>👁 {job.views_count} lượt xem</Text>
                    </View>
                    {job.category && (
                        <View style={s.tag}><Text style={s.tagText}>{job.category.name}</Text></View>
                    )}
                </View>

                <View style={s.card}>
                    <Text style={s.sectionTitle}>Mô tả công việc</Text>
                    <Text style={s.content}>{job.description || "Không có mô tả."}</Text>
                </View>

                {job.requirements && (
                    <View style={s.card}>
                        <Text style={s.sectionTitle}>Yêu cầu</Text>
                        <Text style={s.content}>{job.requirements}</Text>
                    </View>
                )}

                {job.benefits && (
                    <View style={s.card}>
                        <Text style={s.sectionTitle}>Phúc lợi</Text>
                        <Text style={s.content}>{job.benefits}</Text>
                    </View>
                )}
            </ScrollView>

            {user?.role === "CANDIDATE" && (
                <View style={s.footer}>
                    <IconButton
                        icon={isSaved ? "bookmark" : "bookmark-outline"}
                        iconColor={isSaved ? COLORS.primary : "#6b7280"}
                        size={30}
                        onPress={handleToggleSave}
                        disabled={saving}
                    />
                    <View style={{ flex: 1 }}>
                        <Button
                            mode="contained"
                            onPress={handleApply}
                            loading={applying}
                            disabled={applying || applied}
                            style={[s.applyBtn, applied && { backgroundColor: "#9ca3af" }]}
                        >
                            {applied ? "Đã ứng tuyển" : "Ứng tuyển ngay"}
                        </Button>
                    </View>
                </View>
            )}
        </View>
    );
};

export default JobDetail;

const s = StyleSheet.create({
    card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, elevation: 1 },
    title: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 6 },
    company: { fontSize: 14, color: COLORS.primary, fontWeight: "600", marginBottom: 8 },
    infoRow: { flexDirection: "row", justifyContent: "space-between" },
    infoText: { fontSize: 13, color: "#6b7280" },
    tag: { alignSelf: "flex-start", backgroundColor: "#e0f2fe", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
    tagText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 8 },
    content: { fontSize: 14, color: "#374151", lineHeight: 22 },
    footer: { flexDirection: "row", alignItems: "center", position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", padding: 16, borderTopWidth: 1, borderColor: "#e5e7eb" },
    applyBtn: { borderRadius: 12, backgroundColor: COLORS.primary },
});