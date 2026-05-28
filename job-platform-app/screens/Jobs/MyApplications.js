import { View, FlatList, Alert, ActivityIndicator } from "react-native";
import { Text, Card, Chip, Button } from "react-native-paper";
import { useState, useEffect, useCallback } from "react";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Styles, { COLORS } from "../../styles/Styles";
import { useNavigation } from "@react-navigation/native";

const STATUS_CONFIG = {
    pending: { label: 'Chờ xử lý', color: '#F57C00', bg: '#FFF3E0' },
    reviewed: { label: 'Đã xem hồ sơ', color: '#1565C0', bg: '#E3F2FD' },
    interviewing: { label: 'Đang phỏng vấn', color: '#6A1B9A', bg: '#F3E5F5' },
    accepted: { label: 'Trúng tuyển', color: '#2E7D32', bg: '#E8F5E9' },
    rejected: { label: 'Từ chối', color: '#C62828', bg: '#FFEBEE' },
};

const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const MyApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [withdrawing, setWithdrawing] = useState(null);
    const navigation = useNavigation();

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const res = await authApis(token).get(endpoints['my-applications']);
            const data = res.data.results ?? res.data;
            setApplications(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {
            load();
        });
        return unsubscribe;
    }, [navigation, load]);

    const handleWithdraw = (appId) => {
        Alert.alert("Rút đơn ứng tuyển", "Bạn chắc chắn muốn rút đơn? Hành động không thể hoàn tác.", [
            { text: 'Huỷ', style: 'cancel' },
            {
                text: 'Rút đơn', style: 'destructive', onPress: async () => {
                    try {
                        setWithdrawing(appId);
                        const token = await AsyncStorage.getItem('token');
                        await authApis(token).delete(endpoints['withdraw-application'](appId));
                        setApplications(prev => prev.filter(a => a.id !== appId));
                    } catch (e) {
                        const statusCode = e?.response?.status;
                        if (statusCode === 204 || statusCode === 200) {
                            setApplications(prev => prev.filter(a => a.id !== appId));
                        } else {
                            Alert.alert("Không thể rút đơn", e?.response?.data?.detail || "Đã xảy ra lỗi.");
                        }
                    } finally {
                        setWithdrawing(null);
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }) => {
        const cfg = STATUS_CONFIG[item.status] || { label: item.status, color: '#888', bg: '#eee' };
        return (
            <Card style={[Styles.card, { marginBottom: 12 }]}>
                <Card.Content>
                    <Text style={{ fontWeight: '700', fontSize: 16, color: COLORS.text }}>{item.job?.title}</Text>
                    {item.job?.company_name ? <Text style={{ color: COLORS.textLight, marginTop: 2, fontSize: 13 }}>🏢 {item.job.company_name}</Text> : null}
                    {item.job?.location ? <Text style={{ color: COLORS.textLight, marginTop: 2, fontSize: 13 }}>📌 {item.job.location}</Text> : null}

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
                        <Chip style={{ backgroundColor: cfg.bg }} textStyle={{ color: cfg.color, fontWeight: '600', fontSize: 12 }}>
                            {cfg.label}
                        </Chip>
                        <Text style={{ color: COLORS.textLight, fontSize: 12 }}>Ngày nộp: {formatDate(item.applied_at)}</Text>
                    </View>

                    {item.rating > 0 && (
                        <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, color: COLORS.textLight, marginRight: 8 }}>Đánh giá từ NTD:</Text>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Text key={star} style={{ fontSize: 18 }}>
                                    {star <= item.rating ? "⭐" : "☆"}
                                </Text>
                            ))}
                        </View>
                    )}

                    {item.employers_note ? (
                        <View style={{ marginTop: 8, padding: 8, backgroundColor: '#FFF9C4', borderRadius: 6 }}>
                            <Text style={{ fontSize: 12, color: '#5D4037' }}>📝 Ghi chú từ NTD: {item.employers_note}</Text>
                        </View>
                    ) : null}

                    {item.status === 'pending' && (
                        <Button
                            mode="outlined" compact icon="close-circle-outline"
                            loading={withdrawing === item.id}
                            disabled={withdrawing === item.id}
                            onPress={() => handleWithdraw(item.id)}
                            style={{ marginTop: 10, alignSelf: 'flex-start', borderColor: '#C62828' }}
                            textColor="#C62828"
                        >
                            Rút đơn
                        </Button>
                    )}
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={[Styles.container, { padding: 16 }]}>
            {loading || withdrawing ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={{ color: COLORS.textLight, marginTop: 12 }}>
                        {withdrawing ? "Đang rút đơn..." : "Đang tải..."}
                    </Text>
                </View>
            ) : applications.length === 0 ? (
                <View style={{ alignItems: 'center', marginTop: 60 }}>
                    <Text style={{ fontSize: 40 }}>📭</Text>
                    <Text style={{ color: COLORS.textLight, marginTop: 12, fontSize: 15 }}>Bạn chưa nộp hồ sơ nào.</Text>
                </View>
            ) : (
                <FlatList data={applications} keyExtractor={i => String(i.id)} renderItem={renderItem} showsVerticalScrollIndicator={false} />
            )}
        </View>
    );
};

export default MyApplications;