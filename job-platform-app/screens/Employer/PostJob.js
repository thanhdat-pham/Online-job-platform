import { ScrollView, View, Alert } from "react-native";
import { TextInput, Button, Text, HelperText, RadioButton } from "react-native-paper";
import { useState, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { COLORS } from "../../styles/Styles";
import { useNavigation, useRoute } from "@react-navigation/native";

const JOB_TYPES = [
    { value: 'full_time', label: 'Toàn thời gian' },
    { value: 'part_time', label: 'Bán thời gian' },
    { value: 'internship', label: 'Thực tập' },
    { value: 'remote', label: 'Remote' },
];

const PostJob = () => {
    const nav = useNavigation();
    const route = useRoute();

    const editJob = route.params?.editJob || null;

    const [form, setForm] = useState({
        job_type: editJob?.job_type || 'full_time',
        title: editJob?.title || '',
        location: editJob?.location || '',
        salary_min: editJob?.salary_min ? String(editJob.salary_min) : '',
        salary_max: editJob?.salary_max ? String(editJob.salary_max) : '',
        deadline: editJob?.deadline || '',
        description: editJob?.description || '',
        requirements: editJob?.requirements || '',
        benefits: editJob?.benefits || '',
    });
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const validate = () => {
        if (!form.title?.trim()) { setErr("Vui lòng nhập tên vị trí!"); return false; }
        if (!form.description?.trim()) { setErr("Vui lòng nhập mô tả công việc!"); return false; }
        if (!form.location?.trim()) { setErr("Vui lòng nhập địa điểm!"); return false; }
        if (!form.deadline?.trim()) { setErr("Vui lòng nhập hạn nộp hồ sơ!"); return false; }
        return true;
    };

    const submit = async () => {
        if (!validate()) return;
        setErr("");
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const payload = {
                ...form,
                salary_min: form.salary_min ? parseInt(form.salary_min) : null,
                salary_max: form.salary_max ? parseInt(form.salary_max) : null,
            };
            if (editJob) {
                await authApis(token).patch(endpoints['employer-job-detail'](editJob.id), payload);
                Alert.alert("Thành công", "Đã cập nhật tin tuyển dụng!", [{ text: 'OK', onPress: () => nav.goBack() }]);
            } else {
                await authApis(token).post(endpoints['employer-jobs'], payload);
                Alert.alert("Thành công", "Đã đăng tin tuyển dụng!", [{ text: 'OK', onPress: () => nav.goBack() }]);
            }
        } catch (ex) {
            console.error(ex.response?.data || ex);
            setErr("Có lỗi xảy ra. Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    const FIELDS = [
        { key: 'title', label: 'Tên vị trí *', icon: 'briefcase' },
        { key: 'location', label: 'Địa điểm làm việc *', icon: 'map-marker' },
        { key: 'salary_min', label: 'Lương tối thiểu (VND)', icon: 'currency-usd', keyboardType: 'numeric' },
        { key: 'salary_max', label: 'Lương tối đa (VND)', icon: 'currency-usd', keyboardType: 'numeric' },
        { key: 'deadline', label: 'Hạn nộp hồ sơ (YYYY-MM-DD) *', icon: 'calendar' },
    ];

    return (
        <ScrollView style={Styles.container} contentContainerStyle={[Styles.padding, { paddingBottom: 40 }]}>
            <Text style={[Styles.subject, { marginBottom: 12 }]}>
                {editJob ? '✏️ Sửa tin tuyển dụng' : '📝 Đăng tin tuyển dụng'}
            </Text>

            {err ? <HelperText type="error" visible>{err}</HelperText> : null}

            {FIELDS.map(f => (
                <TextInput
                    key={f.key}
                    style={Styles.input}
                    label={f.label}
                    value={form[f.key] || ''}
                    onChangeText={t => set(f.key, t)}
                    keyboardType={f.keyboardType}
                    right={<TextInput.Icon icon={f.icon} />}
                />
            ))}

            <TextInput style={Styles.input} label="Mô tả công việc *" value={form.description || ''} onChangeText={t => set('description', t)} multiline numberOfLines={5} />
            <TextInput style={Styles.input} label="Yêu cầu ứng viên" value={form.requirements || ''} onChangeText={t => set('requirements', t)} multiline numberOfLines={4} />
            <TextInput style={Styles.input} label="Quyền lợi / Chế độ đãi ngộ" value={form.benefits || ''} onChangeText={t => set('benefits', t)} multiline numberOfLines={3} />

            <Text style={{ fontWeight: '700', color: COLORS.primary, marginTop: 12, marginBottom: 4 }}>Hình thức làm việc:</Text>
            <RadioButton.Group onValueChange={v => set('job_type', v)} value={form.job_type}>
                <View style={[Styles.row, Styles.wrap]}>
                    {JOB_TYPES.map(t => (
                        <RadioButton.Item key={t.value} label={t.label} value={t.value} color={COLORS.primary} style={{ flex: 0 }} labelStyle={{ fontSize: 13 }} />
                    ))}
                </View>
            </RadioButton.Group>

            <Button mode="contained" onPress={submit} loading={loading} disabled={loading}
                style={[Styles.btn, { marginTop: 20, backgroundColor: COLORS.primary }]}
                contentStyle={{ paddingVertical: 6 }}>
                {editJob ? 'Lưu thay đổi' : 'Đăng tin'}
            </Button>
        </ScrollView>
    );
};

export default PostJob;
