import { useEffect, useState, useContext } from "react";
import { FlatList, View, Text, ActivityIndicator, Alert } from "react-native";
import { Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/Contexts";
import Styles, { COLORS } from "../../styles/Styles";

const statusInfo = {
    pending: { label: 'Chờ xem xét', color: '#F57F17' },
    reviewed: { label: 'Đã xem xét', color: '#1565C0' },
    interviewing: { label: 'Phỏng vấn', color: '#6A1B9A' },
    accepted: { label: 'Đã chấp nhận', color: '#2E7D32' },
    rejected: { label: 'Đã từ chối', color: '#C62828' },
};

const ApplicationCard = ({ item }) => {
    const info = statusInfo[item.status] || { label: item.status, color: COLORS.primary };
    return (
        <View style={Styles.card}>
            <Text style={{ fontWeight: '700', fontSize: 15, color: COLORS.text }}>{item.job?.title || 'Công việc'}</Text>
            <Text style={{ color: COLORS.primary, marginTop: 2 }}>🏢 {item.job?.employer?.company?.name || 'Công ty'}</Text>
            <View style={[Styles.row, { marginTop: 8, justifyContent: 'space-between' }]}>
                <Text style={{ color: COLORS.textLight, fontSize: 12 }}>
                    📅 {new Date(item.applied_at).toLocaleDateString('vi-VN')}
                </Text>
                <View style={[Styles.badge, { backgroundColor: info.color }]}>
                    <Text style={Styles.badgeText}>{info.label}</Text>
                </View>
            </View>
        </View>
    );
};

const MyApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user] = useContext(MyUserContext);

    const load = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const res = await authApis(token).get(endpoints['my-applications']);
            setApplications(res.data.results ?? res.data);
        } catch (ex) {
            console.error(ex);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />;

    return (
        <FlatList
            style={Styles.container}
            data={applications}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <ApplicationCard item={item} />}
            ListEmptyComponent={<Text style={Styles.emptyText}>Bạn chưa nộp hồ sơ nào</Text>}
            contentContainerStyle={{ paddingBottom: 20 }}
        />
    );
};

export default MyApplications;
