import { ScrollView, TouchableOpacity, View } from "react-native";
import { Chip } from "react-native-paper";
import Styles, { COLORS } from "../styles/Styles";

const JOB_TYPES = [
    { key: null, label: 'Tất cả' },
    { key: 'full_time', label: 'Toàn thời gian' },
    { key: 'part_time', label: 'Bán thời gian' },
    { key: 'internship', label: 'Thực tập' },
    { key: 'remote', label: 'Remote' },
];

const Header = ({ jobType, setJobType }) => {
    return (
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
    );
};

export default Header;
