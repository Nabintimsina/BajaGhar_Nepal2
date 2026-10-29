from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from catalog.models import Course, Favorite, LearningProgress, Lesson, Subscription
from catalog.serializers import LessonSerializer


class PersonalizationAccessTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='learner',
            email='learner@example.com',
            password='strongpass123'
        )

    def test_free_user_cannot_access_premium_course(self):
        course = Course.objects.create(title='Premium Madal Course', is_premium=True)
        subscription, _ = Subscription.objects.get_or_create(user=self.user, defaults={'plan': 'FREE'})
        self.assertFalse(subscription.can_access_course(course))

    def test_premium_user_can_access_premium_course(self):
        course = Course.objects.create(title='Premium Madal Course', is_premium=True)
        subscription = Subscription.objects.create(user=self.user, plan='PREMIUM')
        self.assertTrue(subscription.can_access_course(course))

    def test_premium_course_lesson_content_is_hidden_from_free_users(self):
        course = Course.objects.create(title='Premium Madal Course', is_premium=True)
        lesson = Lesson.objects.create(
            course=course,
            title='Premium rhythm',
            content='Private lesson notes',
            video_url='https://example.com/private-video',
        )
        request = Request(APIRequestFactory().get('/lessons/'))
        request.user = self.user
        data = LessonSerializer(lesson, context={'request': request}).data

        self.assertEqual(data['content'], '')
        self.assertEqual(data['video_url'], '')
        self.assertNotIn('photo', data)
        self.assertEqual(data['attachments'], [])

    def test_premium_lesson_content_is_hidden_from_free_users(self):
        course = Course.objects.create(title='Beginner Madal Course')
        lesson = Lesson.objects.create(
            course=course,
            title='Premium rhythm',
            is_premium=True,
            content='Private lesson notes',
            video_url='https://example.com/private-video',
        )
        request = Request(APIRequestFactory().get('/lessons/'))
        request.user = self.user
        data = LessonSerializer(lesson, context={'request': request}).data

        self.assertEqual(data['content'], '')
        self.assertEqual(data['video_url'], '')
        self.assertEqual(data['attachment_photo'], None)
        self.assertEqual(data['attachment_3d_model'], None)
        self.assertEqual(data['attachments'], [])

    def test_public_lesson_response_contains_metadata_only(self):
        course = Course.objects.create(title='Beginner Madal Course')
        lesson = Lesson.objects.create(
            course=course,
            title='Madal introduction',
            content='Internal lesson content',
            video_url='https://example.com/video',
        )
        request = Request(APIRequestFactory().get('/lessons/'))
        data = LessonSerializer(lesson, context={'request': request}).data

        self.assertEqual(data['title'], lesson.title)
        self.assertNotIn('description', data)
        self.assertNotIn('content', data)
        self.assertNotIn('video_url', data)
        self.assertNotIn('photo', data)
        self.assertNotIn('attachments', data)

    def test_favorite_and_progress_are_tracked_for_user(self):
        course = Course.objects.create(title='Beginner Madal', is_premium=False)
        Favorite.objects.create(user=self.user, content_type='course', object_id=course.pk, title=course.title)
        progress = LearningProgress.objects.create(
            user=self.user,
            course=course,
            lesson_title='History of Madal',
            completion_percentage=75
        )

        self.assertEqual(Favorite.objects.filter(user=self.user).count(), 1)
        self.assertEqual(progress.completion_percentage, 75)
