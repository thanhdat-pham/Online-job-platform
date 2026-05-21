import { View, ScrollView, Alert } from "react-native";
import { Text, Button, Divider, Avatar } from "react-native-paper";
import { useContext } from "react";
import { MyUserContext } from "../../configs/Contexts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Styles, { COLORS } from "../../styles/Styles";
import * as DocumentPicker from 'expo-document-picker'; // Nhớ cài: npx expo install expo-document-picker
import axios from "axios";


const Profile = ({ navigation }) => {
    const [user, dispatch] = useContext(MyUserContext);

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        dispatch({ type: "LOGOUT" });
    };


    // ... bên trong component Profile
    const handleUploadCV = async () => {
        let result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });

        if (!result.canceled) {
            const file = result.assets[0];
            const formData = new FormData();

            // Key 'cv_file' phải khớp với tên trường trong Serializer/Model của Django
            formData.append('cv_file', {
                uri: file.uri,
                name: file.name,
                type: 'application/pdf',
            });

            const token = await AsyncStorage.getItem('token');

            try {
                // Thay URL này bằng endpoint cập nhật profile của bạn
                await axios.patch('http://127.0.0.1:8000/candidates/profile/', formData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,

                    }
                });

                Alert.alert("Thành công", "CV đã được tải lên!");

                // QUAN TRỌNG: Gọi lại API lấy thông tin user để cập nhật Context
                // Nếu bạn không làm bước này, giao diện sẽ vẫn hiển thị "Chưa có CV"
                const res = await axios.get('http://127.0.0.1:8000/users/current-user/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                dispatch({ type: "LOGIN", payload: res.data }); // Cập nhật lại Context

            } catch (error) {
                console.error(error);
                Alert.alert("Lỗi", "Không thể tải lên CV. Kiểm tra lại kết nối.");
            }
        }
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
            { label: 'CV của bạn', value: user?.candidate_profile?.cv_file ? 'Đã tải lên' : 'Chưa có CV' },
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

            <View style={{ width: '100%', marginTop: 20 }}>
                {user?.role === 'CANDIDATE' && (
                    <Button icon="file-pdf-box" mode="contained" onPress={handleUploadCV} style={{ marginBottom: 10 }}>
                        Tải lên CV (PDF)
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