import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Searchbar, Chip } from "react-native-paper";
import Apis, { endpoints } from "../../configs/Apis";
import JobItem from "../../components/JobItem";
import Styles, { COLORS } from "../../styles/Styles";
import { useNavigation } from "@react-navigation/native";

const JOB_TYPES = [
    { key: null, label: 'Tất cả' }, { key: 'full_time', label: 'Toàn thời gian' },
    { key: 'part_time', label: 'Bán thời gian' }, { key: 'internship', label: 'Thực tập' },
    { key: 'remote', label: 'Remote' },
];

const CandidateHome = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [jobType, setJobType] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [page, setPage] = useState(1);
    const nav = useNavigation();

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
        } catch (ex) { console.error(ex); } finally { setLoading(false); }
    };

    useEffect(() => {
        const timer = setTimeout(() => { if (page > 0) loadJobs(); }, 400);
        return () => clearTimeout(timer);
    }, [q, jobType, selectedCategory, page]);

    useEffect(() => { setPage(1); }, [q, jobType, selectedCategory]);

    return (
        <View style={Styles.container}>
            {/* Giữ nguyên phần render JSX của bạn ở đây */}
            <FlatList data={jobs} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => <JobItem item={item} onPress={() => nav.navigate('job-detail', { jobId: item.id })} />} ListFooterComponent={loading ? <ActivityIndicator color={COLORS.primary} /> : null} />
        </View>
    );
};
export default CandidateHome;