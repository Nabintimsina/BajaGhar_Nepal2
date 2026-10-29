from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import (
    Achievement,
    Category,
    Course,
    Favorite,
    Expert,
    Contact,
    Lesson,
    LessonAttachment,
    LearningProgress,
    RecentlyViewed,
    Subscription,
    TunerConfiguration,
    Branding,
    UserAchievement,
    UserProfile,
)


def get_requested_language(context) -> str:
    request = context.get('request') if isinstance(context, dict) else context
    if request is None:
        return 'en'

    query_params = getattr(request, 'query_params', None) or getattr(request, 'GET', None) or {}
    raw_language = query_params.get('lang') if hasattr(query_params, 'get') else None

    if not raw_language:
        raw_language = getattr(request, 'LANGUAGE_CODE', '') or ''

    if not raw_language and hasattr(request, 'headers'):
        raw_language = request.headers.get('Accept-Language', '').split(',')[0]

    return 'ne' if str(raw_language).lower().startswith('ne') else 'en'


def get_localized_value(instance, field_name: str, language: str, fallback=''):
    if instance is None:
        return fallback

    localized_name = f'{field_name}_ne'
    if language == 'ne':
        localized_value = getattr(instance, localized_name, None)
        if localized_value not in (None, ''):
            return localized_value

    value = getattr(instance, field_name, fallback)
    return fallback if value in (None, '') else value


class LanguageAwareModelSerializer(serializers.ModelSerializer):
    localized_fields: tuple[str, ...] = ()

    def get_language(self) -> str:
        return get_requested_language(self.context)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self.get_language() != 'ne':
            return data

        for field_name in self.localized_fields:
            localized_value = getattr(instance, f'{field_name}_ne', None)
            if localized_value not in (None, ''):
                data[field_name] = localized_value

        return data


class CategorySerializer(LanguageAwareModelSerializer):
    localized_fields = ('name', 'description')

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description']


class ExpertPreviewSerializer(LanguageAwareModelSerializer):
    localized_fields = ('name', 'expertise')
    photo = serializers.ImageField(allow_null=True, required=False)

    class Meta:
        model = Expert
        fields = ['id', 'name', 'expertise', 'photo']


class ExpertListSerializer(LanguageAwareModelSerializer):
    localized_fields = ('name', 'expertise', 'bio')
    photo = serializers.ImageField(allow_null=True, required=False)

    class Meta:
        model = Expert
        fields = ['id', 'name', 'expertise', 'photo', 'bio']


class ExpertDetailSerializer(LanguageAwareModelSerializer):
    localized_fields = ('name', 'expertise', 'bio', 'detailed_bio', 'achievements')
    photo = serializers.ImageField(allow_null=True, required=False)
    class Meta:
        model = Expert
        fields = [
            'id',
            'name',
            'name_ne',
            'expertise',
            'expertise_ne',
            'photo',
            'bio',
            'bio_ne',
            'detailed_bio',
            'detailed_bio_ne',
            'achievements',
            'achievements_ne',
            'contact_email',
        ]
        extra_kwargs = {
            'contact_email': {'required': False, 'allow_blank': True},
            'detailed_bio': {'required': False, 'allow_blank': True},
            'achievements': {'required': False},
        }

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        if instance.user_id:
            user = instance.user
            name_parts = instance.name.strip().split(None, 1)
            user.first_name = name_parts[0] if name_parts else ''
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''
            user.email = instance.contact_email
            user.save(update_fields=['first_name', 'last_name', 'email'])
        return instance


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ['id', 'name', 'email', 'subject', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'is_read', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()
    photo_upload = serializers.ImageField(write_only=True, required=False, allow_null=True)

    def get_photo(self, obj):
        profile = getattr(obj, 'user_profile', None)
        if not profile or not profile.photo:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(profile.photo.url) if request else profile.photo.url

    def update(self, instance, validated_data):
        photo = validated_data.pop('photo_upload', serializers.empty)
        instance = super().update(instance, validated_data)
        if photo is not serializers.empty:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            if photo is None and profile.photo:
                profile.photo.delete(save=False)
                profile.photo = None
            elif photo is not None:
                profile.photo = photo
            profile.save()
        return instance

    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'photo', 'photo_upload']
        read_only_fields = ['id']


class SubscriptionSerializer(serializers.ModelSerializer):
    is_premium = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = ['plan', 'is_active', 'is_premium', 'updated_at']

    def get_is_premium(self, obj):
        return obj.is_premium()


class CourseSerializer(serializers.ModelSerializer):
    lessons_count = serializers.IntegerField(source='lessons.count', read_only=True)
    reference_expert = ExpertPreviewSerializer(read_only=True)
    instrument_name = serializers.CharField(source='instrument.name', read_only=True, allow_null=True)
    instrument_image = serializers.ImageField(source='instrument.primary_image', read_only=True, allow_null=True)
    instrument_is_featured = serializers.BooleanField(source='instrument.is_featured', read_only=True, allow_null=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'level',
            'estimated_duration_minutes', 'what_you_will_learn',
            'target_audience', 'requirements', 'instrument',
            'instrument_name', 'instrument_image', 'instrument_is_featured',
            'reference_expert', 'is_premium', 'order', 'is_visible', 'lessons_count', 'updated_at',
        ]
        read_only_fields = ['updated_at']

    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.method in ('POST', 'PUT', 'PATCH') and not request.user.is_staff:
            expert = getattr(request.user, 'expert_profile', None)
            if expert is None:
                raise serializers.ValidationError('Only linked experts can manage courses.')
            submitted_expert = attrs.get('reference_expert')
            if submitted_expert and submitted_expert != expert:
                raise serializers.ValidationError('You can only assign courses to yourself.')
            attrs['reference_expert'] = expert
        return attrs


class TunerConfigurationSerializer(LanguageAwareModelSerializer):
    localized_fields = ('tuning_name', 'instructions')

    class Meta:
        model = TunerConfiguration
        fields = ['id', 'instrument', 'tuning_name', 'instructions', 'notes', 'frequencies', 'is_default', 'created_at', 'updated_at']
        read_only_fields = ['created_at']


class LessonAttachmentSerializer(serializers.ModelSerializer):
    model_3d = serializers.SerializerMethodField()

    def get_model_3d(self, obj):
        if not obj.model_3d:
            return None
        request = self.context.get('request')
        if request is not None:
            from django.urls import reverse
            return request.build_absolute_uri(reverse('protected-lesson-attachment-model', args=[obj.pk]))
        return obj.model_3d.url

    class Meta:
        model = LessonAttachment
        fields = ['id', 'lesson', 'attachment_type', 'photo', 'video_url', 'model_3d', 'order']


class ProtectedLessonModelField(serializers.FileField):
    def to_representation(self, value):
        if not value:
            return None
        request = self.context.get('request')
        if request is not None:
            from django.urls import reverse
            instance = getattr(self.parent, 'instance', None)
            lesson_id = getattr(instance, 'pk', None)
            if lesson_id:
                return request.build_absolute_uri(reverse('protected-lesson-model', args=[lesson_id]))
        return value.url


class LessonSerializer(serializers.ModelSerializer):
    attachments = LessonAttachmentSerializer(many=True, read_only=True)
    attachment_3d_model = ProtectedLessonModelField(required=False, allow_null=True)
    remove_photo = serializers.BooleanField(write_only=True, required=False, default=False)
    remove_attachment_3d_model = serializers.BooleanField(write_only=True, required=False, default=False)

    def create(self, validated_data):
        validated_data.pop('remove_photo', False)
        validated_data.pop('remove_attachment_3d_model', False)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        remove_photo = validated_data.pop('remove_photo', False)
        remove_model = validated_data.pop('remove_attachment_3d_model', False)
        if remove_photo and 'photo' not in validated_data and instance.photo:
            instance.photo.delete(save=False)
            instance.photo = None
        if remove_model and 'attachment_3d_model' not in validated_data and instance.attachment_3d_model:
            instance.attachment_3d_model.delete(save=False)
            instance.attachment_3d_model = None
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return {
                'id': data['id'],
                'title': data['title'],
                'description': data['description'],
                'course': data['course'],
                'order': data['order'],
                'is_premium': data['is_premium'],
                'duration_minutes': data['duration_minutes'],
            }

        has_premium_access = bool(user and user.is_authenticated)

        is_content_manager = bool(
            user
            and user.is_authenticated
            and (
                user.is_staff
                or (
                    instance.course.reference_expert_id
                    and instance.course.reference_expert.user_id == user.id
                )
            )
        )

        if has_premium_access:
            subscription = getattr(user, 'subscription', None)
            has_premium_access = bool(subscription and subscription.is_premium())

        is_premium_content = instance.is_premium or bool(instance.course_id and instance.course.is_premium)

        if is_premium_content and not has_premium_access and not is_content_manager:
            data['content'] = ''
            data['video_url'] = ''
            data['photo'] = None
            data['attachment_type'] = 'none'
            data['attachment_photo'] = None
            data['attachment_video'] = None
            data['attachment_3d_model'] = None
            data['attachments'] = []

        return data

    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'description', 'photo', 'attachment_type',
            'attachment_photo', 'attachment_video', 'attachment_3d_model',
            'attachments', 'course', 'order', 'is_premium', 'duration_minutes', 'video_url', 'content',
            'remove_photo', 'remove_attachment_3d_model', 'updated_at',
        ]
        read_only_fields = ['updated_at']


class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ['id', 'content_type', 'object_id', 'title', 'created_at']
        read_only_fields = ['id', 'created_at']


class RecentlyViewedSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecentlyViewed
        fields = ['id', 'content_type', 'object_id', 'title', 'viewed_at']
        read_only_fields = ['id', 'viewed_at']


class LearningProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningProgress
        fields = ['id', 'course', 'lesson_title', 'completion_percentage', 'is_completed', 'completed_at', 'updated_at']
        read_only_fields = ['id', 'completed_at', 'updated_at']


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'code', 'title', 'description', 'icon']


class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)

    class Meta:
        model = UserAchievement
        fields = ['id', 'achievement', 'earned_at']


class BrandingSerializer(LanguageAwareModelSerializer):
    localized_fields = ('name', 'logo_alt')
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Branding
        fields = ['id', 'name', 'logo', 'logo_url', 'logo_alt', 'contact_email', 'created_at', 'updated_at']
        read_only_fields = ['id', 'logo_url', 'created_at', 'updated_at']

    def get_logo_url(self, obj: Branding) -> str | None:
        if not obj.logo:
            return None

        request = self.context.get('request')
        url = obj.logo.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url
