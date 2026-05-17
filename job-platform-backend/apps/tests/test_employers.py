from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.models.user import User
from apps.models.employers import Employer, Company
from apps.models.candidates import CandidateProfile, Application
from apps.models.jobs import Job, JobCategory


_phone_counter = [0]

def next_phone():
    _phone_counter[0] += 1
    return f'09{_phone_counter[0]:08d}'

def create_employer(username='employer1', email='employer1@test.com', verified=True):
    user = User.objects.create_user(
        username=username, email=email,
        password='Test@1234', role='EMPLOYER',
        phone_number=next_phone(), is_verified=verified
    )
    company = Company.objects.create(name='Công ty Test', address='HCM')
    Employer.objects.create(user=user, company=company, position='HR')
    return user


def create_candidate(username='candidate1', email='candidate1@test.com'):
    user = User.objects.create_user(
        username=username, email=email,
        password='Test@1234', role='CANDIDATE',
        phone_number=next_phone(), is_verified=True
    )
    CandidateProfile.objects.create(user=user, full_name='Ứng Viên Test')
    return user


def create_job(employer_user):
    category = JobCategory.objects.create(name='IT')
    return Job.objects.create(
        Employer=employer_user.employer_profile,
        category=category,
        title='Python Developer',
        description='Mô tả',
        requirements='Yêu cầu',
        location='HCM',
        deadline='2026-12-31'
    )


class EmployerProfileTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/employer/profile/'
        self.employer = create_employer()
        self.client.force_authenticate(user=self.employer)

    def test_get_profile_success(self):
        """NTD xem hồ sơ của mình thành công"""
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_update_profile_success(self):
        """NTD cập nhật hồ sơ thành công"""
        res = self.client.patch(self.url, {'position': 'CEO', 'company_size': '51-200'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_candidate_cannot_access_employer_profile(self):
        """Ứng viên không truy cập được hồ sơ NTD"""
        candidate = create_candidate()
        self.client.force_authenticate(user=candidate)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_forbidden(self):
        """Chưa đăng nhập không xem được hồ sơ"""
        self.client.force_authenticate(user=None)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class EmployerCompanyTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/employer/company/'
        self.employer = create_employer()
        self.client.force_authenticate(user=self.employer)

    def test_get_company_success(self):
        """NTD xem thông tin công ty thành công"""
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['has_company'])

    def test_select_company_success(self):
        """NTD chọn công ty khác thành công"""
        new_company = Company.objects.create(name='Công ty Mới', address='HN')
        res = self.client.post('/employer/select-company/', {'company_id': new_company.id})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_select_company_not_found(self):
        """Chọn công ty không tồn tại thì báo lỗi"""
        res = self.client.post('/employer/select-company/', {'company_id': 99999})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class ReviewApplicationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.employer = create_employer()
        self.candidate = create_candidate()
        self.job = create_job(self.employer)
        self.application = Application.objects.create(
            candidate=self.candidate.candidate_profile,
            job=self.job,
            status='pending'
        )
        self.url = f'/employer-jobs/{self.job.id}/review-application/'
        self.client.force_authenticate(user=self.employer)

    def test_review_application_reviewed(self):
        """NTD cập nhật trạng thái 'reviewed' thành công"""
        res = self.client.post(self.url, {'status': 'reviewed', 'application_id': self.application.id})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_review_application_accepted(self):
        """NTD cập nhật trạng thái 'accepted' thành công"""
        res = self.client.post(self.url, {'status': 'accepted', 'application_id': self.application.id})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_review_application_rejected(self):
        """NTD từ chối đơn ứng tuyển thành công"""
        res = self.client.post(self.url, {'status': 'rejected', 'application_id': self.application.id})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_review_application_invalid_status(self):
        """Trạng thái không hợp lệ thì báo lỗi"""
        res = self.client.post(self.url, {'status': 'approved'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_job_applications_success(self):
        """NTD xem danh sách ứng viên nộp vào job của mình"""
        res = self.client.get(f'/employer-jobs/{self.job.id}/applications/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_candidate_cannot_review(self):
        """Ứng viên không được review đơn"""
        self.client.force_authenticate(user=self.candidate)
        res = self.client.post(self.url, {'status': 'reviewed'})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)