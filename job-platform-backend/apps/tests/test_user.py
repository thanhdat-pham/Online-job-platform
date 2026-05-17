from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.models.user import User


_phone_counter = [0]

def next_phone():
    _phone_counter[0] += 1
    return f'09{_phone_counter[0]:08d}'

def create_candidate(username='candidate1', email='candidate1@test.com', password='Test@1234'):
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role='CANDIDATE',
        phone_number=next_phone(),
        is_verified=True
    )
    return user


class RegisterTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/users/'

    def test_register_candidate_success(self):
        """Đăng ký ứng viên thành công"""
        data = {
            'username': 'newcandidate',
            'email': 'newcandidate@test.com',
            'password': 'Test@1234',
            'role': 'CANDIDATE',
            'phone_number': '0911111111',
        }
        res = self.client.post(self.url, data, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_register_employer_success(self):
        """Đăng ký nhà tuyển dụng thành công"""
        data = {
            'username': 'newemployer',
            'email': 'newemployer@test.com',
            'password': 'Test@1234',
            'role': 'EMPLOYER',
            'phone_number': '0922222222',
        }
        res = self.client.post(self.url, data, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_register_admin_blocked(self):
        """Không được phép đăng ký tài khoản ADMIN"""
        data = {
            'username': 'hacker',
            'email': 'hacker@test.com',
            'password': 'Test@1234',
            'role': 'ADMIN',
            'phone_number': '0933333333',
        }
        res = self.client.post(self.url, data, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email(self):
        """Email trùng thì báo lỗi"""
        create_candidate(email='dup@test.com', username='user1')
        data = {
            'username': 'user2',
            'email': 'dup@test.com',
            'password': 'Test@1234',
            'role': 'CANDIDATE',
            'phone_number': '0944444444',
        }
        res = self.client.post(self.url, data, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_phone(self):
        """Thiếu số điện thoại thì báo lỗi"""
        data = {
            'username': 'nophone',
            'email': 'nophone@test.com',
            'password': 'Test@1234',
            'role': 'CANDIDATE',
        }
        res = self.client.post(self.url, data, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class ChangePasswordTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/users/change-password/'
        self.user = create_candidate()
        self.client.force_authenticate(user=self.user)

    def test_change_password_success(self):
        """Đổi mật khẩu thành công"""
        res = self.client.post(self.url, {
            'old_password': 'Test@1234',
            'new_password': 'NewPass@5678'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_change_password_wrong_old(self):
        """Mật khẩu cũ sai thì báo lỗi"""
        res = self.client.post(self.url, {
            'old_password': 'SaiMatKhau',
            'new_password': 'NewPass@5678'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_missing_fields(self):
        """Thiếu trường thì báo lỗi"""
        res = self.client.post(self.url, {'old_password': 'Test@1234'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_unauthenticated(self):
        """Chưa đăng nhập thì không đổi được"""
        self.client.force_authenticate(user=None)
        res = self.client.post(self.url, {
            'old_password': 'Test@1234',
            'new_password': 'NewPass@5678'
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class LogoutTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/users/logout/'
        self.user = create_candidate()
        self.client.force_authenticate(user=self.user)

    def test_logout_success(self):
        """Đăng xuất thành công"""
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_logout_unauthenticated(self):
        """Chưa đăng nhập thì không logout được"""
        self.client.force_authenticate(user=None)
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)