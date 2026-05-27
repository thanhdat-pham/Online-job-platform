import { useState, useCallback, useContext } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { COLORS } from "../../styles/Styles";

const MenuItem = ({ icon, title, subtitle, onPress, color, disabled }) => (
    <TouchableOpacity
        style={[Styles.card, { flexDirection: 'row', alignItems: 'center', opacity: disabled ? 0.4 : 1 }]}
        onPress={onPress}
        activeOpacity={0.8}
    >
        <View style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: color || COLORS.chip, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <Text style={{ fontSize: 24 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', fontSize: 15, color: COLORS.text }}>{title}</Text>
            <Text style={{ color: COLORS.textLight, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
        </View>
        <Text style={{ color: COLORS.textLight, fontSize: 20 }}>›</Text>
    </TouchableOpacity>
);

const EmployerDashboard = () => {
    const nav = useNavigation();
    const [user, dispatch] = useContext(MyUserContext);
    const [refreshKey, setRefreshKey] = useState(0);

    const loadUser = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (token) {
                const res = await authApis(token).get(endpoints['current-user'], {
                    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
                });
                dispatch({ type: "login", payload: res.data });
                setRefreshKey(prev => prev + 1);
            }
        } catch (err) {
            console.error(err);
        }
    }, [dispatch]);

    useFocusEffect(
        useCallback(() => {
            loadUser();
        }, [loadUser])
    );

    const requireVerified = (action) => {
        if (!user?.is_verified) {
            Alert.alert("Chưa xác minh", "Tài khoản chưa được xác minh. Vui lòng chờ admin duyệt.");
            return;
        }
        action();
    };

    return (
        <ScrollView key={refreshKey} style={Styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
            <View style={{ backgroundColor: COLORS.primary, padding: 24, paddingTop: 40 }}>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>🏢 Nhà Tuyển Dụng</Text>
                <Text style={{ color: '#B3D9FF', marginTop: 4, fontSize: 14 }}>Quản lý tin tuyển dụng và ứng viên</Text>
            </View>

            {!user?.is_verified && (
                <View style={{ backgroundColor: '#fff8e1', margin: 16, padding: 12, borderRadius: 8 }}>
                    <Text style={{ color: '#e65100', fontSize: 13 }}>⚠️ Tài khoản chưa được xác minh. Một số chức năng bị hạn chế.</Text>
                </View>
            )}

            <Text style={Styles.sectionHeader}>Quản lý tin tuyển dụng</Text>
            <MenuItem icon="📝" title="Đăng tin tuyển dụng" subtitle="Tạo tin tuyển dụng mới" color="#E3F2FD"
                disabled={!user?.is_verified}
                onPress={() => requireVerified(() => nav.navigate('post-job'))} />
            <MenuItem icon="📋" title="Danh sách tin đăng" subtitle="Xem và quản lý tin tuyển dụng" color="#F3E5F5"
                disabled={!user?.is_verified}
                onPress={() => requireVerified(() => nav.navigate('manage-jobs'))} />

            <Text style={Styles.sectionHeader}>Quản lý ứng viên</Text>
            <MenuItem icon="👥" title="Xem hồ sơ ứng tuyển" subtitle="Duyệt và xem xét hồ sơ ứng viên" color="#E8F5E9"
                disabled={!user?.is_verified}
                onPress={() => requireVerified(() => nav.navigate('view-applications'))} />
            <MenuItem
                icon="📊"
                title="Thống kê tuyển dụng"
                subtitle="Xem báo cáo hiệu quả tuyển dụng"
                color="#FFF3E0"
                disabled={!user?.is_verified}
                onPress={() => requireVerified(() => nav.navigate('employer-stats'))}
            />
        </ScrollView>
    );
};

export default EmployerDashboard;