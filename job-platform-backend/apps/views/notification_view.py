from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.models.notification import Notification
from apps.serializers.notifications_serializer import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')[:50]

    def get_base_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['patch'])
    def read(self, request, pk=None):
        try:
            notif = self.get_base_queryset().get(pk=pk)
        except Notification.DoesNotExist:
            return Response({'detail': 'Không tìm thấy.'}, status=404)
        notif.is_read = True
        notif.save()
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['patch'])
    def read_all(self, request):
        self.get_base_queryset().filter(is_read=False).update(is_read=True)
        return Response({'detail': 'Đã đánh dấu tất cả là đã đọc.'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_base_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})