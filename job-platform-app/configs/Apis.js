import axios from "axios";

const BASE_URL = "http://10.0.2.2:8000/"

export const endpoints = {
    'login': '/users/login/',
    'register': '/users/',
    'current-user': '/users/current-user/',
    'change-password': '/users/change-password/',
    'logout': '/users/logout/',

    'preset_companies': '/users/companies/',

    'jobs': '/jobs/',
    'job-detail': (id) => `/jobs/${id}/`,

    'apply-job': (id) => `/jobs/${id}/apply/`,
    'my-applications': '/applications/me/',
    'withdraw-application': (id) => `/applications/${id}/withdraw/`,

    'saved-jobs': '/candidates/saved-jobs/',
    'toggle-saved-job': '/candidates/saved-jobs/toggle/',

    'candidate-profile': '/candidates/profile/',

    'employer-jobs': '/employer/jobs/',
    'employer-job-detail': (id) => `/employer/jobs/${id}/`,
    'employer-job-applications': (id) => `/employer/jobs/${id}/applications/`,
    'review-application': (id) => `/employer/jobs/${id}/review-application/`,
    'employer-profile': '/employer/profile/',
    'employer-stats': '/employer/jobs/stats/',

    'notifications': '/notifications/',
    'notification-read': (id) => `/notifications/${id}/read/`,
    'notifications-read-all': '/notifications/read-all/',
    'notifications-unread-count': '/notifications/unread-count/',

    'request-verification': '/employer/profile/request-verification/',
    'verification-status': '/employer/profile/verification-status/',
    'job-categories': '/categories/',
};

export const authApis = (token) => axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': `Bearer ${token}` }
});

export default axios.create({ baseURL: BASE_URL });