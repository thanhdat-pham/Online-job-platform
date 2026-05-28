import { useEffect, useState } from "react";
import { FlatList, View, Text, ActivityIndicator, Alert } from "react-native";
import { Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { COLORS } from "../../styles/Styles";
import { useNavigation } from "@react-navigation/native";

const SavedJobs = () => {
    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const nav = useNavigation();

    const load = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const res = await authApis(token).get(endpoints['saved-jobs']);
            setSavedJobs(res.data);
        } catch (ex) {
            console.error(ex);
        } finally {
            setLoading(false);
        }
    };

    const unsave = async (jobId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await authApis(token).post(endpoints['save-job'](jobId));
            setSavedJobs(prev => prev.filter(s => s.job.id !== jobId));
        } catch {
            Alert.alert("Lỗi", "Không thể bỏ lưu việc làm!");
        }
    };

    useFocusEffect(
        useCallback(() => {
            load();
        }, [])
    );

    if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />;

    return (
        <FlatList
            style={Styles.container}
            data={savedJobs}
            keyExtractor={item => String(item.saved_id || item.id)}
            ListEmptyComponent={<Text style={Styles.emptyText}>Bạn chưa lưu việc làm nào</Text>}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
                <View style={Styles.card}>
                    <Text style={{ fontWeight: '700', fontSize: 15, color: COLORS.text }}>{item.job.title}</Text>
                    <Text style={{ color: COLORS.primary, marginTop: 2 }}>🏢 {item.job.employer?.company_name || 'Công ty'}</Text>
                    <Text style={{ color: COLORS.textLight, fontSize: 12, marginTop: 4 }}>
                        📌 {item.job.location} · 📅 Hạn: {item.job.deadline ? new Date(item.job.deadline).toLocaleDateString('vi-VN') : '—'}
                    </Text>
                    <View style={[Styles.row, { marginTop: 10, justifyContent: 'flex-end', gap: 8 }]}>
                        <Button compact mode="contained"
                            buttonColor={COLORS.primary}
                            onPress={() => nav.navigate('jobs', {
                                screen: 'job-detail',
                                params: { jobId: item.job.id }
                            })}>
                            Xem việc
                        </Button>
                        <Button compact mode="outlined" textColor={COLORS.danger}
                            onPress={() => unsave(item.job.id)}>
                            Bỏ lưu
                        </Button>
                    </View>
                </View>
            )}
        />
    );
};

export default SavedJobs;