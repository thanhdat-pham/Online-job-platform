import { TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import Styles, { COLORS } from "../styles/Styles";

const statusColor = {
    full_time: '#1565C0',
    part_time: '#6A1B9A',
    internship: '#E65100',
    remote: '#2E7D32',
};

const JobItem = ({ item, onPress }) => {
    const salary = item.salary_min && item.salary_max
        ? `${Number(item.salary_min).toLocaleString()} - ${Number(item.salary_max).toLocaleString()} VND`
        : item.salary_min
            ? `Từ ${Number(item.salary_min).toLocaleString()} VND`
            : 'Thỏa thuận';

    const jobTypeLabel = {
        full_time: 'Toàn thời gian',
        part_time: 'Bán thời gian',
        internship: 'Thực tập',
        remote: 'Remote',
    }[item.job_type] || item.job_type;

    return (
        <TouchableOpacity style={Styles.card} onPress={onPress} activeOpacity={0.85}>
            <View style={[Styles.row, { justifyContent: 'space-between' }]}>
                <Text style={Styles.title} numberOfLines={2} style={{ flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text }}>
                    {item.title}
                </Text>
                <View style={[Styles.badge, { backgroundColor: statusColor[item.job_type] || COLORS.primary, marginLeft: 8 }]}>
                    <Text style={Styles.badgeText}>{jobTypeLabel}</Text>
                </View>
            </View>

            <Text style={{ color: COLORS.primary, fontWeight: '600', marginTop: 4 }}>
                🏢 {item.employer?.company?.name || item.company_name || 'Công ty'}
            </Text>

            <View style={[Styles.row, { marginTop: 6 }]}>
                <Text style={Styles.subtitle}>📍 {item.location || 'Không xác định'}</Text>
                <Text style={{ color: COLORS.textLight, marginLeft: 12, fontSize: 13 }}>💰 {salary}</Text>
            </View>

            <View style={[Styles.row, { marginTop: 8, flexWrap: 'wrap' }]}>
                {item.required_skills && item.required_skills.split(',').slice(0, 3).map((skill, i) => (
                    <View key={i} style={{ backgroundColor: COLORS.chip, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, margin: 2 }}>
                        <Text style={{ fontSize: 11, color: COLORS.primary }}>{skill.trim()}</Text>
                    </View>
                ))}
            </View>

            <Text style={{ color: COLORS.textLight, fontSize: 11, marginTop: 8 }}>
                📅 Hạn: {item.deadline ? new Date(item.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}
            </Text>
        </TouchableOpacity>
    );
};

export default JobItem;
