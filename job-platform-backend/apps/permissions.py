from rest_framework import permissions




class IsCandidate(permissions.BasePermission):

    message = "Chức năng này chỉ dành cho tài khoản Ứng viên."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "CANDIDATE"
        )


class IsEmployer(permissions.BasePermission):

    message = "Chức năng này chỉ dành cho tài khoản Nhà tuyển dụng."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "EMPLOYER"
        )


class IsVerifiedEmployer(permissions.BasePermission):

    message = "Tài khoản Nhà tuyển dụng của bạn chưa được xác minh."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "EMPLOYER"
            and request.user.is_verified
        )


class IsAdminUser(permissions.BasePermission):

    message = "Chỉ Quản trị viên mới có quyền thực hiện thao tác này."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.role == "ADMIN" or request.user.is_staff)
        )




class IsOwnerOrReadOnly(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class IsJobOwner(permissions.BasePermission):

    message = "Bạn không có quyền thao tác trên tin tuyển dụng này."

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            hasattr(obj, "employer")
            and obj.employer.user == request.user
        )


class IsApplicationOwner(permissions.BasePermission):

    message = "Bạn không có quyền thao tác trên đơn ứng tuyển này."

    def has_object_permission(self, request, view, obj):
        return (
            hasattr(obj, "candidate")
            and obj.candidate.user == request.user
        )



class IsVerifiedUser(permissions.BasePermission):
    message = "Tài khoản của bạn chưa được xác minh."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_verified
        )