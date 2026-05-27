import { useEffect, useState, useMemo } from "react";
import { FlatList, View, Text, ActivityIndicator, Alert, TouchableOpacity, Modal } from "react-native";
import { Button, Menu, TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { COLORS } from "../../styles/Styles";
import { useNavigation } from "@react-navigation/native";

const STATUS_OPTIONS = [
    { value: 'reviewed', label: '📖 Đã xem xét', display: 'Đã xem xét' },
    { value: 'interviewing', label: '📞 Mời phỏng vấn', display: 'Phỏng vấn' },
    { value: 'accepted', label: '✅ Chấp nhận', display: 'Chấp nhận' },
    { value: 'rejected', label: '❌ Từ chối', display: 'Từ chối' },
];

const statusInfo = {
    pending: { label: 'Chờ xem xét', color: '#F57F17' },
    reviewed: { label: 'Đã xem xét', color: '#1565C0' },
    interviewing: { label: 'Phỏng vấn', color: '#6A1B9A' },
    accepted: { label: 'Chấp nhận', color: '#2E7D32' },
    rejected: { label: 'Từ chối', color: '#C62828' },
};

const AppCard = ({ item, jobId, onUpdate, onViewProfile }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const [noteVisible, setNoteVisible] = useState(false);
    const [note, setNote] = useState(item.employers_note || '');
    const [savingNote, setSavingNote] = useState(false);

    const info = statusInfo[item.status] || { label: item.status, color: COLORS.primary };
    const candidateName = item.candidate_name || 'Ứng viên';

    const updateRating = (val) => {
        onUpdate(item.id, { rating: val });

        AsyncStorage.getItem('token').then(token => {
            authApis(token).post(endpoints['review-application'](jobId), {
                application_id: item.id,
                rating: val,
            }).catch(() => {
                onUpdate(item.id, { rating: item.rating });
            });
        });
    };

    const updateStatus = async (newStatus) => {
        setMenuVisible(false);
        try {
            const token = await AsyncStorage.getItem('token');
            await authApis(token).post(endpoints['review-application'](jobId), {
                application_id: item.id,
                status: newStatus,
            });
            onUpdate(item.id, {
                status: newStatus,
                status_display: STATUS_OPTIONS.find(s => s.value === newStatus)?.display ?? newStatus,
            });
        } catch {
            Alert.alert("Lỗi", "Không thể cập nhật trạng thái!");
        }
    };

    const saveNote = async () => {
        setSavingNote(true);
        try {
            const token = await AsyncStorage.getItem('token');
            await authApis(token).post(endpoints['review-application'](jobId), {
                application_id: item.id,
                employers_note: note,
            });
            onUpdate(item.id, { employers_note: note });
            setNoteVisible(false);
            Alert.alert("Đã lưu", "Ghi chú đã được lưu!");
        } catch {
            Alert.alert("Lỗi", "Không thể lưu ghi chú!");
        } finally {
            setSavingNote(false);
        }
    };

    return (
        <View style={Styles.card}>
            <View style={[Styles.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', fontSize: 15, color: COLORS.primary }}>{candidateName}</Text>
                    <Text style={{ color: COLORS.textLight, fontSize: 12, marginTop: 2 }}>
                        Nộp lúc: {new Date(item.applied_at).toLocaleString('vi-VN')}
                    </Text>
                </View>
                <View style={[Styles.badge, { backgroundColor: info.color }]}>
                    <Text style={Styles.badgeText}>{info.label}</Text>
                </View>
            </View>

            {item.cover_letter ? (
                <Text style={{ color: COLORS.text, marginTop: 8, fontSize: 13, lineHeight: 18 }} numberOfLines={3}>📄 {item.cover_letter}</Text>
            ) : null}

            {item.employers_note ? (
                <View style={{ marginTop: 6, padding: 8, backgroundColor: '#FFF9C4', borderRadius: 6 }}>
                    <Text style={{ fontSize: 12, color: '#5D4037' }}>📝 Ghi chú: {item.employers_note}</Text>
                </View>
            ) : null}
            <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: COLORS.textLight, marginRight: 8 }}>Đánh giá:</Text>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Text
                        key={star}
                        onPress={() => updateRating(star)}
                        style={{ fontSize: 24, paddingHorizontal: 2 }}
                    >
                        {star <= (item.rating || 0) ? "⭐" : "☆"}
                    </Text>
                ))}
            </View>
            <View style={[Styles.row, { marginTop: 10, flexWrap: 'wrap', gap: 6 }]}>
                <Button compact mode="outlined" icon="account" onPress={() => onViewProfile(item.candidate)}>Xem hồ sơ</Button>
                <Button compact mode="outlined" icon="note-edit" onPress={() => setNoteVisible(!noteVisible)}>Ghi chú</Button>
                <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={<Button compact mode="outlined" onPress={() => setMenuVisible(true)}>Trạng thái ▾</Button>}
                >
                    {STATUS_OPTIONS.map(s => (
                        <Menu.Item key={s.value} onPress={() => updateStatus(s.value)} title={s.label} />
                    ))}
                </Menu>
            </View>

            {noteVisible && (
                <View style={{ marginTop: 10 }}>
                    <TextInput
                        label="Nhập ghi chú của bạn"
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={3}
                        style={Styles.input}
                    />
                    <Button mode="contained" loading={savingNote} onPress={saveNote} style={[Styles.btn, { backgroundColor: COLORS.primary }]}>
                        Lưu ghi chú
                    </Button>
                </View>
            )}
        </View>
    );
};

const ViewApplications = () => {
    const nav = useNavigation();
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [apps, setApps] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [loadingApps, setLoadingApps] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredJobs = useMemo(() => {
        return jobs.filter(job =>
            job.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [jobs, searchQuery]);

    const loadJobs = async () => {
        try {
            setLoadingJobs(true);
            const token = await AsyncStorage.getItem('token');
            const res = await authApis(token).get(endpoints['employer-jobs']);
            const data = res.data.results ?? res.data;
            setJobs(data);
            if (data.length > 0) setSelectedJob(data[0]);
        } catch (ex) { console.error(ex); }
        finally { setLoadingJobs(false); }
    };

    const loadApps = async (job) => {
        if (!job) return;
        try {
            setLoadingApps(true);
            const token = await AsyncStorage.getItem('token');
            const res = await authApis(token).get(endpoints['employer-job-applications'](job.id));
            setApps(res.data.results ?? res.data);
        } catch (ex) { console.error(ex); }
        finally { setLoadingApps(false); }
    };

    const handleUpdate = (appId, updates) => {
        setApps(prev => prev.map(a => a.id === appId ? { ...a, ...updates } : a));
    };

    useEffect(() => { loadJobs(); }, []);
    useEffect(() => { if (selectedJob) loadApps(selectedJob); }, [selectedJob]);

    if (loadingJobs) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />;

    if (jobs.length === 0) return (
        <View style={[Styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
            <Text style={{ fontSize: 16, color: COLORS.textLight }}>Bạn chưa đăng tin tuyển dụng nào</Text>
        </View>
    );

    return (
        <View style={Styles.container}>
            <View style={{ padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' }}>
                <Text style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 5 }}>Tin tuyển dụng:</Text>
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={{ padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <Text style={{ flex: 1 }} numberOfLines={1}>{selectedJob?.title || "Chọn tin..."}</Text>
                    <Text>▼</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={modalVisible} animationType="slide" transparent={false}>
                <View style={{ flex: 1, paddingTop: 50, paddingHorizontal: 20 }}>
                    <Button icon="close" onPress={() => setModalVisible(false)} style={{ marginBottom: 10 }}>Đóng danh sách</Button>
                    <TextInput
                        label="Tìm kiếm tin..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        mode="outlined"
                        style={{ marginBottom: 10, backgroundColor: '#fff' }}
                    />
                    <FlatList
                        data={filteredJobs}
                        keyExtractor={item => String(item.id)}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={{ padding: 20, borderBottomWidth: 1, borderColor: '#eee' }}
                                onPress={() => {
                                    setSelectedJob(item);
                                    setModalVisible(false);
                                    setSearchQuery('');
                                }}
                            >
                                <Text style={{ fontWeight: selectedJob?.id === item.id ? 'bold' : 'normal', color: selectedJob?.id === item.id ? COLORS.primary : '#000' }}>
                                    {item.title}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>

            {loadingApps
                ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />
                : <FlatList
                    data={apps}
                    extraData={apps}
                    keyExtractor={item => String(item.id)}
                    ListHeaderComponent={
                        <Text style={Styles.sectionHeader}>
                            Hồ sơ: {selectedJob?.title} ({apps.length})
                        </Text>
                    }
                    ListEmptyComponent={<Text style={Styles.emptyText}>Chưa có hồ sơ nào</Text>}
                    contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 10 }}
                    renderItem={({ item }) => (
                        <AppCard
                            item={item}
                            jobId={selectedJob?.id}
                            onUpdate={handleUpdate}
                            onViewProfile={(candidateId) => nav.navigate('candidate-profile-view', { candidateId })}
                        />
                    )}
                />
            }
        </View>
    );
};

export default ViewApplications;