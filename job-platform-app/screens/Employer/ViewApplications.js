import { useEffect, useState } from "react";
import { FlatList, View, Text, ActivityIndicator, Alert, Linking, Modal, StyleSheet } from "react-native";
import { Button, Menu, TextInput } from "react-native-paper";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { COLORS } from "../../styles/Styles";

const STATUS_OPTIONS = [
    { value: 'reviewed', label: '📖 Đã xem xét' },
    { value: 'interviewing', label: '📞 Mời phỏng vấn' },
    { value: 'accepted', label: '✅ Chấp nhận' },
    { value: 'rejected', label: '❌ Từ chối' },
];

const statusInfo = {
    pending: { label: 'Chờ xem xét', color: '#F57F17' },
    reviewed: { label: 'Đã xem xét', color: '#1565C0' },
    interviewing: { label: 'Phỏng vấn', color: '#6A1B9A' },
    accepted: { label: 'Chấp nhận', color: '#2E7D32' },
    rejected: { label: 'Từ chối', color: '#C62828' },
};

// ── CV Viewer Modal ──────────────────────────────────────────────────────────
const CVViewerModal = ({ url, visible, onClose }) => {
    if (!url) return null;

    // Google Docs Viewer nhúng PDF ngay trong app, không cần tải về
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>📄 Xem CV ứng viên</Text>
                <Button onPress={onClose} textColor={COLORS.primary}>Đóng</Button>
            </View>
            <WebView
                source={{ uri: googleViewerUrl }}
                style={{ flex: 1 }}
                startInLoadingState
                renderLoading={() => (
                    <View style={Styles.center}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                        <Text style={{ marginTop: 8, color: COLORS.textLight }}>Đang tải CV...</Text>
                    </View>
                )}
            />
        </Modal>
    );
};

// ── App Card ─────────────────────────────────────────────────────────────────
const AppCard = ({ item, jobId, onUpdate }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const [noteVisible, setNoteVisible] = useState(false);
    const [cvVisible, setCvVisible] = useState(false);   // ← mới
    const [note, setNote] = useState(item.employers_note || '');
    const [savingNote, setSavingNote] = useState(false);

    const info = statusInfo[item.status] || { label: item.status, color: COLORS.primary };
    const cvUrl = item.candidate?.cv_file;
    const candidateName =
        item.candidate?.full_name ||
        `${item.candidate?.first_name || ''} ${item.candidate?.last_name || ''}`.trim() ||
        item.candidate?.username ||
        'Ứng viên';

    const updateStatus = async (newStatus) => {
        setMenuVisible(false);
        try {
            const token = await AsyncStorage.getItem('token');
            await authApis(token).post(endpoints['review-application'](jobId), {
                application_id: item.id,
                status: newStatus,
            });
            onUpdate(item.id, { status: newStatus });
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
            {/* Header */}
            <View style={[Styles.row, { justifyContent: 'space-between' }]}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', fontSize: 14, color: COLORS.text }}>
                        {candidateName}
                    </Text>
                    <Text style={{ color: COLORS.textLight, fontSize: 12 }}>@{item.candidate?.username}</Text>
                </View>
                <View style={[Styles.badge, { backgroundColor: info.color }]}>
                    <Text style={Styles.badgeText}>{info.label}</Text>
                </View>
            </View>

            {/* Cover letter */}
            {item.cover_letter && (
                <Text style={{ color: COLORS.text, marginTop: 8, fontSize: 13, lineHeight: 18 }} numberOfLines={3}>
                    📄 {item.cover_letter}
                </Text>
            )}

            {/* Employer note */}
            {item.employers_note ? (
                <View style={{ marginTop: 6, padding: 8, backgroundColor: '#FFF9C4', borderRadius: 6 }}>
                    <Text style={{ fontSize: 12, color: '#5D4037' }}>📝 Ghi chú: {item.employers_note}</Text>
                </View>
            ) : null}

            <Text style={{ color: COLORS.textLight, fontSize: 11, marginTop: 6 }}>
                Nộp lúc: {new Date(item.applied_at).toLocaleString('vi-VN')}
            </Text>

            {/* Action buttons */}
            <View style={[Styles.row, { marginTop: 10, flexWrap: 'wrap', gap: 6 }]}>

                {/* ✅ FIX: Xem CV inline thay vì Linking.openURL */}
                {cvUrl ? (
                    <Button
                        compact
                        mode="outlined"
                        icon="file-document"
                        onPress={() => setCvVisible(true)}   // mở modal WebView
                    >
                        Xem CV
                    </Button>
                ) : (
                    <Text style={{ fontSize: 11, color: COLORS.textLight, alignSelf: 'center' }}>Chưa có CV</Text>
                )}

                {/* Note button */}
                <Button compact mode="outlined" icon="note-edit"
                    onPress={() => setNoteVisible(!noteVisible)}>
                    Ghi chú
                </Button>

                {/* Status menu */}
                <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                        <Button compact mode="outlined" style={{ alignSelf: 'flex-start' }}
                            onPress={() => setMenuVisible(true)}>
                            Trạng thái ▾
                        </Button>
                    }
                >
                    {STATUS_OPTIONS.map(s => (
                        <Menu.Item key={s.value} onPress={() => updateStatus(s.value)} title={s.label} />
                    ))}
                </Menu>
            </View>

            {/* Note input */}
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
                    <Button mode="contained" loading={savingNote} onPress={saveNote}
                        style={[Styles.btn, { backgroundColor: COLORS.primary }]}>
                        Lưu ghi chú
                    </Button>
                </View>
            )}

            {/* CV Viewer Modal */}
            <CVViewerModal
                url={cvUrl}
                visible={cvVisible}
                onClose={() => setCvVisible(false)}
            />
        </View>
    );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const ViewApplications = ({ route }) => {
    const { jobId, jobTitle } = route.params || {};
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const res = await authApis(token).get(endpoints['employer-job-applications'](jobId));
            setApps(res.data);
        } catch (ex) { console.error(ex); }
        finally { setLoading(false); }
    };

    const handleUpdate = (appId, updates) => {
        setApps(prev => prev.map(a => a.id === appId ? { ...a, ...updates } : a));
    };

    useEffect(() => { if (jobId) load(); }, [jobId]);

    if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />;

    return (
        <FlatList
            style={Styles.container}
            data={apps}
            keyExtractor={item => String(item.id)}
            ListHeaderComponent={jobTitle ? <Text style={Styles.sectionHeader}>Hồ sơ cho: {jobTitle}</Text> : null}
            ListEmptyComponent={<Text style={Styles.emptyText}>Chưa có hồ sơ nào</Text>}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => <AppCard item={item} jobId={jobId} onUpdate={handleUpdate} />}
        />
    );
};

const styles = StyleSheet.create({
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    modalTitle: {
        fontWeight: '700',
        fontSize: 16,
    },
});

export default ViewApplications;