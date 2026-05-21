import { View, ScrollView, Alert } from "react-native";
import { Text, Button, Divider, Avatar } from "react-native-paper";
import { useContext } from "react";
import { MyUserContext } from "../../configs/Contexts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Styles, { COLORS } from "../../styles/Styles";

const Profile = ({ navigation }) => {
    const [user, dispatch] = useContext(MyUserContext);

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        dispatch({ type: "LOGOUT" });
    };

    const roleLabel = user?.role === 'EMPLOYER' ? 'Nhà tuyển dụng' : 'Ứng viên';

    const getProfileInfo = () => {
        if (user?.role === 'EMPLOYER') {
            return [
                { label: 'Tên công ty', value: user?.company_name },
                { label: 'Địa chỉ', value: user?.company_address },
                { label: 'Email', value: user?.email },
            ];
        }
        return [
            { label: 'Họ và tên', value: user?.full_name },
            { label: 'Số điện thoại', value: user?.phone_number || 'Chưa cập nhật' },
            { label: 'Email', value: user?.email },

        ];
    };

    return (
        <ScrollView style={Styles.container} contentContainerStyle={{ padding: 20, alignItems: 'center', paddingTop: 40 }}>
            <Avatar.Image size={100} source={{ uri: user?.avatar || 'https://bit.ly/3yL7S9t' }} />
            <Text style={[Styles.subject, { fontSize: 20, marginTop: 10 }]}>{user?.username}</Text>
            <View style={[Styles.badge, { backgroundColor: COLORS.primary, marginVertical: 10 }]}>
                <Text style={Styles.badgeText}>{roleLabel}</Text>
            </View>

            <View style={[Styles.card, { width: '100%' }]}>
                {getProfileInfo().map((info, i) => (
                    <View key={i} style={{ marginBottom: 10 }}>
                        {i > 0 && <Divider style={{ marginVertical: 5 }} />}
                        <Text style={{ color: COLORS.textLight, fontSize: 12 }}>{info.label}</Text>
                        <Text style={{ fontWeight: '600' }}>{info.value || '—'}</Text>
                    </View>
                ))}
            </View>
            {user?.role === 'CANDIDATE' && user?.candidate_profile?.cv_file ? (
                <View style={{ width: '100%', marginTop: 15, marginBottom: 5 }}>
                    <Text style={{ fontSize: 13, color: COLORS.textLight, marginBottom: 6, fontWeight: '600' }}>
                        📄 Nội dung CV hiện tại:
                    </Text>
                    <View style={{ width: '100%', height: 380, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#E0E0E0' }}>
                        <WebView
                            originWhitelist={['*']}
                            source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(user.candidate_profile.cv_file)}` }}
                            style={{ flex: 1 }}
                            startInLoadingState={true}
                            scalesPageToFit={true}
                        />
                    </View>
                </View>
            ) : user?.role === 'CANDIDATE' ? (
                <Text style={{ color: COLORS.textLight, fontSize: 13, marginVertical: 12, fontStyle: 'italic' }}>
                    ⚠️ Bạn chưa cập nhật file CV lên hệ thống.
                </Text>
            ) : null}
            <View style={{ width: '100%', marginTop: 20 }}>
                {user?.role === 'CANDIDATE' && (
                    <Button
                        icon={user?.candidate_profile?.cv_file ? "file-replace" : "upload"}
                        mode={user?.candidate_profile?.cv_file ? "outlined" : "contained"} // Có rồi thì hiện viền (outlined), chưa có thì hiện nút đầy (contained)
                        onPress={() => navigation.navigate('CandidateProfile')}
                        style={{ marginBottom: 10, borderColor: COLORS.primary }}
                        labelStyle={{ color: user?.candidate_profile?.cv_file ? COLORS.primary : '#fff' }}
                    >
                        {user?.candidate_profile?.cv_file ? "Đổi CV khác" : "Tải lên CV"}
                    </Button>
                )}

                <Button icon="lock" mode="outlined" onPress={() => Alert.alert("Thông báo", "Chức năng đổi mật khẩu đang được phát triển!")} style={{ marginBottom: 10 }}>
                    Đổi mật khẩu
                </Button>

                <Button icon="logout" mode="contained" onPress={logout} style={{ backgroundColor: '#C62828' }}>
                    Đăng xuất
                </Button>
            </View>
        </ScrollView>
    );
};

export default Profile;