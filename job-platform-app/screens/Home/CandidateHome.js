import { useEffect, useState, useCallback } from "react";
import {
    ActivityIndicator, FlatList, View, Text, ScrollView,
    TouchableOpacity, Modal, StyleSheet, Platform,
} from "react-native";
import { Searchbar, Chip, Button, Menu, Divider, IconButton } from "react-native-paper";
import Apis, { endpoints } from "../../configs/Apis";
import JobItem from "../../components/JobItem";
import Styles, { COLORS } from "../../styles/Styles";
import { useNavigation } from "@react-navigation/native";

const PAGE_SIZE = 20;
const PRIMARY_COLOR = COLORS.primary ?? "#1e3a8a";

const JOB_TYPES = [
    { key: null, label: "Tất cả" },
    { key: "full_time", label: "Toàn thời gian" },
    { key: "part_time", label: "Bán thời gian" },
    { key: "internship", label: "Thực tập" },
    { key: "remote", label: "Remote" },
];

const SORT_OPTIONS = [
    { key: null, label: "Mặc định" },
    { key: "salary_desc", label: "Lương cao → thấp" },
    { key: "salary_asc", label: "Lương thấp → cao" },
    { key: "date_desc", label: "Mới nhất" },
    { key: "date_asc", label: "Cũ nhất" },
];

const COMPARE_CRITERIA = [
    { key: "salary", label: "Mức lương" },
    { key: "experience", label: "Kinh nghiệm" },
    { key: "benefits", label: "Phúc lợi" },
    { key: "location", label: "Địa điểm" },
    { key: "job_type", label: "Loại công việc" },
    { key: "category", label: "Ngành nghề" },
];

const formatSalary = (min, max) => {
    if (!min && !max) return "Thỏa thuận";
    const fmt = (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}tr` : `${(n / 1_000).toFixed(0)}k`;
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `Từ ${fmt(min)}`;
    return `Đến ${fmt(max)}`;
};

const getJobTypeLabel = (key) => JOB_TYPES.find(t => t.key === key)?.label ?? key;

const FilterModal = ({ visible, onClose, filters, setFilter }) => {
    const [locationText, setLocationText] = useState(filters.location ?? "");
    const [companyText, setCompanyText] = useState(filters.company ?? "");
    const [salaryMin, setSalaryMin] = useState(filters.salary_min ? String(filters.salary_min / 1_000_000) : "");
    const [salaryMax, setSalaryMax] = useState(filters.salary_max ? String(filters.salary_max / 1_000_000) : "");

    useEffect(() => {
        setLocationText(filters.location ?? "");
        setCompanyText(filters.company ?? "");
        setSalaryMin(filters.salary_min ? String(filters.salary_min / 1_000_000) : "");
        setSalaryMax(filters.salary_max ? String(filters.salary_max / 1_000_000) : "");
    }, [visible, filters]);

    const handleApply = () => {
        setFilter("location", locationText || null);
        setFilter("company", companyText || null);
        setFilter("salary_min", salaryMin ? Number(salaryMin) * 1_000_000 : null);
        setFilter("salary_max", salaryMax ? Number(salaryMax) * 1_000_000 : null);
        onClose();
    };

    const handleReset = () => {
        setLocationText("");
        setCompanyText("");
        setSalaryMin("");
        setSalaryMax("");
        setFilter("location", null);
        setFilter("company", null);
        setFilter("salary_min", null);
        setFilter("salary_max", null);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={fm.backdrop}>
                <View style={fm.container}>
                    <View style={fm.header}>
                        <Text style={fm.headerTitle}>Bộ lọc nâng cao</Text>
                        <IconButton icon="close" size={24} onPress={onClose} />
                    </View>
                    <ScrollView style={fm.body}>
                        <Text style={fm.sectionTitle}>Địa điểm làm việc</Text>
                        <Searchbar
                            placeholder="Nhập thành phố, tỉnh thành..."
                            value={locationText}
                            onChangeText={setLocationText}
                            style={fm.searchbar}
                            inputStyle={fm.inputStyle}
                            icon="map-marker-outline"
                        />

                        <Text style={fm.sectionTitle}>Tên công ty</Text>
                        <Searchbar
                            placeholder="Nhập tên doanh nghiệp tuyển dụng..."
                            value={companyText}
                            onChangeText={setCompanyText}
                            style={fm.searchbar}
                            inputStyle={fm.inputStyle}
                            icon="office-building-outline"
                        />

                        <Text style={fm.sectionTitle}>Mức lương mong muốn (Triệu VNĐ)</Text>
                        <View style={fm.salaryWrapper}>
                            <Searchbar placeholder="Từ" value={salaryMin} onChangeText={setSalaryMin} style={fm.salaryInput} inputStyle={fm.inputStyle} keyboardType="numeric" icon="minus" />
                            <Text style={fm.salaryDash}>–</Text>
                            <Searchbar placeholder="Đến" value={salaryMax} onChangeText={setSalaryMax} style={fm.salaryInput} inputStyle={fm.inputStyle} keyboardType="numeric" icon="minus" />
                        </View>
                    </ScrollView>
                    <View style={fm.footer}>
                        <Button mode="outlined" onPress={handleReset} style={fm.footerBtn} labelStyle={{ color: "#666" }}>Xóa lọc</Button>
                        <Button mode="contained" onPress={handleApply} style={[fm.footerBtn, { backgroundColor: PRIMARY_COLOR }]}>Áp dụng</Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const CompareModal = ({ visible, jobs, onClose, onRemove }) => {
    if (!jobs.length) return null;
    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={cmp.wrapper}>
                <View style={cmp.header}>
                    <Text style={cmp.title}>So sánh chi tiết việc làm</Text>
                    <IconButton icon="close" size={22} onPress={onClose} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                        <View style={cmp.row}>
                            <View style={cmp.labelCell}>
                                <Text style={cmp.labelText}>Tiêu chí</Text>
                            </View>
                            {jobs.map(job => (
                                <View key={job.id} style={cmp.cell}>
                                    <Text style={cmp.jobTitle} numberOfLines={2}>{job.title}</Text>
                                    <Text style={cmp.companyName} numberOfLines={1}>{job.company_name ?? job.employer?.company_name}</Text>
                                    <TouchableOpacity onPress={() => onRemove(job.id)} style={cmp.removeBtn}>
                                        <Text style={cmp.removeTxt}>Gỡ bỏ</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                        <Divider />
                        {COMPARE_CRITERIA.map((cr, idx) => (
                            <View key={cr.key}>
                                <View style={[cmp.row, idx % 2 === 0 && cmp.rowAlt]}>
                                    <View style={cmp.labelCell}>
                                        <Text style={cmp.labelText}>{cr.label}</Text>
                                    </View>
                                    {jobs.map(job => (
                                        <View key={job.id} style={cmp.cell}>
                                            <Text style={cmp.cellValue}>
                                                {cr.key === "salary" && formatSalary(job.salary_min, job.salary_max)}
                                                {cr.key === "experience" && (job.experience_required ?? "Không yêu cầu")}
                                                {cr.key === "benefits" && (job.benefits ?? "—")}
                                                {cr.key === "location" && (job.location ?? "—")}
                                                {cr.key === "job_type" && getJobTypeLabel(job.job_type)}
                                                {cr.key === "category" && (job.category_name ?? job.category?.name ?? "—")}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                                <Divider />
                            </View>
                        ))}
                    </View>
                </ScrollView>
                <View style={cmp.footer}>
                    <Button mode="contained" onPress={onClose} style={{ backgroundColor: PRIMARY_COLOR, borderRadius: 12 }}>Đóng bảng so sánh</Button>
                </View>
            </View>
        </Modal>
    );
};

const Pagination = ({ page, totalPages, onPrev, onNext }) => (
    <View style={pg.row}>
        <TouchableOpacity style={[pg.btn, page <= 1 && pg.disabled]} onPress={onPrev} disabled={page <= 1}>
            <Text style={pg.arrow}>‹</Text>
        </TouchableOpacity>
        <Text style={pg.info}>Trang {page} / {totalPages ?? 1}</Text>
        <TouchableOpacity style={[pg.btn, !totalPages || page >= totalPages ? pg.disabled : null]} onPress={onNext} disabled={!totalPages || page >= totalPages}>
            <Text style={pg.arrow}>›</Text>
        </TouchableOpacity>
    </View>
);

const CandidateHome = () => {
    const nav = useNavigation();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [totalCount, setTotalCount] = useState(0);

    const [q, setQ] = useState("");
    const [sortVisible, setSortVisible] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);

    const [filters, _setFilters] = useState({
        jobType: null,
        category: null,
        sort: null,
        location: null,
        company: null,
        salary_min: null,
        salary_max: null,
    });
    const setFilter = useCallback((key, val) => _setFilters(prev => ({ ...prev, [key]: val })), []);

    const [page, setPage] = useState(1);
    const totalPages = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : null;

    const [compareList, setCompareList] = useState([]);
    const [compareVisible, setCompareVisible] = useState(false);

    useEffect(() => {
        Apis.get("/jobs/categories/").then(res => {
            const rawData = res.data.results ?? res.data;
            setCategories([{ id: null, name: "Tất cả ngành nghề" }, ...rawData]);
        }).catch(err => console.error("Lỗi tải ngành nghề:", err));
    }, []);

    useEffect(() => {
        setPage(1);
    }, [q, filters]);

    useEffect(() => {
        const fetchJobsData = async () => {
            try {
                setLoading(true);
                let url = `${endpoints["jobs"]}?page=${page}&page_size=${PAGE_SIZE}`;

                if (q) url += `&q=${encodeURIComponent(q)}`;
                if (filters.jobType) url += `&job_type=${filters.jobType}`;
                if (filters.category) url += `&category_id=${filters.category}`;
                if (filters.sort) url += `&ordering=${filters.sort}`;
                if (filters.location) url += `&location=${encodeURIComponent(filters.location)}`;
                if (filters.company) url += `&company_name=${encodeURIComponent(filters.company)}`;
                if (filters.salary_min) url += `&salary_min=${filters.salary_min}`;
                if (filters.salary_max) url += `&salary_max=${filters.salary_max}`;

                const res = await Apis.get(url);
                const results = res.data.results ?? res.data;
                setJobs(results ?? []);

                if (res.data.count !== undefined) {
                    setTotalCount(res.data.count);
                } else if (Array.isArray(res.data)) {
                    setTotalCount(res.data.length);
                } else {
                    setTotalCount(0);
                }
            } catch (ex) {
                console.error("Lỗi API kết nối danh sách công việc:", ex);
                setJobs([]);
                setTotalCount(0);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchJobsData, 350);
        return () => clearTimeout(timer);
    }, [q, filters, page]);

    const toggleCompare = useCallback((job) => {
        setCompareList(prev => {
            if (prev.find(j => j.id === job.id)) return prev.filter(j => j.id !== job.id);
            if (prev.length >= 4) return prev;
            return [...prev, job];
        });
    }, []);

    const isInCompare = useCallback((id) => compareList.some(j => j.id === id), [compareList]);

    const renderJob = useCallback(({ item }) => (
        <View style={s.jobWrapper}>
            <JobItem item={item} onPress={() => nav.navigate("job-detail", { jobId: item.id })} />
            <TouchableOpacity
                style={[s.compareToggle, isInCompare(item.id) && s.compareActive]}
                onPress={() => toggleCompare(item)}
                activeOpacity={0.75}
            >
                <Text style={[s.compareToggleTxt, isInCompare(item.id) && s.compareActiveTxt]}>
                    {isInCompare(item.id) ? "✓ Đang chọn" : "+ So sánh"}
                </Text>
            </TouchableOpacity>
        </View>
    ), [isInCompare, toggleCompare, nav]);

    const currentSort = SORT_OPTIONS.find(s => s.key === filters.sort) ?? SORT_OPTIONS[0];
    const hasAdvancedFilter = filters.location || filters.company || filters.salary_min || filters.salary_max;

    return (
        <View style={[Styles.container, { backgroundColor: "#f6f8fa" }]}>
            <View style={s.topSearchRow}>
                <Searchbar
                    placeholder="Tìm tên công việc..."
                    value={q}
                    onChangeText={setQ}
                    style={s.searchBar}
                    inputStyle={{ fontSize: 13 }}
                />
                <TouchableOpacity
                    style={[s.filterActionBtn, hasAdvancedFilter && { backgroundColor: "#e0f2fe", borderColor: PRIMARY_COLOR }]}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Text style={[s.filterActionBtnIcon, hasAdvancedFilter && { color: PRIMARY_COLOR }]}>🔍</Text>
                    <Text style={[s.filterActionBtnText, hasAdvancedFilter && { color: PRIMARY_COLOR }]}>Bộ lọc nâng cao</Text>
                </TouchableOpacity>
            </View>

            <View style={s.utilityBar}>
                <Menu
                    visible={sortVisible}
                    onDismiss={() => setSortVisible(false)}
                    anchor={
                        <TouchableOpacity style={s.sortBtn} onPress={() => setSortVisible(true)}>
                            <Text style={s.sortLabel}>⇅ {currentSort.label}</Text>
                        </TouchableOpacity>
                    }
                >
                    {SORT_OPTIONS.map(opt => (
                        <Menu.Item
                            key={String(opt.key)}
                            onPress={() => { setFilter("sort", opt.key); setSortVisible(false); }}
                            title={opt.label}
                            titleStyle={filters.sort === opt.key ? { fontWeight: "700", color: PRIMARY_COLOR } : {}}
                        />
                    ))}
                </Menu>

                {categories.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                        {categories.map(cat => (
                            <Chip
                                key={String(cat.id)}
                                selected={filters.category === cat.id}
                                onPress={() => setFilter("category", cat.id)}
                                style={[s.subChip, filters.category === cat.id && s.chipActive]}
                                textStyle={filters.category === cat.id ? s.chipActiveTxt : s.chipTxt}
                            >
                                {cat.name}
                            </Chip>
                        ))}
                    </ScrollView>
                )}
            </View>

            <View style={{ marginBottom: 4 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
                    {JOB_TYPES.map(t => (
                        <Chip
                            key={String(t.key)}
                            selected={filters.jobType === t.key}
                            onPress={() => setFilter("jobType", t.key)}
                            style={[s.mainChip, filters.jobType === t.key && s.chipActive]}
                            textStyle={filters.jobType === t.key ? s.chipActiveTxt : s.chipTxt}
                        >
                            {t.label}
                        </Chip>
                    ))}
                </ScrollView>
            </View>

            {!loading && (
                <View style={s.metaRow}>
                    <Text style={s.resultCount}>
                        {totalCount > 0 ? `Tìm thấy ${totalCount} cơ hội việc làm` : "Không tìm thấy công việc phù hợp"}
                    </Text>
                </View>
            )}

            {compareList.length > 0 && (
                <View style={s.stickyCompareBar}>
                    <Text style={s.stickyCompareTxt}>⚖️ Đã chọn {compareList.length}/4 tin</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                        <Button mode="contained" dense onPress={() => setCompareVisible(true)} style={{ backgroundColor: PRIMARY_COLOR }} labelStyle={{ fontSize: 11 }}>So Sánh</Button>
                        <Button mode="text" dense onPress={() => setCompareList([])} labelStyle={{ color: "#ef4444", fontSize: 11 }}>Xóa</Button>
                    </View>
                </View>
            )}

            <FlatList
                data={jobs}
                keyExtractor={item => String(item.id)}
                renderItem={renderJob}
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 32 }}
                ListEmptyComponent={!loading ? <View style={s.emptyContainer}><Text style={s.empty}>Hệ thống chưa tìm thấy tin tuyển dụng phù hợp với bộ lọc của bạn.</Text></View> : null}
                ListFooterComponent={
                    loading ? (
                        <ActivityIndicator color={PRIMARY_COLOR} style={{ padding: 20 }} />
                    ) : (
                        jobs.length > 0 && (
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                onPrev={() => setPage(p => Math.max(1, p - 1))}
                                onNext={() => setPage(p => p + 1)}
                            />
                        )
                    )
                }
            />

            <FilterModal visible={filterModalVisible} onClose={() => setFilterModalVisible(false)} filters={filters} setFilter={setFilter} />
            <CompareModal visible={compareVisible} jobs={compareList} onClose={() => setCompareVisible(false)} onRemove={id => setCompareList(prev => prev.filter(j => j.id !== id))} />
        </View>
    );
};

export default CandidateHome;

const s = StyleSheet.create({
    topSearchRow: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 12, gap: 8, alignItems: "center" },
    searchBar: { flex: 1, height: 46, borderRadius: 12, backgroundColor: "#fff", elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    filterActionBtn: { flexDirection: "row", height: 46, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb", gap: 6 },
    filterActionBtnIcon: { fontSize: 13, color: "#4b5563" },
    filterActionBtnText: { fontSize: 12, color: "#4b5563", fontWeight: "600" },
    utilityBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
    sortBtn: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb" },
    sortLabel: { fontSize: 12, fontWeight: "600", color: "#4b5563" },
    chipRow: { paddingHorizontal: 12, paddingBottom: 8, gap: 6 },
    mainChip: { backgroundColor: "#e5e7eb", borderRadius: 10, height: 34 },
    subChip: { backgroundColor: "#fff", borderRadius: 8, height: 30, borderWidth: 1, borderColor: "#e5e7eb" },
    chipActive: { backgroundColor: PRIMARY_COLOR },
    chipTxt: { fontSize: 12, color: "#374151" },
    chipActiveTxt: { color: "#fff", fontWeight: "700" },
    metaRow: { paddingHorizontal: 14, marginBottom: 6 },
    resultCount: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
    jobWrapper: { backgroundColor: "#fff", borderRadius: 14, marginBottom: 12, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, overflow: "hidden" },
    compareToggle: { position: "absolute", bottom: 12, right: 12, backgroundColor: "#f3f4f6", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#d1d5db" },
    compareActive: { backgroundColor: "#10b981", borderColor: "#10b981" },
    compareToggleTxt: { fontSize: 11, color: "#4b5563", fontWeight: "600" },
    compareActiveTxt: { color: "#fff", fontWeight: "700" },
    stickyCompareBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1e293b", marginHorizontal: 12, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    stickyCompareTxt: { color: "#fff", fontSize: 12, fontWeight: "600" },
    emptyContainer: { padding: 40, alignItems: "center" },
    empty: { textAlign: "center", color: "#9ca3af", fontSize: 13, lineHeight: 20 },
});

const fm = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    container: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%", paddingBottom: Platform.OS === "ios" ? 34 : 16 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: "#f3f4f6" },
    headerTitle: { fontSize: 16, fontWeight: "700", color: "#1f2937" },
    body: { padding: 16 },
    sectionTitle: { fontSize: 13, fontWeight: "700", color: "#4b5563", marginBottom: 8, marginTop: 12 },
    searchbar: { height: 42, borderRadius: 10, backgroundColor: "#f3f4f6", elevation: 0 },
    salaryWrapper: { flexDirection: "row", alignItems: "center", gap: 8 },
    salaryInput: { flex: 1, height: 42, borderRadius: 10, backgroundColor: "#f3f4f6", elevation: 0 },
    salaryDash: { color: "#9ca3af", fontWeight: "700" },
    inputStyle: { fontSize: 13 },
    footer: { flexDirection: "row", padding: 16, gap: 12, borderTopWidth: 1, borderColor: "#f3f4f6" },
    footerBtn: { flex: 1, borderRadius: 10 },
});

const cmp = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: "#fff" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 50 : 16, paddingBottom: 8, borderBottomWidth: 1, borderColor: "#eee" },
    title: { fontSize: 16, fontWeight: "700", color: "#111827" },
    row: { flexDirection: "row" },
    rowAlt: { backgroundColor: "#f9fafb" },
    labelCell: { width: 100, padding: 10, justifyContent: "center", borderRightWidth: 1, borderColor: "#eee" },
    labelText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
    cell: { width: 150, padding: 10, borderRightWidth: 1, borderColor: "#eee" },
    jobTitle: { fontSize: 12, fontWeight: "700", color: "#111827", marginBottom: 2 },
    companyName: { fontSize: 11, color: "#6b7280", marginBottom: 6 },
    removeBtn: { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "#fee2e2" },
    removeTxt: { fontSize: 10, color: "#ef4444", fontWeight: "600" },
    cellValue: { fontSize: 12, color: "#374151", lineHeight: 16 },
    footer: { padding: 16, borderTopWidth: 1, borderColor: "#eee" },
});

const pg = StyleSheet.create({
    row: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 20, gap: 16 },
    btn: { width: 34, height: 34, borderRadius: 17, backgroundColor: PRIMARY_COLOR, justifyContent: "center", alignItems: "center" },
    disabled: { backgroundColor: "#e5e7eb" },
    arrow: { color: "#fff", fontSize: 18, lineHeight: 20, fontWeight: "700" },
    info: { fontSize: 13, fontWeight: "600", color: "#374151" },
});