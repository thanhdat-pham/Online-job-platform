from rest_framework import permissions


# ─────────────────────────────────────────────
# HELPER MIXINS  (kiểm tra role trên User model)
# ─────────────────────────────────────────────

class IsCandidate(permissions.BasePermission):
    """User đã xác thực và có role CANDIDATE."""
    message = "Chức năng này chỉ dành cho tài khoản Ứng viên."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "CANDIDATE"
        )


class IsEmployer(permissions.BasePermission):
    """User đã xác thực và có role EMPLOYER."""
    message = "Chức năng này chỉ dành cho tài khoản Nhà tuyển dụng."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "EMPLOYER"
        )


class IsVerifiedEmployer(permissions.BasePermission):
    """
    User đã xác thực, có role EMPLOYER, VÀ đã được Admin duyệt (is_verified).
    Dùng cho các thao tác quan trọng: đăng tin, xem / duyệt đơn.
    """
    message = "Tài khoản Nhà tuyển dụng của bạn chưa được xác minh."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "EMPLOYER"
            and request.user.is_verified
        )


class IsAdminUser(permissions.BasePermission):
    """User có role ADMIN (hoặc is_staff Django)."""
    message = "Chỉ Quản trị viên mới có quyền thực hiện thao tác này."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.role == "ADMIN" or request.user.is_staff)
        )


# ─────────────────────────────────────────────
# OBJECT-LEVEL PERMISSIONS
# ─────────────────────────────────────────────

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Chỉ chủ sở hữu mới được sửa / xóa; người khác chỉ đọc.
    Object cần có thuộc tính `user` trỏ về User.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class IsJobOwner(permissions.BasePermission):
    """
    Chỉ Employer sở hữu Job mới được sửa / xóa tin tuyển dụng đó.
    Object cần có thuộc tính `employer.user`.
    """
    message = "Bạn không có quyền thao tác trên tin tuyển dụng này."

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            hasattr(obj, "employer")
            and obj.employer.user == request.user
        )


class IsApplicationOwner(permissions.BasePermission):
    """
    Candidate chỉ được thao tác trên Application của chính mình.
    Object cần có thuộc tính `candidate.user`.
    """
    message = "Bạn không có quyền thao tác trên đơn ứng tuyển này."

    def has_object_permission(self, request, view, obj):
        return (
            hasattr(obj, "candidate")
            and obj.candidate.user == request.user
        )


# ─────────────────────────────────────────────
# (Backward-compat) Giữ lại tên cũ để không vỡ code hiện tại
# ─────────────────────────────────────────────
IsVerifiedUser = IsVerifiedEmployer