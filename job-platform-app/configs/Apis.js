import axios from "axios";

const BASE_URL = "http://10.0.2.2:8000/"

export const endpoints = {
    // Auth
    'login': '/users/login/',
    'register': '/users/',
    'current-user': '/users/current-user/',
    'change-password': '/users/change-password/',
    'logout': '/users/logout/',

    // Companies (preset)
    'preset_companies': '/users/companies/',

    // Jobs (public)
    'jobs': '/jobs/',
    'job-detail': (id) => `/jobs/${id}/`,

    // Applications (candidate)
    'apply-job': (id) => `/jobs/${id}/apply/`,
    'my-applications': '/applications/me/',
    'withdraw-application': (id) => `/applications/${id}/withdraw/`,

    // Saved Jobs
    'saved-jobs': '/candidate/saved-jobs/',
    'toggle-saved-job': '/candidate/saved-jobs/toggle/',

    // Candidate profile
    'candidate-profile': '/candidate/profile/',

    // Employer
    'employer-jobs': '/employer/jobs/',
    'employer-job-detail': (id) => `/employer/jobs/${id}/`,
    'employer-job-applications': (id) => `/employer/jobs/${id}/applications/`,
    'review-application': (id) => `/employer/jobs/${id}/review-application/`,
    'employer-profile': '/employer/profile/',
    'employer-stats': '/employer/jobs/stats/',

    // Notifications
    'notifications': '/notifications/',
    'notification-read': (id) => `/notifications/${id}/read/`,
    'notifications-read-all': '/notifications/read-all/',
    'notifications-unread-count': '/notifications/unread-count/',
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
