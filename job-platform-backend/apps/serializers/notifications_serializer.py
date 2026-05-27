from rest_framework import serializers
from ..models.notification import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'message',
            'notification_type',
            'target_id',
            'target_type',
            'is_read',
            'created_at'
        ]