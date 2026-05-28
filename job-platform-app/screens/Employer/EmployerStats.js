import { useEffect, useState, useCallback } from "react";
import {
    ScrollView, View, Text, ActivityIndicator,
    TouchableOpacity, StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { COLORS } from "../../styles/Styles";

const StatCard = ({ icon, label, value, sub, color }) => (
    <View style={s.statCard}>
        <Text style={s.statIcon}>{icon}</Text>
        <Text style={[s.statValue, { color: color || COLORS.primary }]}>{value ?? "—"}</Text>
        <Text style={s.statLabel}>{label}</Text>
        {sub ? <Text style={s.statSub}>{sub}</Text> : null}
    </View>
);

const PeriodTab = ({ label, active, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        style={[s.tab, active && s.tabActive]}
    >
        <Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
);

const StatusBar = ({ label, count, total, color }) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <View style={{ marginBottom: 10 }}>
            <View style={s.barRow}>
                <Text style={s.barLabel}>{label}</Text>
                <Text style={[s.barCount, { color }]}>{count} ({pct.toFixed(0)}%)</Text>
            </View>
            <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
};

const TrendChart = ({ data }) => {
    if (!data || data.length === 0)
        return <Text style={s.empty}>Chưa có dữ liệu</Text>;

    const max = Math.max(...data.map(d => d.total), 1);
    return (
        <View style={{ marginTop: 6 }}>
            {data.map((d, i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                    <View style={s.barRow}>
                        <Text style={s.barLabel}>{d.label}</Text>
                        <Text style={s.barCount}>{d.total} hồ sơ</Text>
                    </View>
                    <View style={s.barTrack}>
                        <View style={[s.barFill, {
                            width: `${(d.total / max) * 100}%`,
                            backgroundColor: COLORS.primary,
                        }]} />
                    </View>
                    {d.accepted > 0 && (
                        <View style={[s.barTrack, { marginTop: 3, height: 5 }]}>
                            <View style={[s.barFill, {
                                width: `${(d.accepted / max) * 100}%`,
                                backgroundColor: '#2e7d32',
                                height: 5,
                            }]} />
                        </View>
                    )}
                </View>
            ))}
            <View style={s.legend}>
                <View style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: COLORS.primary }]} />
                    <Text style={s.legendText}>Tổng hồ sơ</Text>
                </View>
                <View style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: '#2e7d32' }]} />
                    <Text style={s.legendText}>Trúng tuyển</Text>
                </View>
            </View>
        </View>
    );
};

const JobTable = ({ data }) => {
    if (!data || data.length === 0)
        return <Text style={s.empty}>Chưa có tin tuyển dụng</Text>;
    return (
        <View>
            {data.map((j, i) => (
                <View key={j.id} style={s.jobRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={s.jobTitle} numberOfLines={1}>{j.title}</Text>
                        <Text style={s.jobMeta}>
                            {'\u{1F441}'} {j.views}  ·  {'\u{1F4C4}'} {j.applications} hồ sơ  ·  {'\u{2705}'} {j.accepted} trúng
                        </Text>
                    </View>
                    <View style={s.ratingBadge}>
                        <Text style={s.ratingText}>
                            {j.avg_rating ? `\u{2B50} ${j.avg_rating}` : "—"}
                        </Text>
                    </View>
                </View>
            ))}
        </View>
    );
};

const PERIODS = [
    { key: 'month', label: 'Theo tháng' },
    { key: 'quarter', label: 'Theo quý' },
    { key: 'year', label: 'Theo năm' },
];

const EmployerStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');

    const load = useCallback(async (p) => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await authApis(token).get(
                `${endpoints['employer-stats']}?period=${p}`
            );
            setStats(res.data);
        } catch (ex) {
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(period); }, [period]);

    const sb = stats?.status_breakdown || {};
    const total = stats?.total_applications || 0;

    return (
        <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={s.title}>{'\u{1F4CA}'} Thống kê tuyển dụng</Text>

            <View style={s.cardRow}>
                <StatCard icon={'\u{1F4CB}'} label="Tin đăng" value={stats?.total_jobs} color={COLORS.primary} />
                <StatCard icon={'\u{1F465}'} label="Tổng hồ sơ" value={total} color="#1565c0" />
                <StatCard icon={'\u{1F441}'} label="Lượt xem" value={stats?.total_views} color="#6a1b9a" />
            </View>
            <View style={s.cardRow}>
                <StatCard
                    icon={'\u{2705}'}
                    label="Tỉ lệ chấp nhận"
                    value={stats ? `${stats.acceptance_rate}%` : "—"}
                    color="#2e7d32"
                />
                <StatCard
                    icon={'\u{2B50}'}
                    label="Điểm TB ứng viên"
                    value={stats?.avg_rating ?? "Chưa có"}
                    sub="(thang 1–5)"
                    color="#e65100"
                />
            </View>

            <View style={s.section}>
                <Text style={s.sectionTitle}>{'\u{1F4C2}'} Chất lượng hồ sơ</Text>
                {loading
                    ? <ActivityIndicator color={COLORS.primary} />
                    : <>
                        <StatusBar label="Chờ xử lý" count={sb.pending} total={total} color="#f57c00" />
                        <StatusBar label="Đang phỏng vấn" count={sb.interviewing} total={total} color="#1565c0" />
                        <StatusBar label="Trúng tuyển" count={sb.accepted} total={total} color="#2e7d32" />
                        <StatusBar label="Từ chối" count={sb.rejected} total={total} color="#c62828" />
                    </>
                }
            </View>

            <View style={s.section}>
                <Text style={s.sectionTitle}>{'\u{1F4C8}'} Xu hướng ứng tuyển</Text>
                <View style={s.tabRow}>
                    {PERIODS.map(p => (
                        <PeriodTab
                            key={p.key}
                            label={p.label}
                            active={period === p.key}
                            onPress={() => setPeriod(p.key)}
                        />
                    ))}
                </View>
                {loading
                    ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
                    : <TrendChart data={stats?.trend} />
                }
            </View>

            <View style={s.section}>
                <Text style={s.sectionTitle}>{'\u{1F3C6}'} Hiệu quả từng tin đăng</Text>
                <Text style={s.sectionNote}>Top 10 tin có nhiều hồ sơ nhất</Text>
                {loading
                    ? <ActivityIndicator color={COLORS.primary} />
                    : <JobTable data={stats?.job_performance} />
                }
            </View>
        </ScrollView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    title: { fontSize: 18, fontWeight: '700', color: COLORS.primary, margin: 16, marginBottom: 10 },

    cardRow: { flexDirection: 'row', gap: 8, marginHorizontal: 12, marginBottom: 8 },
    statCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12,
        alignItems: 'center', elevation: 1,
    },
    statIcon: { fontSize: 22, marginBottom: 4 },
    statValue: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 11, color: '#666', textAlign: 'center', marginTop: 2 },
    statSub: { fontSize: 10, color: '#999', marginTop: 1 },

    section: {
        backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 12,
        marginBottom: 14, padding: 14, elevation: 1,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 12 },
    sectionNote: { fontSize: 12, color: '#999', marginTop: -8, marginBottom: 10 },

    barRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    barLabel: { fontSize: 13, color: '#555' },
    barCount: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
    barTrack: { height: 8, borderRadius: 4, backgroundColor: '#E8EAF6', overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },

    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    tab: {
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1, borderColor: '#ccc',
    },
    tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tabText: { fontSize: 12, color: '#666' },
    tabTextActive: { color: '#fff', fontWeight: '600' },

    legend: { flexDirection: 'row', gap: 16, marginTop: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: '#555' },

    jobRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee',
    },
    jobTitle: { fontSize: 13, fontWeight: '600', color: '#333' },
    jobMeta: { fontSize: 12, color: '#888', marginTop: 3 },
    ratingBadge: {
        backgroundColor: '#FFF8E1', borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 4,
    },
    ratingText: { fontSize: 12, color: '#e65100', fontWeight: '600' },

    empty: { color: '#aaa', fontSize: 13, textAlign: 'center', marginVertical: 16 },
});

export default EmployerStats;