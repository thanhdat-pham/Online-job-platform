import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, View, Text } from "react-native";
import { Searchbar } from "react-native-paper";
import Apis, { endpoints } from "../../configs/Apis";
import JobItem from "../../components/JobItem";
import Header from "../../components/Header";
import Styles, { COLORS } from "../../styles/Styles";
import { useNavigation } from "@react-navigation/native";

const Home = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [jobType, setJobType] = useState(null);
    const [page, setPage] = useState(1);
    const nav = useNavigation();

    const loadJobs = async () => {
        try {
            setLoading(true);
            let url = `${endpoints['jobs']}?page=${page}`;
            if (q) url += `&q=${q}`;
            if (jobType) url += `&job_type=${jobType}`;

            let res = await Apis.get(url);
            const results = res.data.results ?? res.data;
            if (res.data.next === null || !res.data.next) setPage(0);

            if (page === 1)
                setJobs(results);
            else
                setJobs(prev => [...prev, ...results]);
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
    }, [q, jobType, page]);

    useEffect(() => { setPage(1); }, [q, jobType]);

    const loadMore = () => {
        if (page > 0 && !loading) setPage(p => p + 1);
    };

    return (
        <View style={Styles.container}>
            <Header jobType={jobType} setJobType={setJobType} />
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
