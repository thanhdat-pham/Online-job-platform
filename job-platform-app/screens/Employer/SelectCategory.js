import { useEffect, useState, useCallback } from "react";
import { FlatList, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text, Searchbar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import Apis, { endpoints } from "../../configs/Apis";
import { COLORS } from "../../styles/Styles";

const SelectCategory = () => {
    const nav = useNavigation();
    const route = useRoute();

    const returnKey = route.params?.returnKey || "selectedCategory";

    const [allCategories, setAllCategories] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        Apis.get(endpoints["job-categories"])
            .then((res) => {
                const data = res.data.results ?? res.data;
                setAllCategories(data);
                setFiltered(data);
            })
            .catch(() => setError("Không thể tải danh sách ngành nghề."))
            .finally(() => setLoading(false));
    }, []);

    const handleSearch = useCallback(
        (text) => {
            setSearch(text);
            if (!text.trim()) {
                setFiltered(allCategories);
            } else {
                const lower = text.toLowerCase();
                setFiltered(
                    allCategories.filter((c) =>
                        c.name.toLowerCase().includes(lower)
                    )
                );
            }
        },
        [allCategories]
    );

    const handleSelect = (category) => {
        nav.navigate(route.params?.fromScreen, {
            [returnKey]: { id: String(category.id), name: category.name },
        });
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
                <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <Searchbar
                placeholder="Tìm ngành nghề..."
                value={search}
                onChangeText={handleSearch}
                style={{ margin: 12, elevation: 2 }}
                inputStyle={{ fontSize: 15 }}
            />

            {filtered.length === 0 ? (
                <View style={{ alignItems: "center", marginTop: 40 }}>
                    <Text style={{ color: "#999" }}>Không tìm thấy ngành nghề nào.</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => String(item.id)}
                    ItemSeparatorComponent={() => (
                        <View style={{ height: 1, backgroundColor: "#f0f0f0" }} />
                    )}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => handleSelect(item)}
                            activeOpacity={0.7}
                            style={{
                                paddingVertical: 16,
                                paddingHorizontal: 20,
                                backgroundColor: "#fff",
                            }}
                        >
                            <Text style={{ fontSize: 15, color: COLORS.text ?? "#222" }}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};

export default SelectCategory;