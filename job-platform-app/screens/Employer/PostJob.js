import { ScrollView, View, Alert, TouchableOpacity, Modal, FlatList } from "react-native";
import { TextInput, Button, Text, HelperText, RadioButton, Icon } from "react-native-paper";
import { useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import Styles, { COLORS } from "../../styles/Styles";
import { useNavigation, useRoute } from "@react-navigation/native";

const EXPERIENCE_LEVELS = [
    { value: 'no_exp', label: 'Chưa có kinh nghiệm' },
    { value: '1_year', label: '1 năm' },
    { value: '2_years', label: '2 năm' },
    { value: 'senior', label: 'Trên 5 năm' },
];

const ITEM_HEIGHT = 48;

const SpinnerColumn = ({ data, selectedIndex, onIndexChange }) => {
    const ref = useRef(null);

    const onMomentumScrollEnd = (e) => {
        const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
        onIndexChange(Math.max(0, Math.min(index, data.length - 1)));
    };

    return (
        <View style={{ flex: 1, height: ITEM_HEIGHT * 3, overflow: 'hidden' }}>
            <View pointerEvents="none" style={{
                position: 'absolute', top: ITEM_HEIGHT, left: 0, right: 0, height: ITEM_HEIGHT,
                borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.primary, zIndex: 1
            }} />
            <ScrollView
                ref={ref}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="normal"
                onMomentumScrollEnd={onMomentumScrollEnd}
                contentOffset={{ y: selectedIndex * ITEM_HEIGHT }}
                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
            >
                {data.map((item, i) => (
                    <View key={i} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, color: i === selectedIndex ? COLORS.primary : '#999' }}>
                            {item.label}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const buildDateData = () => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => ({
        label: `Tháng ${i + 1}`, value: i
    }));
    const days = Array.from({ length: 31 }, (_, i) => ({
        label: `${i + 1}`, value: i + 1
    }));
    const years = Array.from({ length: 10 }, (_, i) => ({
        label: `${now.getFullYear() + i}`, value: now.getFullYear() + i
    }));
    return { months, days, years };
};

const { months, days, years } = buildDateData();

const PostJob = () => {
    const nav = useNavigation();
    const route = useRoute();
    const editJob = route.params?.editJob || null;

    const now = new Date();
    const [openDate, setOpenDate] = useState(false);
    const [monthIdx, setMonthIdx] = useState(now.getMonth());
    const [dayIdx, setDayIdx] = useState(now.getDate() - 1);
    const [yearIdx, setYearIdx] = useState(0);

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

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const openDatePicker = () => {
        if (form.deadline) {
            const d = new Date(form.deadline);
            setMonthIdx(d.getMonth());
            setDayIdx(d.getDate() - 1);
            setYearIdx(Math.max(0, d.getFullYear() - now.getFullYear()));
        }
        setOpenDate(true);
    };

    const confirmDate = () => {
        const y = years[yearIdx].value;
        const m = months[monthIdx].value;
        const d = days[dayIdx].value;
        const date = new Date(y, m, d);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        set('deadline', `${date.getFullYear()}-${mm}-${dd}`);
        setOpenDate(false);
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

    const openSelectCategory = () => {
        nav.navigate('select-category', {
            onSelect: (category) => {
                setForm(prev => ({
                    ...prev,
                    category_id: category.id,
                    category_name: category.name,
                }));
            },
        });
    };

    const categorySelected = !!form.category_id;
    const categoryLabel = form.category_name || 'Chọn ngành nghề';

    return (
        <ScrollView style={Styles.container} contentContainerStyle={[Styles.padding, { paddingBottom: 40 }]}>
            <Text style={[Styles.subject, { marginBottom: 12 }]}>
                {editJob ? '\u{270F}\u{FE0F} Sửa tin tuyển dụng' : '\u{1F4DD} Đăng tin tuyển dụng'}
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

            <TextInput
                style={Styles.input}
                label="Hạn nộp hồ sơ *"
                value={form.deadline}
                editable={false}
                right={<TextInput.Icon icon="calendar" onPress={openDatePicker} />}
            />

            <Modal visible={openDate} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
                            <Button onPress={() => setOpenDate(false)} textColor="#999">Hủy</Button>
                            <Text style={{ alignSelf: 'center', fontWeight: '700', fontSize: 15, color: COLORS.primary }}>Chọn ngày</Text>
                            <Button onPress={confirmDate} textColor={COLORS.primary}>Xong</Button>
                        </View>
                        <View style={{ flexDirection: 'row', paddingHorizontal: 8 }}>
                            <SpinnerColumn data={months} selectedIndex={monthIdx} onIndexChange={setMonthIdx} />
                            <SpinnerColumn data={days} selectedIndex={dayIdx} onIndexChange={setDayIdx} />
                            <SpinnerColumn data={years} selectedIndex={yearIdx} onIndexChange={setYearIdx} />
                        </View>
                    </View>
                </View>
            </Modal>

            <TextInput style={Styles.input} label="Mô tả công việc *" value={form.description || ''} onChangeText={t => set('description', t)} multiline numberOfLines={5} />
            <TextInput style={Styles.input} label="Yêu cầu ứng viên" value={form.requirements || ''} onChangeText={t => set('requirements', t)} multiline numberOfLines={4} />
            <TextInput style={Styles.input} label="Quyền lợi / Chế độ đãi ngộ" value={form.benefits || ''} onChangeText={t => set('benefits', t)} multiline numberOfLines={3} />

            <Text style={{ fontWeight: '700', color: COLORS.primary, marginTop: 12, marginBottom: 6 }}>
                Ngành nghề:
            </Text>
            <TouchableOpacity
                onPress={openSelectCategory}
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