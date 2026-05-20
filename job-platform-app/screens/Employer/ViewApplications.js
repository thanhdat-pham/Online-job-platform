import { useEffect, useState } from "react";
import { FlatList, View, Text, ActivityIndicator, Alert } from "react-native";
import { Button, Menu } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { COLORS } from "../../styles/Styles";

const STATUS_OPTIONS = [
    { value: 'reviewed', label: '📖 Đã xem xét' },
    { value: 'interviewing', label: '📞 Mời phỏng vấn' },
    { value: 'accepted', label: '✅ Chấp nhận' },
    { value: 'rejected', label: '❌ Từ chối' },
];

const statusInfo = {
    pending: { label: 'Chờ xem xét', color: '#F57F17' },
    reviewed: { label: 'Đã xem xét', color: '#1565C0' },
    interviewing: { label: 'Phỏng vấn', color: '#6A1B9A' },
    accepted: { label: 'Chấp nhận', color: '#2E7D32' },
    rejected: { label: 'Từ chối', color: '#C62828' },
};

const AppCard = ({ item, jobId, onUpdate }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const info = statusInfo[item.status] || { label: item.status, color: COLORS.primary };

    const updateStatus = async (newStatus) => {
        setMenuVisible(false);
        try {
            const token = await AsyncStorage.getItem('token');
            await authApis(token).post(endpoints['review-application'](jobId), {
                application_id: item.id,
                status: newStatus,
            });
            onUpdate(item.id, newStatus);
        } catch (ex) {
            Alert.alert("Lỗi", "Không thể cập nhật trạng thái!");
        }
    };

    return (
        <View style={Styles.card}>
            <View style={[Styles.row, { justifyContent: 'space-between' }]}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', fontSize: 14, color: COLORS.text }}>
                        {item.candidate?.first_name} {item.candidate?.last_name}
                    </Text>
                    <Text style={{ color: COLORS.textLight, fontSize: 12 }}>@{item.candidate?.username}</Text>
                </View>
                <View style={[Styles.badge, { backgroundColor: info.color }]}>
                    <Text style={Styles.badgeText}>{info.label}</Text>
                </View>
            </View>

            {item.cover_letter && (
                <Text style={{ color: COLORS.text, marginTop: 8, fontSize: 13, lineHeight: 18 }} numberOfLines={3}>
                    📄 {item.cover_letter}
                </Text>
            )}

            <Text style={{ color: COLORS.textLight, fontSize: 11, marginTop: 6 }}>
                Nộp lúc: {new Date(item.applied_at).toLocaleString('vi-VN')}
            </Text>

            <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                    <Button compact mode="outlined" style={{ marginTop: 10, alignSelf: 'flex-start' }}
                        onPress={() => setMenuVisible(true)}>
                        Cập nhật trạng thái ▾
                    </Button>
                }
            >
                {STATUS_OPTIONS.map(s => (
                    <Menu.Item key={s.value} onPress={() => updateStatus(s.value)} title={s.label} />
                ))}
            </Menu>
        </View>
    );
};

const ViewApplications = ({ route }) => {
    const { jobId, jobTitle } = route.params || {};
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const res = await authApis(token).get(endpoints['employer-job-applications'](jobId));
            setApps(res.data);
        } catch (ex) { console.error(ex); }
        finally { setLoading(false); }
    };

    const handleUpdate = (appId, newStatus) => {
        setApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    };

    useEffect(() => { if (jobId) load(); }, [jobId]);

    if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />;

    return (
        <FlatList
            style={Styles.container}
            data={apps}
            keyExtractor={item => String(item.id)}
            ListHeaderComponent={jobTitle ? <Text style={Styles.sectionHeader}>Hồ sơ cho: {jobTitle}</Text> : null}
            ListEmptyComponent={<Text style={Styles.emptyText}>Chưa có hồ sơ nào</Text>}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => <AppCard item={item} jobId={jobId} onUpdate={handleUpdate} />}
        />
    );
};

export default ViewApplications;
