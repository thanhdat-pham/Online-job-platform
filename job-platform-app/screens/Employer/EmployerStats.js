import { useEffect, useState } from "react";
import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { COLORS } from "../../styles/Styles";

const StatCard = ({ icon, label, value, color }) => (
    <View style={[Styles.card, { flex: 1, alignItems: 'center', padding: 16 }]}>
        <Text style={{ fontSize: 28 }}>{icon}</Text>
        <Text style={{ fontSize: 24, fontWeight: '800', color: color || COLORS.primary, marginTop: 4 }}>{value}</Text>
        <Text style={{ color: COLORS.textLight, fontSize: 12, textAlign: 'center', marginTop: 2 }}>{label}</Text>
    </View>
);

const BarChart = ({ data }) => {
    if (!data || data.length === 0) return <Text style={Styles.emptyText}>Chưa có dữ liệu</Text>;
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <View style={{ paddingHorizontal: 12, marginTop: 8 }}>
            {data.map((d, i) => (
                <View key={i} style={{ marginBottom: 10 }}>
                    <View style={[Styles.row, { justifyContent: 'space-between', marginBottom: 4 }]}>
                        <Text style={{ color: COLORS.textLight, fontSize: 12 }}>{d.month}</Text>
                        <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 12 }}>{d.count} hồ sơ</Text>
                    </View>
                    <View style={{ height: 8, borderRadius: 4, backgroundColor: '#E3F2FD' }}>
                        <View style={{
                            height: 8, borderRadius: 4, backgroundColor: COLORS.primary,
                            width: `${(d.count / max) * 100}%`
                        }} />
                    </View>
                </View>
            ))}
        </View>
    );
};

const EmployerStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await authApis(token).get(endpoints['employer-stats']);
            setStats(res.data);
        } catch (ex) { console.error(ex); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />;
    if (!stats) return <Text style={Styles.emptyText}>Không thể tải thống kê</Text>;

    return (
        <ScrollView style={Styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
            <Text style={[Styles.subject, { marginTop: 16 }]}>📊 Thống kê tuyển dụng</Text>

            <View style={[Styles.row, { marginHorizontal: 6, gap: 4, marginTop: 8 }]}>
                <StatCard icon="📋" label="Tin tuyển dụng" value={stats.total_jobs} color={COLORS.primary} />
                <StatCard icon="👥" label="Hồ sơ nhận" value={stats.total_applications} color={COLORS.accent} />
                <StatCard icon="👁️" label="Lượt xem" value={stats.total_views} color={COLORS.success} />
            </View>

            <Text style={[Styles.sectionHeader, { marginTop: 20 }]}>📈 Hồ sơ theo tháng</Text>
            <BarChart data={stats.monthly_applications} />
        </ScrollView>
    );
};

export default EmployerStats;
