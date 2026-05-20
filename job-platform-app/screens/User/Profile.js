import { View, Image, ScrollView } from "react-native";
import { Text, Button, Divider } from "react-native-paper";
import { useContext } from "react";
import { MyUserContext } from "../../configs/Contexts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Styles, { COLORS } from "../../styles/Styles";

const Profile = () => {
    const [user, dispatch] = useContext(MyUserContext);

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        dispatch({ type: "LOGOUT" });
    };

    const roleLabel = {
        CANDIDATE: 'Ứng viên',
        EMPLOYER: 'Nhà tuyển dụng',
        ADMIN: 'Quản trị viên',
    }[user?.role] || user?.role || 'Người dùng';

    return (
        <ScrollView style={Styles.container} contentContainerStyle={{ padding: 20, alignItems: 'center', paddingTop: 40 }}>
            <Image
                source={user?.avatar ? { uri: user.avatar } : { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_SIdg4I6b_0_UisjA9zYJp0Z-jI2b-o-Y8A&s' }}
                style={[Styles.avatarLarge, { marginBottom: 12 }]}
            />
            <Text style={[Styles.subject, { fontSize: 20 }]}>{user?.first_name} {user?.last_name}</Text>
            <View style={[Styles.badge, { backgroundColor: COLORS.primary, marginBottom: 16 }]}>
                <Text style={Styles.badgeText}>{roleLabel}</Text>
            </View>

            <View style={[Styles.card, { width: '100%', marginHorizontal: 0 }]}>
                {[
                    { label: 'Tên đăng nhập', value: user?.username },
                    { label: 'Email', value: user?.email },
                ].map((info, i) => (
                    <View key={i}>
                        {i > 0 && <Divider style={{ marginVertical: 8 }} />}
                        <Text style={{ color: COLORS.textLight, fontSize: 12 }}>{info.label}</Text>
                        <Text style={{ fontWeight: '600', color: COLORS.text, marginTop: 2 }}>{info.value || '—'}</Text>
                    </View>
                ))}
            </View>

            <Button
                mode="contained"
                onPress={logout}
                style={[Styles.btn, { marginTop: 24, backgroundColor: '#C62828', width: '100%' }]}
                contentStyle={{ paddingVertical: 6 }}
                icon="logout"
            >
                Đăng xuất
            </Button>
        </ScrollView>
    );
};

export default Profile;
