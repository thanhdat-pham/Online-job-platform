import { StyleSheet } from "react-native";

const COLORS = {
    primary: '#1565C0',
    secondary: '#42A5F5',
    accent: '#FF6F00',
    success: '#2E7D32',
    danger: '#C62828',
    warning: '#F57F17',
    background: '#F5F7FA',
    card: '#FFFFFF',
    text: '#212121',
    textLight: '#757575',
    border: '#E0E0E0',
    chip: '#E3F2FD',
};

export { COLORS };

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
        flexDirection: "row",
        alignItems: 'center',
    },
    wrap: {
        flexWrap: "wrap",
    },
    padding: {
        padding: 12,
    },
    margin: {
        margin: 6,
    },
    marginV: {
        marginVertical: 6,
    },
    subject: {
        fontSize: 22,
        fontWeight: "bold",
        color: COLORS.primary,
        textAlign: "center",
        marginVertical: 10,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        marginHorizontal: 12,
        marginVertical: 6,
        padding: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.textLight,
        marginTop: 2,
    },
    sectionHeader: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.primary,
        marginHorizontal: 12,
        marginTop: 16,
        marginBottom: 4,
    },
    input: {
        marginVertical: 5,
        backgroundColor: '#fff',
    },
    btn: {
        marginVertical: 8,
        borderRadius: 8,
    },
    chip: {
        margin: 4,
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 8,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textLight,
        marginTop: 40,
        fontSize: 15,
    },
});
