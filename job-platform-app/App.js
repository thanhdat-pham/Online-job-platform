import { useContext, useReducer } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PaperProvider, Icon } from "react-native-paper";

import { MyUserContext } from "./configs/Contexts";
import { MyUserReducer } from "./reducers/reducers";
import { COLORS } from "./styles/Styles";

// Screens
import Home from "./screens/Home/Home";
import JobDetail from "./screens/Jobs/JobDetail";
import ApplyJob from "./screens/Jobs/ApplyJob";
import MyApplications from "./screens/Jobs/MyApplications";
import Login from "./screens/User/Login";
import Register from "./screens/User/Register";
import Profile from "./screens/User/Profile";
import EmployerDashboard from "./screens/Employer/EmployerDashboard";
import PostJob from "./screens/Employer/PostJob";
import ManageJobs from "./screens/Employer/ManageJobs";
import ViewApplications from "./screens/Employer/ViewApplications";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }}>
    <Stack.Screen name="home-list" component={Home} options={{ title: 'Việc Làm' }} />
    <Stack.Screen name="job-detail" component={JobDetail} options={{ title: 'Chi tiết công việc' }} />
    <Stack.Screen name="apply-job" component={ApplyJob} options={{ title: 'Nộp hồ sơ' }} />
  </Stack.Navigator>
);

const EmployerStack = () => (
  <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }}>
    <Stack.Screen name="employer-home" component={EmployerDashboard} options={{ title: 'Nhà tuyển dụng', headerShown: false }} />
    <Stack.Screen name="post-job" component={PostJob} options={{ title: 'Đăng tin tuyển dụng' }} />
    <Stack.Screen name="manage-jobs" component={ManageJobs} options={{ title: 'Quản lý tin đăng' }} />
    <Stack.Screen name="view-applications" component={ViewApplications} options={{ title: 'Hồ sơ ứng tuyển' }} />
  </Stack.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }}>
    <Stack.Screen name="login" component={Login} options={{ title: 'Đăng nhập' }} />
    <Stack.Screen name="register" component={Register} options={{ title: 'Đăng ký' }} />
  </Stack.Navigator>
);

const TabNavigator = () => {
  const [user] = useContext(MyUserContext);
  const isEmployer = user?.role === 'EMPLOYER';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: { borderTopWidth: 1, borderTopColor: COLORS.border },
      }}
    >
      <Tab.Screen
        name="jobs"
        component={HomeStack}
        options={{ title: 'Việc làm', tabBarIcon: ({ color }) => <Icon source="briefcase-search" size={26} color={color} /> }}
      />

      {user === null ? (
        <Tab.Screen
          name="auth"
          component={AuthStack}
          options={{ title: 'Đăng nhập', tabBarIcon: ({ color }) => <Icon source="account" size={26} color={color} /> }}
        />
      ) : isEmployer ? (
        <>
          <Tab.Screen
            name="employer"
            component={EmployerStack}
            options={{ title: 'Quản lý', tabBarIcon: ({ color }) => <Icon source="office-building" size={26} color={color} /> }}
          />
          <Tab.Screen
            name="profile"
            component={Profile}
            options={{ title: 'Tài khoản', tabBarIcon: ({ color }) => <Icon source="account-circle" size={26} color={color} />, headerShown: true, headerTitle: 'Hồ sơ', headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }}
          />
        </>
      ) : (
        <>
          <Tab.Screen
            name="my-applications"
            component={MyApplications}
            options={{ title: 'Hồ sơ của tôi', tabBarIcon: ({ color }) => <Icon source="file-document" size={26} color={color} />, headerShown: true, headerTitle: 'Hồ sơ ứng tuyển', headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }}
          />
          <Tab.Screen
            name="profile"
            component={Profile}
            options={{ title: 'Tài khoản', tabBarIcon: ({ color }) => <Icon source="account-circle" size={26} color={color} />, headerShown: true, headerTitle: 'Hồ sơ', headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

const App = () => {
  const [user, dispatch] = useReducer(MyUserReducer, null);

  return (
    <MyUserContext.Provider value={[user, dispatch]}>
      <PaperProvider>
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </PaperProvider>
    </MyUserContext.Provider>
  );
};

export default App;
