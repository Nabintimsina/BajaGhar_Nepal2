from datetime import timedelta
import mimetypes
import os

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from django.http import FileResponse, Http404, HttpResponse
from rest_framework import permissions, status, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from .models import (
    Achievement,
    ContentAccess,
    Course,
    Favorite,
    Instrument,
    Expert,
    LearningProgress,
    Lesson,
    LessonAttachment,
    Contact,
    RecentlyViewed,
    Subscription,
    TunerConfiguration,
    Branding,
    UserAchievement,
)
from .serializers import (
    AchievementSerializer,
    CourseSerializer,
    FavoriteSerializer,
    ExpertPreviewSerializer,
    ExpertListSerializer,
    ExpertDetailSerializer,
    ContactSerializer,
    LessonSerializer,
    LearningProgressSerializer,
    RecentlyViewedSerializer,
    SubscriptionSerializer,
    TunerConfigurationSerializer,
    BrandingSerializer,
    UserAchievementSerializer,
    UserSerializer,
    get_localized_value,
    get_requested_language,
)
from .permissions import IsAdminOrReadOnly, IsCourseExpertOrStaff, IsExpertOrStaff, IsExpertProfileOwnerOrStaff


def _serve_model_file(request, file_field, allowed):
    if not file_field or not file_field.name:
        raise Http404
    if not os.path.isfile(file_field.path):
        raise Http404
    content_type = mimetypes.guess_type(file_field.name)[0] or 'application/octet-stream'
    response = FileResponse(open(file_field.path, 'rb'), content_type=content_type)
    response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_field.name)}"'
    return response


class ProtectedLessonModelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        lesson = Lesson.objects.select_related('course').get(pk=pk)
        subscription = getattr(request.user, 'subscription', None)
        if (lesson.is_premium or lesson.course.is_premium) and not subscription_is_premium(subscription):
            return HttpResponse(status=403)
        return _serve_model_file(request, lesson.attachment_3d_model, True)


class ProtectedLessonAttachmentModelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        attachment = LessonAttachment.objects.select_related('lesson__course').get(pk=pk)
        subscription = getattr(request.user, 'subscription', None)
        lesson = attachment.lesson
        if (lesson.is_premium or lesson.course.is_premium) and not subscription_is_premium(subscription):
            return HttpResponse(status=403)
        return _serve_model_file(request, attachment.model_3d, True)


def subscription_is_premium(subscription):
    return bool(subscription and subscription.is_premium())


def block_raw_model_media(request, file_path):
    return HttpResponse(status=403)


class ExpertViewSet(viewsets.ModelViewSet):
    queryset = Expert.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name', 'expertise']

    def get_serializer_class(self):
        if self.action in ('retrieve', 'update', 'partial_update'):
            return ExpertDetailSerializer
        return ExpertListSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [AllowAny()]
        return [IsExpertProfileOwnerOrStaff()]


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    ordering_fields = ['created_at']
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAdminUser()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.is_read:
            instance.is_read = True
            instance.save(update_fields=['is_read'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR') or 'unknown'

    def _is_rate_limited(self, request):
        rate_limit = getattr(settings, 'CONTACT_FORM_RATE_LIMIT', 3)
        time_window = getattr(settings, 'CONTACT_FORM_TIME_WINDOW', 86400)
        client_ip = self._get_client_ip(request)
        window_start = timezone.now() - timedelta(seconds=time_window)
        recent_count = Contact.objects.filter(
            ip_address=client_ip,
            created_at__gte=window_start,
        ).count()

        if recent_count >= rate_limit:
            first_submission = (
                Contact.objects.filter(
                    ip_address=client_ip,
                    created_at__gte=window_start,
                )
                .order_by('created_at')
                .values_list('created_at', flat=True)
                .first()
            )
            if first_submission is None:
                return True, None

            reset_at = first_submission + timedelta(seconds=time_window)
            wait_seconds = max(1, int((reset_at - timezone.now()).total_seconds()))
            return False, wait_seconds

        return True, None

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        allowed, wait_seconds = self._is_rate_limited(request)
        if not allowed:
            return Response(
                {
                    'detail': (
                        'Contact form limit reached. Please try again in '
                        f'{wait_seconds} seconds.'
                    )
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        serializer.save(ip_address=self._get_client_ip(request))
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save()


class TunerConfigurationViewSet(viewsets.ModelViewSet):
    queryset = TunerConfiguration.objects.all()
    serializer_class = TunerConfigurationSerializer
    permission_classes = [IsAdminOrReadOnly]
    ordering_fields = ['tuning_name', 'is_default']

    def get_queryset(self):
        queryset = super().get_queryset()
        instrument_name = self.request.query_params.get('instrument')
        if instrument_name:
            queryset = queryset.filter(instrument=instrument_name)
        return queryset

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        config = self.get_object()
        TunerConfiguration.objects.filter(instrument=config.instrument).update(is_default=False)
        config.is_default = True
        config.save(update_fields=['is_default'])
        serializer = self.get_serializer(config)
        return Response(serializer.data)


class BrandingView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        branding, _ = Branding.objects.get_or_create(
            pk=1,
            defaults={
                'name': getattr(settings, 'BRANDING_NAME', 'BAJAGHAR'),
                'contact_email': getattr(settings, 'BRANDING_CONTACT_EMAIL', 'info@bajanepal.com'),
            },
        )
        serializer = BrandingSerializer(branding, context={'request': request})
        return Response(serializer.data)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        username = (request.data.get('username') or '').strip()
        email = (request.data.get('email') or '').strip()
        password = request.data.get('password') or ''
        first_name = (request.data.get('first_name') or '').strip()
        last_name = (request.data.get('last_name') or '').strip()

        if not username or not email or not password:
            return Response({'detail': 'Username, email, and password are required.'}, status=400)

        user_model = get_user_model()
        if user_model.objects.filter(username__iexact=username).exists():
            return Response({'detail': 'Username already exists.'}, status=400)
        if user_model.objects.filter(email__iexact=email).exists():
            return Response({'detail': 'Email already exists.'}, status=400)

        user = user_model.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        Subscription.objects.get_or_create(user=user, defaults={'plan': 'FREE'})

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=201)


class MeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        user = request.user
        subscription, _ = Subscription.objects.get_or_create(user=user, defaults={'plan': 'FREE'})
        expert = getattr(user, 'expert_profile', None)
        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'subscription': SubscriptionSerializer(subscription).data,
            'expert': ExpertDetailSerializer(expert, context={'request': request}).data if expert else None,
            'is_expert': expert is not None,
            'is_authenticated': True,
        })

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'user': UserSerializer(request.user, context={'request': request}).data})


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password') or ''
        new_password = request.data.get('new_password') or ''
        if not request.user.check_password(current_password):
            return Response({'detail': 'Your current password is incorrect.'}, status=400)
        if len(new_password) < 8:
            return Response({'detail': 'Your new password must be at least 8 characters.'}, status=400)
        if current_password == new_password:
            return Response({'detail': 'Your new password must be different from your current password.'}, status=400)
        request.user.set_password(new_password)
        request.user.save(update_fields=['password'])
        return Response({'detail': 'Password changed successfully.'})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response({'detail': 'Logged out successfully.'})


class FavoriteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favorites = Favorite.objects.filter(user=request.user)
        return Response(FavoriteSerializer(favorites, many=True).data)

    def post(self, request):
        payload = request.data
        title = payload.get('title') or payload.get('name') or ''
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            content_type=(payload.get('content_type') or 'instrument').lower(),
            object_id=payload.get('object_id'),
            defaults={'title': title},
        )
        if not created:
            favorite.title = title or favorite.title
            favorite.save(update_fields=['title'])
        return Response(FavoriteSerializer(favorite).data, status=201 if created else 200)

    def delete(self, request):
        content_type = (request.query_params.get('content_type') or 'instrument').lower()
        object_id = request.query_params.get('object_id')
        deleted, _ = Favorite.objects.filter(user=request.user, content_type=content_type, object_id=object_id).delete()
        return Response({'deleted': deleted > 0})


class RecentlyViewedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        recent = RecentlyViewed.objects.filter(user=request.user)[:10]
        return Response(RecentlyViewedSerializer(recent, many=True).data)

    def post(self, request):
        payload = request.data
        RecentlyViewed.objects.filter(
            user=request.user,
            content_type=(payload.get('content_type') or 'instrument'),
            object_id=payload.get('object_id'),
        ).delete()
        item = RecentlyViewed.objects.create(
            user=request.user,
            content_type=(payload.get('content_type') or 'instrument'),
            object_id=payload.get('object_id'),
            title=(payload.get('title') or 'Recently viewed item'),
        )
        return Response(RecentlyViewedSerializer(item).data, status=201)


class LearningProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        progress = LearningProgress.objects.filter(user=request.user)
        return Response(LearningProgressSerializer(progress, many=True).data)

    def post(self, request):
        course_id = request.data.get('course')
        progress, created = LearningProgress.objects.update_or_create(
            user=request.user,
            course_id=course_id,
            lesson_title=request.data.get('lesson_title', 'Lesson'),
            defaults={
                'course_id': course_id,
                'completion_percentage': int(request.data.get('completion_percentage', 0) or 0),
                'is_completed': bool(request.data.get('is_completed', False)),
                'completed_at': timezone.now() if request.data.get('is_completed') else None,
            },
        )
        return Response(LearningProgressSerializer(progress).data, status=201 if created else 200)


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.prefetch_related('lessons').all()
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if self.request.query_params.get('mine') == '1':
            if user.is_authenticated and user.is_staff:
                return self.queryset
            if user.is_authenticated and hasattr(user, 'expert_profile'):
                return self.queryset.filter(reference_expert__user=user)
            return self.queryset.none()
        if user.is_authenticated and user.is_staff:
            return self.queryset
        if user.is_authenticated and hasattr(user, 'expert_profile'):
            return self.queryset.filter(Q(is_visible=True) | Q(reference_expert__user=user)).distinct()
        return self.queryset.filter(is_visible=True)

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [AllowAny()]
        return [IsExpertOrStaff()]

    def perform_create(self, serializer):
        if self.request.user.is_staff:
            serializer.save()
        else:
            serializer.save(reference_expert=self.request.user.expert_profile)

    def perform_update(self, serializer):
        serializer.save()


class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.select_related('course').prefetch_related('attachments').all()
    serializer_class = LessonSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            queryset = self.queryset
        elif user.is_authenticated and hasattr(user, 'expert_profile'):
            queryset = self.queryset.filter(Q(course__is_visible=True) | Q(course__reference_expert__user=user)).distinct()
        else:
            queryset = self.queryset.filter(course__is_visible=True)
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [AllowAny()]
        return [IsCourseExpertOrStaff()]

    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        if not self.request.user.is_staff and course.reference_expert.user_id != self.request.user.id:
            raise PermissionDenied('You can only add lessons to your own courses.')
        serializer.save()


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        subscription, _ = Subscription.objects.get_or_create(user=user, defaults={'plan': 'FREE'})
        favorites = Favorite.objects.filter(user=user)[:6]
        recent = RecentlyViewed.objects.filter(user=user)[:6]
        progress = LearningProgress.objects.filter(user=user)
        achievements = UserAchievement.objects.filter(user=user).select_related('achievement')

        recent_items = []
        for item in recent:
            recent_data = RecentlyViewedSerializer(item).data
            if item.content_type == 'course':
                recent_data['course_id'] = item.object_id
            elif item.content_type == 'lesson':
                recent_data['course_id'] = Lesson.objects.filter(
                    id=item.object_id,
                ).values_list('course_id', flat=True).first()
            if recent_data.get('course_id'):
                recent_items.append(recent_data)

        favorite_course_ids = [item.object_id for item in favorites if item.content_type == 'course']
        favorite_courses = Course.objects.filter(
            id__in=favorite_course_ids,
            is_visible=True,
        )
        if favorite_course_ids:
            recommended_courses = Course.objects.filter(is_visible=True).exclude(id__in=favorite_course_ids)[:3]
        else:
            recommended_courses = Course.objects.filter(is_visible=True)[:3]

        course_progress = []
        progress_by_course = {}
        for item in progress:
            if item.course_id:
                progress_by_course.setdefault(item.course_id, []).append(item)

        started_courses = Course.objects.filter(
            id__in=progress_by_course.keys(),
        ).annotate(total_lessons=Count('lessons', distinct=True))
        for course in started_courses:
            records = progress_by_course.get(course.id, [])
            completed_lessons = len({item.lesson_title for item in records if item.is_completed})
            total_lessons = course.total_lessons
            percentage = round((completed_lessons / total_lessons) * 100) if total_lessons else 0
            course_progress.append({
                'course': course.id,
                'title': course.title,
                'description': course.description,
                'level': course.level,
                'total_lessons': total_lessons,
                'completed_lessons': completed_lessons,
                'percentage': percentage,
                'is_completed': bool(total_lessons and completed_lessons >= total_lessons),
            })

        course_progress.sort(key=lambda item: (-item['percentage'], item['title']))

        return Response({
            'user': UserSerializer(user).data,
            'subscription': SubscriptionSerializer(subscription).data,
            'favorites': FavoriteSerializer(favorites, many=True).data,
            'favorite_courses': CourseSerializer(favorite_courses, many=True).data,
            'recently_viewed': recent_items,
            'progress': LearningProgressSerializer(progress, many=True).data,
            'course_progress': course_progress,
            'achievements': UserAchievementSerializer(achievements, many=True).data,
            'recommended_courses': CourseSerializer(recommended_courses, many=True).data,
        })


class PremiumCheckView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subscription, _ = Subscription.objects.get_or_create(user=request.user, defaults={'plan': 'FREE'})
        return Response({
            'is_premium': subscription.is_premium(),
            'plan': subscription.plan,
            'message': 'Premium member access available.' if subscription.is_premium() else 'This lesson is available to BajaGhar Premium members.'
        })


class TunerSectionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        language = get_requested_language(request)
        configurations = TunerConfiguration.objects.all().order_by('instrument', '-is_default', 'tuning_name')
        grouped_configurations = {}
        for config in configurations:
            grouped_configurations.setdefault(config.instrument, []).append(config)

        payload = []
        for instrument_name, configs in grouped_configurations.items():
            active = next((config for config in configs if config.is_default), configs[0])
            payload.append({
                'id': instrument_name,
                'name': instrument_name,
                'tuner_config': TunerConfigurationSerializer(active, context={'request': request}).data,
                'tuner_configs': TunerConfigurationSerializer(configs, many=True, context={'request': request}).data,
            })

        return Response(payload)
