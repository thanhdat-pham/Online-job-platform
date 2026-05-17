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

def create_candidate(username='candidate1', email='candidate1@test.com'):
    user = User.objects.create_user(
        username=username, email=email,
        password='Test@1234', role='CANDIDATE',
        phone_number=next_phone(), is_verified=True
    )
    CandidateProfile.objects.create(user=user, full_name='Ứng Viên Test')
    return user


def create_employer():
    user = User.objects.create_user(
        username='employer1', email='employer1@test.com',
        password='Test@1234', role='EMPLOYER',
        phone_number=next_phone(), is_verified=True
    )
    company = Company.objects.create(name='Công ty Test', address='HCM')
    Employer.objects.create(user=user, company=company)
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


class CandidateProfileTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/candidates/current-user/'
        self.candidate = create_candidate()
        self.client.force_authenticate(user=self.candidate)

    def test_get_profile_success(self):
        """Ứng viên xem hồ sơ của mình thành công"""
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['full_name'], 'Ứng Viên Test')

    def test_update_profile_success(self):
        """Ứng viên cập nhật hồ sơ thành công"""
        res = self.client.patch(self.url, {
            'full_name': 'Tên Mới',
            'location': 'Hà Nội',
            'title': 'Backend Developer'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['full_name'], 'Tên Mới')

    def test_get_profile_unauthenticated(self):
        """Chưa đăng nhập không xem được hồ sơ"""
        self.client.force_authenticate(user=None)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class ApplyJobTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/candidates/apply-job/'
        self.candidate = create_candidate()
        self.employer = create_employer()
        self.job = create_job(self.employer)
        self.client.force_authenticate(user=self.candidate)

    def test_apply_job_success(self):
        """Ứng viên nộp đơn thành công"""
        res = self.client.post(self.url, {
            'job': self.job.id,
            'cover_letter': 'Tôi muốn ứng tuyển vị trí này'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['status'], 'pending')

    def test_apply_job_duplicate(self):
        """Không được nộp đơn 2 lần cho cùng 1 job"""
        Application.objects.create(
            candidate=self.candidate.candidate_profile,
            job=self.job,
            status='pending'
        )
        res = self.client.post(self.url, {'job': self.job.id})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_apply_job_not_found(self):
        """Job không tồn tại thì báo lỗi"""
        res = self.client.post(self.url, {'job': 99999})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_apply_job_unauthenticated(self):
        """Chưa đăng nhập không nộp được đơn"""
        self.client.force_authenticate(user=None)
        res = self.client.post(self.url, {'job': self.job.id})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class MyApplicationsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/candidates/my-applications/'
        self.candidate = create_candidate()
        self.employer = create_employer()
        self.job = create_job(self.employer)
        Application.objects.create(
            candidate=self.candidate.candidate_profile,
            job=self.job,
            status='pending'
        )
        self.client.force_authenticate(user=self.candidate)

    def test_my_applications_success(self):
        """Ứng viên xem danh sách đơn đã nộp thành công"""
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_my_applications_unauthenticated(self):
        """Chưa đăng nhập không xem được"""
        self.client.force_authenticate(user=None)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class CancelApplicationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.candidate = create_candidate()
        self.employer = create_employer()
        self.job = create_job(self.employer)
        self.application = Application.objects.create(
            candidate=self.candidate.candidate_profile,
            job=self.job,
            status='pending'
        )
        self.client.force_authenticate(user=self.candidate)

    def test_cancel_pending_application_success(self):
        """Hủy đơn đang chờ thành công"""
        res = self.client.delete(f'/candidates/{self.application.id}/cancel-application/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_cancel_reviewed_application_fail(self):
        """Không hủy được đơn đã được NTD xử lý"""
        self.application.status = 'reviewed'
        self.application.save()
        res = self.client.delete(f'/candidates/{self.application.id}/cancel-application/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancel_other_candidate_application_fail(self):
        """Không hủy được đơn của ứng viên khác"""
        other_candidate = create_candidate(username='other', email='other@test.com')
        self.client.force_authenticate(user=other_candidate)
        res = self.client.delete(f'/candidates/{self.application.id}/cancel-application/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)