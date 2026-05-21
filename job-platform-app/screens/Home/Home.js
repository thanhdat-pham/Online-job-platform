import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Searchbar, Chip } from "react-native-paper";
import Apis, { endpoints } from "../../configs/Apis";
import JobItem from "../../components/JobItem";
import Styles, { COLORS } from "../../styles/Styles";
import { useNavigation } from "@react-navigation/native";

const JOB_TYPES = [
    { key: null, label: 'Tất cả' },
    { key: 'full_time', label: 'Toàn thời gian' },
    { key: 'part_time', label: 'Bán thời gian' },
    { key: 'internship', label: 'Thực tập' },
    { key: 'remote', label: 'Remote' },
];

const Home = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [jobType, setJobType] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [page, setPage] = useState(1);
    const nav = useNavigation();

    // Load categories
    useEffect(() => {
        Apis.get('/jobs/categories/').then(res => {
            setCategories([{ id: null, name: 'Tất cả ngành' }, ...(res.data.results ?? res.data)]);
        }).catch(() => { });
    }, []);

    const loadJobs = async () => {
        try {
            setLoading(true);
            let url = `${endpoints['jobs']}?page=${page}`;
            if (q) url += `&q=${encodeURIComponent(q)}`;
            if (jobType) url += `&job_type=${jobType}`;
            if (selectedCategory) url += `&category=${selectedCategory}`;

            let res = await Apis.get(url);
            const results = res.data.results ?? res.data;
            if (!res.data.next) setPage(0);

            if (page === 1) setJobs(results);
            else setJobs(prev => [...prev, ...results]);
        } catch (ex) {
            console.error(ex);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (page > 0) loadJobs();
        }, 400);
        return () => clearTimeout(timer);
    }, [q, jobType, selectedCategory, page]);

    useEffect(() => { setPage(1); }, [q, jobType, selectedCategory]);

    const loadMore = () => {
        if (page > 0 && !loading) setPage(p => p + 1);
    };

    return (
        <View style={Styles.container}>
            {/* Job type filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={{ backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                <View style={Styles.row}>
                    {JOB_TYPES.map(t => (
                        <TouchableOpacity key={String(t.key)} onPress={() => setJobType(t.key)}>
                            <Chip
                                mode={jobType === t.key ? "flat" : "outlined"}
                                style={[Styles.chip, jobType === t.key && { backgroundColor: COLORS.primary }]}
                                textStyle={jobType === t.key ? { color: '#fff', fontWeight: '700' } : { color: COLORS.primary }}
                            >
                                {t.label}
                            </Chip>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Category filter */}
            {categories.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    style={{ backgroundColor: '#F8F9FA', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                    <View style={Styles.row}>
                        {categories.map(c => (
                            <TouchableOpacity key={String(c.id)} onPress={() => setSelectedCategory(c.id)}>
                                <Chip
                                    mode={selectedCategory === c.id ? "flat" : "outlined"}
                                    style={[Styles.chip, selectedCategory === c.id && { backgroundColor: COLORS.accent }]}
                                    textStyle={selectedCategory === c.id ? { color: '#fff', fontWeight: '700' } : { color: COLORS.text }}
                                >
                                    {c.name}
                                </Chip>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            )}

            <Searchbar
                value={q}
                onChangeText={setQ}
                placeholder="Tìm kiếm việc làm..."
                style={{ margin: 10, borderRadius: 10, elevation: 1 }}
                iconColor={COLORS.primary}
            />

            {jobs.length === 0 && !loading && (
                <Text style={Styles.emptyText}>Không tìm thấy việc làm phù hợp</Text>
            )}

            <FlatList
                data={jobs}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <JobItem
                        item={item}
                        onPress={() => nav.navigate('job-detail', { jobId: item.id })}
                    />
                )}
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                ListFooterComponent={loading ? <ActivityIndicator color={COLORS.primary} style={{ margin: 20 }} /> : null}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
};

export default Home;
