import axios from "axios";

// ⚠️ Thay IP_ADDRESS bằng địa chỉ IP máy chạy backend của bạn
// Ví dụ: http://192.168.1.10:8000/
const BASE_URL = "http://10.0.2.2:8000/"

export const endpoints = {
    // Auth
    'login': '/users/login/',
    'register': '/users/',
    'current-user': '/users/current-user/',
    'change-password': '/users/change-password/',
    'logout': '/users/logout/',

    // Jobs (public)
    'jobs': '/jobs/',
    'job-detail': (id) => `/jobs/${id}/`,

    // Applications (candidate)
    'apply-job': (id) => `/jobs/${id}/apply/`,
    'my-applications': '/applications/me/',
    'withdraw-application': (id) => `/applications/${id}/withdraw/`,

    // Employer
    'preset_companies': '/users/companies/',
    'employer-jobs': '/employer/jobs/',
    'employer-job-detail': (id) => `/employer/jobs/${id}/`,
    'employer-job-applications': (id) => `/employer/jobs/${id}/applications/`,
    'review-application': (id) => `/employer/jobs/${id}/review-application/`,
    'employer-profile': '/employer/profile/',

    // Candidate profile
    'candidate-profile': '/candidate/profile/',
};

export const authApis = (token) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};

export default axios.create({
    baseURL: BASE_URL
});
