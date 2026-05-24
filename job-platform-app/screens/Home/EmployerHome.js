import { View, Text, StyleSheet } from "react-native";

const EmployerHome = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Chào mừng Nhà tuyển dụng!</Text>
            {/* Thêm danh sách đơn ứng tuyển hoặc tin đăng của bạn vào đây */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    text: { fontSize: 18, fontWeight: 'bold' }
});
export default EmployerHome;