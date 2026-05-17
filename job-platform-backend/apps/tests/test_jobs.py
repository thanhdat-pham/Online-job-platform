from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.models.user import User
from apps.models.employers import Employer, Company
from apps.models.jobs import Job, JobCategory
from apps.models.candidates import CandidateProfile


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


def create_employer(username='employer1', email='employer1@test.com', verified=True):
    user = User.objects.create_user(
        username=username, email=email,
        password='Test@1234', role='EMPLOYER',
        phone_number=next_phone(), is_verified=verified
    )
    company = Company.objects.create(name='Công ty Test', address='HCM')
    Employer.objects.create(user=user, company=company, position='HR')
    return user


def create_job(employer_user, category, title='Lập trình viên', location='HCM',
               salary_min=10000000, salary_max=20000000):
    employer = employer_user.employer_profile
    return Job.objects.create(
        Employer=employer,
        category=category,
        title=title,
        description='Mô tả công việc',
        requirements='Yêu cầu công việc',
        benefits='Phúc lợi tốt',
        salary_min=salary_min,
        salary_max=salary_max,
        location=location,
        deadline='2026-12-31'
    )


class JobListSearchTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/jobs/'
        self.candidate = create_candidate()
        self.employer = create_employer()
        self.category = JobCategory.objects.create(name='IT')
        create_job(self.employer, self.category, title='Backend Developer', location='HCM', salary_min=15000000, salary_max=25000000)
        create_job(self.employer, self.category, title='Frontend Developer', location='HN', salary_min=10000000, salary_max=18000000)
        self.client.force_authenticate(user=self.candidate)

    def test_list_jobs_success(self):
        """Ứng viên xem danh sách việc làm thành công"""
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_list_jobs_employer_forbidden(self):
        """Nhà tuyển dụng không được dùng API danh sách job của ứng viên"""
        self.client.force_authenticate(user=self.employer)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_search_by_title(self):
        """Tìm kiếm theo tên công việc"""
        res = self.client.get(self.url, {'search': 'Backend'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        self.assertEqual(len(results), 1)

    def test_search_by_location(self):
        """Tìm kiếm theo địa điểm"""
        res = self.client.get(self.url, {'location': 'HN'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        self.assertEqual(len(results), 1)

    def test_search_by_category(self):
        """Tìm kiếm theo ngành nghề"""
        res = self.client.get(self.url, {'category': self.category.id})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        self.assertEqual(len(results), 2)

    def test_sort_by_salary_desc(self):
        """Sắp xếp theo lương cao đến thấp"""
        res = self.client.get(self.url, {'ordering': '-salary_min'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        self.assertGreaterEqual(results[0]['salary_min'], results[1]['salary_min'])

    def test_sort_by_salary_asc(self):
        """Sắp xếp theo lương thấp đến cao"""
        res = self.client.get(self.url, {'ordering': 'salary_min'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        self.assertLessEqual(results[0]['salary_min'], results[1]['salary_min'])

    def test_sort_by_created_at(self):
        """Sắp xếp theo ngày đăng mới nhất"""
        res = self.client.get(self.url, {'ordering': '-created_at'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_pagination_max_20(self):
        """Phân trang tối đa 20 job/trang"""
        category2 = JobCategory.objects.create(name='Marketing')
        for i in range(25):
            create_job(self.employer, category2, title=f'Job {i}', location='HCM')
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        self.assertLessEqual(len(results), 20)

    def test_unauthenticated_forbidden(self):
        """Chưa đăng nhập không xem được danh sách job"""
        self.client.force_authenticate(user=None)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class JobCompareTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/jobs/compare/'
        self.candidate = create_candidate()
        self.employer = create_employer()
        self.category = JobCategory.objects.create(name='IT')
        self.job1 = create_job(self.employer, self.category, title='Job A')
        self.job2 = create_job(self.employer, self.category, title='Job B')
        self.client.force_authenticate(user=self.candidate)

    def test_compare_same_category_success(self):
        """So sánh các job cùng lĩnh vực thành công"""
        res = self.client.get(self.url, {'ids': f'{self.job1.id},{self.job2.id}'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_compare_different_category_fail(self):
        """So sánh job khác lĩnh vực thì báo lỗi"""
        other_category = JobCategory.objects.create(name='Marketing')
        job3 = create_job(self.employer, other_category, title='Job C')
        res = self.client.get(self.url, {'ids': f'{self.job1.id},{job3.id}'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_compare_employer_forbidden(self):
        """Nhà tuyển dụng không được dùng chức năng so sánh"""
        self.client.force_authenticate(user=self.employer)
        res = self.client.get(self.url, {'ids': f'{self.job1.id},{self.job2.id}'})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class EmployerJobCRUDTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/employer-jobs/'
        self.employer = create_employer()
        self.unverified_employer = create_employer(
            username='unverified', email='unverified@test.com', verified=False
        )
        self.category = JobCategory.objects.create(name='IT')
        self.client.force_authenticate(user=self.employer)

    def test_create_job_success(self):
        """NTD đã xác minh đăng tin thành công"""
        res = self.client.post(self.url, {
            'title': 'Python Developer',
            'description': 'Mô tả',
            'requirements': 'Yêu cầu',
            'benefits': 'Phúc lợi',
            'salary_min': 10000000,
            'salary_max': 20000000,
            'location': 'HCM',
            'experience_level': 'no_exp',
            'deadline': '2026-12-31',
            'category': self.category.id
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_create_job_unverified_forbidden(self):
        """NTD chưa được duyệt không được đăng tin"""
        self.client.force_authenticate(user=self.unverified_employer)
        res = self.client.post(self.url, {
            'title': 'Job Test',
            'description': 'Mô tả',
            'requirements': 'Yêu cầu',
            'location': 'HCM',
            'deadline': '2026-12-31',
            'category': self.category.id
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_job_success(self):
        """NTD cập nhật tin tuyển dụng thành công"""
        job = create_job(self.employer, self.category)
        res = self.client.patch(f'{self.url}{job.id}/', {'title': 'Tên mới'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_delete_job_success(self):
        """NTD xóa tin tuyển dụng thành công"""
        job = create_job(self.employer, self.category)
        res = self.client.delete(f'{self.url}{job.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_list_only_own_jobs(self):
        """NTD chỉ thấy tin tuyển dụng của mình"""
        create_job(self.employer, self.category, title='Job của tôi')
        employer2 = create_employer(username='emp2', email='emp2@test.com')
        create_job(employer2, self.category, title='Job của người khác')
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        self.assertEqual(len(results), 1)