import { ScrollView, View, Alert, TouchableOpacity } from "react-native";
import { TextInput, Button, Text, HelperText, RadioButton, Icon } from "react-native-paper";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { COLORS } from "../../styles/Styles";
import { useNavigation, useRoute } from "@react-navigation/native";
import { DatePickerModal } from 'react-native-paper-dates';

const EXPERIENCE_LEVELS = [
    { value: 'no_exp', label: 'Chưa có kinh nghiệm' },
    { value: '1_year', label: '1 năm' },
    { value: '2_years', label: '2 năm' },
    { value: 'senior', label: 'Trên 5 năm' },
];

const PostJob = () => {
    const nav = useNavigation();
    const route = useRoute();
    const editJob = route.params?.editJob || null;

    // Nhận category trả về từ SelectCategory
    const selectedCategory = route.params?.selectedCategory || null;

    const [openDate, setOpenDate] = useState(false);

    const [form, setForm] = useState({
        title: editJob?.title || '',
        location: editJob?.location || '',
        salary_min: editJob?.salary_min ? String(editJob.salary_min) : '',
        salary_max: editJob?.salary_max ? String(editJob.salary_max) : '',
        deadline: editJob?.deadline || '',
        description: editJob?.description || '',
        requirements: editJob?.requirements || '',
        benefits: editJob?.benefits || '',
        experience_level: editJob?.experience_level || 'no_exp',
        category_id: editJob?.category?.id ? String(editJob.category.id) : null,
        category_name: editJob?.category?.name || null,
    });
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    // Đồng bộ category khi navigate trở về từ SelectCategory
    // (chỉ cập nhật khi selectedCategory thay đổi và khác với form hiện tại)
    if (
        selectedCategory &&
        selectedCategory.id !== form.category_id
    ) {
        setForm(prev => ({
            ...prev,
            category_id: selectedCategory.id,
            category_name: selectedCategory.name,
        }));
    }

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const onConfirmDate = (params) => {
        setOpenDate(false);
        const formattedDate = params.date.toISOString().split('T')[0];
        set('deadline', formattedDate);
    };

    const validate = () => {
        if (!form.title?.trim()) { setErr("Vui lòng nhập tên vị trí!"); return false; }
        if (!form.description?.trim()) { setErr("Vui lòng nhập mô tả công việc!"); return false; }
        if (!form.location?.trim()) { setErr("Vui lòng nhập địa điểm!"); return false; }
        if (!form.deadline?.trim()) { setErr("Vui lòng chọn hạn nộp hồ sơ!"); return false; }
        return true;
    };

    const submit = async () => {
        if (!validate()) return;
        setErr("");
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const payload = {
                title: form.title,
                location: form.location,
                description: form.description,
                requirements: form.requirements,
                benefits: form.benefits,
                experience_level: form.experience_level,
                deadline: form.deadline,
                salary_min: form.salary_min ? parseInt(form.salary_min) : null,
                salary_max: form.salary_max ? parseInt(form.salary_max) : null,
                category_id: form.category_id ? parseInt(form.category_id) : null,
            };
            if (editJob) {
                await authApis(token).patch(endpoints['employer-job-detail'](editJob.id), payload);
                Alert.alert("Thành công", "Đã cập nhật tin tuyển dụng!", [{ text: 'OK', onPress: () => nav.goBack() }]);
            } else {
                await authApis(token).post(endpoints['employer-jobs'], payload);
                Alert.alert("Thành công", "Đã đăng tin tuyển dụng!", [{ text: 'OK', onPress: () => nav.goBack() }]);
            }
        } catch (ex) {
            const status = ex.response?.status;
            const msg = ex.response?.data?.detail;
            if (status === 403) {
                Alert.alert("Không có quyền", msg || "Tài khoản chưa được xác minh.");
            } else {
                console.error(ex.response?.data || ex);
                setErr("Có lỗi xảy ra. Vui lòng thử lại!");
            }
        } finally {
            setLoading(false);
        }
    };

    const FIELDS = [
        { key: 'title', label: 'Tên vị trí *', icon: 'briefcase' },
        { key: 'location', label: 'Địa điểm làm việc *', icon: 'map-marker' },
        { key: 'salary_min', label: 'Lương tối thiểu (VND)', icon: 'currency-usd', keyboardType: 'numeric' },
        { key: 'salary_max', label: 'Lương tối đa (VND)', icon: 'currency-usd', keyboardType: 'numeric' },
    ];

    // Label hiển thị cho category
    const categoryLabel = form.category_name || (selectedCategory?.name) || 'Chọn ngành nghề';
    const categorySelected = !!(form.category_id || selectedCategory?.id);

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

            {/* Deadline */}
            <TextInput
                style={Styles.input}
                label="Hạn nộp hồ sơ *"
                value={form.deadline}
                editable={false}
                right={<TextInput.Icon icon="calendar" onPress={() => setOpenDate(true)} />}
            />
            <DatePickerModal
                locale="vi"
                mode="single"
                visible={openDate}
                onDismiss={() => setOpenDate(false)}
                date={form.deadline ? new Date(form.deadline) : new Date()}
                onConfirm={onConfirmDate}
            />

            <TextInput style={Styles.input} label="Mô tả công việc *" value={form.description || ''} onChangeText={t => set('description', t)} multiline numberOfLines={5} />
            <TextInput style={Styles.input} label="Yêu cầu ứng viên" value={form.requirements || ''} onChangeText={t => set('requirements', t)} multiline numberOfLines={4} />
            <TextInput style={Styles.input} label="Quyền lợi / Chế độ đãi ngộ" value={form.benefits || ''} onChangeText={t => set('benefits', t)} multiline numberOfLines={3} />

            {/* ── NGÀNH NGHỀ: navigate sang SelectCategory ── */}
            <Text style={{ fontWeight: '700', color: COLORS.primary, marginTop: 12, marginBottom: 6 }}>
                Ngành nghề:
            </Text>
            <TouchableOpacity
                onPress={() =>
                    nav.navigate('select-category', {
                        fromScreen: 'post-job',   // tên screen để navigate back về
                        returnKey: 'selectedCategory',
                    })
                }
                activeOpacity={0.75}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: categorySelected ? COLORS.primary : '#ccc',
                    borderRadius: 6,
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    marginBottom: 12,
                    backgroundColor: '#fafafa',
                }}
            >
                <Text style={{ fontSize: 15, color: categorySelected ? COLORS.text : '#999' }}>
                    {categoryLabel}
                </Text>
                <Icon source="chevron-right" size={20} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Kinh nghiệm */}
            <Text style={{ fontWeight: '700', color: COLORS.primary, marginTop: 4, marginBottom: 4 }}>
                Kinh nghiệm yêu cầu:
            </Text>
            <RadioButton.Group onValueChange={v => set('experience_level', v)} value={form.experience_level}>
                <View style={[Styles.row, Styles.wrap]}>
                    {EXPERIENCE_LEVELS.map(t => (
                        <RadioButton.Item
                            key={t.value}
                            label={t.label}
                            value={t.value}
                            color={COLORS.primary}
                            style={{ flex: 0 }}
                            labelStyle={{ fontSize: 13 }}
                        />
                    ))}
                </View>
            </RadioButton.Group>

            <Button
                mode="contained"
                onPress={submit}
                loading={loading}
                disabled={loading}
                style={[Styles.btn, { marginTop: 20, backgroundColor: COLORS.primary }]}
            >
                {editJob ? 'Lưu thay đổi' : 'Đăng tin'}
            </Button>
        </ScrollView>
    );
};

export default PostJob;