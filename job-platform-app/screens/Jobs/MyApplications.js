import { View, FlatList } from "react-native";
import { Text, Card, Chip } from "react-native-paper";
import { useState, useEffect, useContext } from "react";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../configs/Contexts";
import Styles, { COLORS } from "../../styles/Styles";

const MyApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user] = useContext(MyUserContext);

    useEffect(() => {
        const load = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const res = await authApis(token).get(endpoints['my-applications']);
                setApplications(res.data);
            } catch (e) {
                console.error("Lỗi tải hồ sơ:", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const statusColor = {
        'PENDING': '#FFA000',
        'ACCEPTED': '#2E7D32',
        'REJECTED': '#C62828',
    };

    const statusLabel = {
        'PENDING': 'Đang chờ',
        'ACCEPTED': 'Đã chấp nhận',
        'REJECTED': 'Từ chối',
    };

    return (
        <View style={[Styles.container, { padding: 16 }]}>
            {loading ? (
                <Text>Đang tải...</Text>
            ) : applications.length === 0 ? (
                <Text style={{ color: COLORS.textLight, textAlign: 'center', marginTop: 40 }}>
                    Bạn chưa nộp hồ sơ nào.
                </Text>
            ) : (
                <FlatList
                    data={applications}
                    keyExtractor={item => String(item.id)}
                    renderItem={({ item }) => (
                        <Card style={[Styles.card, { marginBottom: 12 }]}>
                            <Card.Content>
                                <Text style={{ fontWeight: '700', fontSize: 16 }}>{item.job?.title}</Text>
                                <Text style={{ color: COLORS.textLight, marginTop: 4 }}>{item.job?.company?.name}</Text>
                                <Chip
                                    style={{ marginTop: 8, backgroundColor: statusColor[item.status] || '#888', alignSelf: 'flex-start' }}
                                    textStyle={{ color: '#fff' }}
                                >
                                    {statusLabel[item.status] || item.status}
                                </Chip>
                            </Card.Content>
                        </Card>
                    )}
                />
            )}
        </View>
    );
};

export default MyApplications;