import { useEffect, useState } from "react";
import { FlatList, View, Text, ActivityIndicator, Alert } from "react-native";
import { Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { COLORS } from "../../styles/Styles";
import { useNavigation, useRoute } from "@react-navigation/native";

const ManageJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const nav = useNavigation();
    const route = useRoute();

    const load = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const res = await authApis(token).get(endpoints['employer-jobs']);
            const data = res.data.results ?? res.data;
            setJobs(data);
            if (route.params?.openApplications && data.length > 0) {
                nav.navigate('view-applications', { jobId: data[0].id, jobTitle: data[0].title });
            }
        } catch (ex) { console.error(ex); }
        finally { setLoading(false); }
    };

    const deleteJob = async (id) => {
        Alert.alert("Xác nhận", "Bạn có chắc muốn xóa tin này?", [
            { text: 'Hủy' },
            {
                text: 'Xóa', style: 'destructive', onPress: async () => {
                    const token = await AsyncStorage.getItem('token');
                    await authApis(token).delete(endpoints['employer-job-detail'](id));
                    setJobs(prev => prev.filter(j => j.id !== id));
                }
            }
        ]);
    };

    useEffect(() => {
        const unsubscribe = nav.addListener('focus', load);
        return unsubscribe;
    }, [nav]);

    if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />;

    return (
        <FlatList
            style={Styles.container}
            data={jobs}
            keyExtractor={item => String(item.id)}
            ListEmptyComponent={<Text style={Styles.emptyText}>Bạn chưa đăng tin tuyển dụng nào</Text>}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
                <View style={Styles.card}>
                    <Text style={{ fontWeight: '700', fontSize: 15, color: COLORS.text }}>{item.title}</Text>
                    <Text style={{ color: COLORS.textLight, fontSize: 13, marginTop: 4 }}>
                        📍 {item.location} · 📅 {item.deadline ? new Date(item.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                    </Text>
                    <View style={[Styles.row, { marginTop: 10, justifyContent: 'flex-end', flexWrap: 'wrap', gap: 6 }]}>

                        <Button
                            compact mode="contained"
                            buttonColor={COLORS.secondary}
                            onPress={() => nav.navigate('post-job', { editJob: item })}
                        >
                            Sửa tin
                        </Button>
                        <Button compact mode="outlined" textColor={COLORS.danger} onPress={() => deleteJob(item.id)}>
                            Xóa
                        </Button>
                    </View>
                </View>
            )}
        />
    );
};

export default ManageJobs;