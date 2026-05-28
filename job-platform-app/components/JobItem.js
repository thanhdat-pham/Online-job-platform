import { TouchableOpacity, View, Image } from "react-native";
import { Text } from "react-native-paper";
import Styles, { COLORS } from "../styles/Styles";

const JobItem = ({ item, onPress, filters }) => {
    const companyName = item.employer?.company_name || 'Công ty';
    const companyLogo = item.employer?.company_logo;

    const salary = item.salary_min && item.salary_max
        ? `${Number(item.salary_min).toLocaleString()} - ${Number(item.salary_max).toLocaleString()} VND`
        : item.salary_min
            ? `Từ ${Number(item.salary_min).toLocaleString()} VND`
            : 'Thỏa thuận';

    const hasFilter = filters && (
        filters.salary_min || filters.salary_max ||
        filters.location || filters.company
    );

    return (
        <TouchableOpacity style={Styles.card} onPress={onPress} activeOpacity={0.85}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {companyLogo ? (
                    <Image
                        source={{ uri: companyLogo }}
                        style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#f3f4f6' }}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 20 }}>{'\u{1F3E2}'}</Text>
                    </View>
                )}
                <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: 13, color: COLORS.primary, fontWeight: '600' }}>
                        {companyName}
                    </Text>
                    <Text numberOfLines={2} style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 2 }}>
                        {item.title}
                    </Text>
                    {hasFilter && (
                        <View style={{ marginTop: 6, gap: 2 }}>
                            {(filters.location || filters.salary_min || filters.salary_max) && (
                                <Text numberOfLines={1} style={{ fontSize: 12, color: COLORS.textLight }}>
                                    {'\u{1F4CD} '}{item.location || 'Không xác định'}
                                </Text>
                            )}
                            {(filters.salary_min || filters.salary_max) && (
                                <Text numberOfLines={1} style={{ fontSize: 12, color: '#16a34a', fontWeight: '600' }}>
                                    {'\u{1F4B5} '}{salary}
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default JobItem;