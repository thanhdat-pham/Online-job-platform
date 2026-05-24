import { View, ScrollView, Alert } from "react-native";
import { Text, Button, Divider, Avatar } from "react-native-paper";
import { useContext } from "react";
import { MyUserContext } from "../../configs/Contexts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Styles, { COLORS } from "../../styles/Styles";

const Profile = ({ navigation }) => {
    const [user, dispatch] = useContext(MyUserContext);

    // Kiểm tra trạng thái hoàn thiện hồ sơ

    const isProfileComplete = !!(
        (profile?.education || "").trim().length > 0 &&
        (profile?.skills || "").trim().length > 0 &&
        (profile?.experience || "").trim().length > 0
    );
    const profile = user?.candidate_profile;


    const logout = async () => {
        await AsyncStorage.removeItem('token');
        dispatch({ type: "LOGOUT" });
    };

    const roleLabel = user?.role === 'EMPLOYER' ? 'Nhà tuyển dụng' : 'Ứng viên';

    const getProfileInfo = () => {
        if (user?.role === 'EMPLOYER') {
            // Ưu tiên lấy từ employer_profile nếu có, sau đó là lấy trực tiếp nếu dữ liệu phẳng
            const employer = user?.employer_profile || user;
            const company = employer?.company_details || {};

            return [
                { label: 'Tên công ty', value: company?.name },
                {
                    label: 'Địa chỉ',
                    value: company?.address
                },
                { label: 'Email', value: user?.email },
            ];
        }

        // Dành cho Candidate
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

            {/* Thông báo tình trạng hồ sơ */}
            {user?.role === 'CANDIDATE' && !isProfileComplete && (
                <Text style={{ color: COLORS.primary, fontSize: 13, marginVertical: 12, fontStyle: 'italic' }}>
                    ⚠️ Bạn chưa cập nhật đầy đủ hồ sơ.

                </Text>
            )}

            <View style={{ width: '100%', marginTop: 20 }}>
                <Button
                    mode="contained"
                    onPress={() => {
                        if (user?.role === 'EMPLOYER') {
                            navigation.navigate('EmployerProfile'); // Điều hướng tới màn hình mới của NTD
                        } else {
                            navigation.navigate('CandidateProfile'); // Giữ nguyên cho ứng viên
                        }
                    }}
                    style={{
                        marginBottom: 10,
                        backgroundColor: COLORS.primary
                    }}
                >
                    {user?.role === 'EMPLOYER' ? "Sửa hồ sơ NTD" : (isProfileComplete ? "Sửa hồ sơ" : "Hoàn thiện hồ sơ")}
                </Button>

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