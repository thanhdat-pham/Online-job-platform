import { View, ScrollView, Alert } from "react-native";
import { Text, Button, Divider, Avatar } from "react-native-paper";
import { useContext, useState, useCallback } from "react";
import { MyUserContext } from "../../configs/Contexts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Styles, { COLORS } from "../../styles/Styles";
import { authApis, endpoints } from "../../configs/Apis";
import { useFocusEffect } from "@react-navigation/native";

const Profile = ({ navigation }) => {
    const [user, dispatch] = useContext(MyUserContext);

    const [verifyStatus, setVerifyStatus] = useState(null);
    const [verifyLoading, setVerifyLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (user?.role === 'EMPLOYER') {
                const fetchStatus = async () => {
                    try {
                        const token = await AsyncStorage.getItem('token');

                        const userRes = await authApis(token).get(endpoints['current-user']);
                        const freshUser = userRes.data;
                        console.log('freshUser:', JSON.stringify(freshUser));
                        if (freshUser.is_verified !== user.is_verified) {
                            dispatch({ type: "LOGIN", payload: freshUser });
                        }

                        if (!freshUser.is_verified) {
                            const res = await authApis(token).get(endpoints['verification-status']);
                            setVerifyStatus(res.data.status);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                };
                fetchStatus();
            }
        }, [user?.role])
    );

    const sendVerifyRequest = async () => {
        setVerifyLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            await authApis(token).post(endpoints['request-verification']);
            setVerifyStatus('pending');
            Alert.alert('Đã gửi', 'Yêu cầu xác minh đã được gửi. Admin sẽ xét duyệt sớm.');
        } catch (e) {
            const msg = e?.response?.data?.detail || 'Không thể gửi yêu cầu.';
            Alert.alert('Lỗi', msg);
        } finally {
            setVerifyLoading(false);
        }
    };

    const profile = user?.candidate_profile;

    const isProfileComplete = !!(
        (profile?.education || "").trim().length > 0 &&
        (profile?.skills || "").trim().length > 0 &&
        (profile?.experience || "").trim().length > 0
    );

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        dispatch({ type: "LOGOUT" });
    };

    const roleLabel = user?.role === 'EMPLOYER' ? 'Nhà tuyển dụng' : 'Ứng viên';

    const getProfileInfo = () => {
        if (user?.role === 'EMPLOYER') {
            const employer = user?.employer_profile || user;
            const company = employer?.company_details || {};

            return [
                { label: 'Tên công ty', value: company?.name },
                { label: 'Địa chỉ', value: company?.address },
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

            {user?.role === 'EMPLOYER' && (
                <View style={{ alignItems: 'center', marginVertical: 10 }}>
                    {user?.is_verified ? (
                        <View style={{ backgroundColor: '#e8f5e9', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 }}>
                            <Text style={{ color: '#2e7d32', fontWeight: '600' }}>✅ Tài khoản đã xác minh</Text>
                        </View>
                    ) : verifyStatus === 'pending' ? (
                        <View style={{ backgroundColor: '#fff8e1', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 }}>
                            <Text style={{ color: '#e65100' }}>⏳ Đang chờ admin xét duyệt...</Text>
                        </View>
                    ) : verifyStatus === 'rejected' ? (
                        <>
                            <Text style={{ color: '#c62828', marginBottom: 8 }}>❌ Yêu cầu đã bị từ chối</Text>
                            <Button mode="contained" onPress={sendVerifyRequest} loading={verifyLoading} style={{ backgroundColor: COLORS.primary }}>
                                Gửi lại yêu cầu xác minh
                            </Button>
                        </>
                    ) : (
                        <Button mode="contained" onPress={sendVerifyRequest} loading={verifyLoading} style={{ backgroundColor: COLORS.primary }}>
                            🛡️ Gửi yêu cầu xác minh
                        </Button>
                    )}
                </View>
            )}

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
                            navigation.navigate('EmployerProfile');
                        } else {
                            navigation.navigate('CandidateProfile');
                        }
                    }}
                    style={{ marginBottom: 10, backgroundColor: COLORS.primary }}
                >
                    {user?.role === 'EMPLOYER' ? "Sửa hồ sơ NTD" : (isProfileComplete ? "Sửa hồ sơ" : "Hoàn thiện hồ sơ")}
                </Button>

                <Button icon="lock" mode="outlined" onPress={() => navigation.navigate("")} style={{ marginBottom: 10 }}>
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