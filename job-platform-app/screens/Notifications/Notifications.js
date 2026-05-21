import { useEffect, useState } from "react";
import { FlatList, View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { COLORS } from "../../styles/Styles";

const typeIcon = {
    application_update: '📋',
    interview_invite: '📞',
    job_recommendation: '💡',
    employer_verify: '✅',
    new_application: '👤',
    system: '🔔',
};

const NotificationItem = ({ item, onRead }) => (
    <TouchableOpacity
        onPress={() => !item.is_read && onRead(item.id)}
        style={[Styles.card, { opacity: item.is_read ? 0.7 : 1, borderLeftWidth: item.is_read ? 0 : 3, borderLeftColor: COLORS.primary }]}>
        <View style={Styles.row}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>{typeIcon[item.notification_type] || '🔔'}</Text>
            <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: item.is_read ? '500' : '700', color: COLORS.text, fontSize: 14 }}>
                    {item.title}
                </Text>
                <Text style={{ color: COLORS.textLight, fontSize: 13, marginTop: 2 }} numberOfLines={2}>
                    {item.message}
                </Text>
                <Text style={{ color: COLORS.textLight, fontSize: 11, marginTop: 4 }}>
                    {new Date(item.created_at).toLocaleString('vi-VN')}
                </Text>
            </View>
            {!item.is_read && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: 6 }} />
            )}
        </View>
    </TouchableOpacity>
);

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const res = await authApis(token).get(endpoints['notifications']);
            setNotifications(res.data);
        } catch (ex) { console.error(ex); }
        finally { setLoading(false); }
    };

    const markRead = async (id) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await authApis(token).patch(endpoints['notification-read'](id));
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch { }
    };

    const markAllRead = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            await authApis(token).patch(endpoints['notifications-read-all']);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch { }
    };

    useEffect(() => { load(); }, []);

    if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />;

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <FlatList
            style={Styles.container}
            data={notifications}
            keyExtractor={item => String(item.id)}
            ListHeaderComponent={
                <View style={[Styles.row, { justifyContent: 'space-between', padding: 12 }]}>
                    <Text style={Styles.sectionHeader}>
                        Thông báo {unreadCount > 0 ? `(${unreadCount} chưa đọc)` : ''}
                    </Text>
                    {unreadCount > 0 && (
                        <Button compact mode="outlined" onPress={markAllRead}>Đọc tất cả</Button>
                    )}
                </View>
            }
            ListEmptyComponent={<Text style={Styles.emptyText}>Không có thông báo nào</Text>}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => <NotificationItem item={item} onRead={markRead} />}
        />
    );
};

export default Notifications;
