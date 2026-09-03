from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class IsExpertOrStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or hasattr(request.user, 'expert_profile'))
        )

    def has_object_permission(self, request, view, obj):
        return bool(
            request.user.is_staff
            or (getattr(obj, 'reference_expert', None) and obj.reference_expert.user_id == request.user.id)
        )
