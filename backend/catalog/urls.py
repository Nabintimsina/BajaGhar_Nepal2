from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    CourseViewSet,
    DashboardView,
    FavoriteView,
    ExpertViewSet,
    LearningProgressView,
    LessonViewSet,
    ContactViewSet,
    MeView,
    PasswordChangeView,
    LogoutView,
    PremiumCheckView,
    RecentlyViewedView,
    RegisterView,
    TunerConfigurationViewSet,
    BrandingView,
    ProtectedLessonModelView,
    ProtectedLessonAttachmentModelView,
    TunerSectionView,
    block_raw_model_media,
)

router = DefaultRouter()
router.register('experts', ExpertViewSet)
router.register('contact', ContactViewSet)
router.register('courses', CourseViewSet)
router.register('lessons', LessonViewSet)
router.register('tuner-configurations', TunerConfigurationViewSet)

urlpatterns = router.urls + [
    path('protected-3d/lessons/<int:pk>/', ProtectedLessonModelView.as_view(), name='protected-lesson-model'),
    path('protected-3d/attachments/<int:pk>/', ProtectedLessonAttachmentModelView.as_view(), name='protected-lesson-attachment-model'),
    path('media/lessons/attachments/models/<path:file_path>', block_raw_model_media, name='block-raw-lesson-model-media'),
    path('branding/', BrandingView.as_view()),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/password/', PasswordChangeView.as_view(), name='password-change'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/favorites/', FavoriteView.as_view(), name='favorites'),
    path('auth/recently-viewed/', RecentlyViewedView.as_view(), name='recently-viewed'),
    path('auth/progress/', LearningProgressView.as_view(), name='learning-progress'),
    path('auth/dashboard/', DashboardView.as_view(), name='dashboard'),
    path('auth/premium/', PremiumCheckView.as_view(), name='premium-check'),
    path('tuner/', TunerSectionView.as_view()),
]
