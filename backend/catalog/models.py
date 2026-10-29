from django.db import models
from django.core.validators import FileExtensionValidator
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.text import slugify


User = get_user_model()


class NormalUser(User):
    class Meta:
        proxy = True
        verbose_name = 'Normal user'
        verbose_name_plural = 'Normal users'


class StaffUser(User):
    class Meta:
        proxy = True
        verbose_name = 'Staff user'
        verbose_name_plural = 'Staff users'


class ExpertUser(User):
    class Meta:
        proxy = True
        verbose_name = 'Expert user'
        verbose_name_plural = 'Expert users'


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_profile')
    photo = models.ImageField(upload_to='users/photos/', blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.username} profile'


class Instrument(models.Model):
    name = models.CharField(max_length=150)
    name_ne = models.CharField(max_length=150, blank=True, default='')
    region = models.CharField(max_length=120)
    region_ne = models.CharField(max_length=120, blank=True, default='')
    description = models.TextField()
    description_ne = models.TextField(blank=True, default='')
    history = models.TextField(blank=True)
    history_ne = models.TextField(blank=True, default='')
    materials = models.TextField(blank=True)
    materials_ne = models.TextField(blank=True, default='')
    playing_technique = models.TextField(blank=True)
    playing_technique_ne = models.TextField(blank=True, default='')
    cultural_significance = models.TextField(blank=True)
    cultural_significance_ne = models.TextField(blank=True, default='')
    show_brightness_control = models.BooleanField(default=False)
    primary_image = models.ImageField(upload_to='instruments/images/', blank=True, null=True)
    model_3d = models.FileField(
        upload_to='instruments/media/',
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['glb', 'gltf', 'bin'],
                message='Upload a valid 3D model file (GLB, GLTF, or BIN)'
            )
        ],
        help_text='Supports: GLB, GLTF, BIN'
    )
    is_featured = models.BooleanField(default=False)
    show_tuner = models.BooleanField(default=False, help_text='Show tuner/practice tool in the frontend instrument page')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Expert(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expert_profile',
    )
    name = models.CharField(max_length=150)
    name_ne = models.CharField(max_length=150, blank=True, default='')
    expertise = models.CharField(max_length=150)
    expertise_ne = models.CharField(max_length=150, blank=True, default='')
    bio = models.TextField()
    bio_ne = models.TextField(blank=True, default='')
    detailed_bio = models.TextField(blank=True)
    detailed_bio_ne = models.TextField(blank=True, default='')
    contact_email = models.EmailField(blank=True)
    photo = models.ImageField(upload_to='experts/photos/', blank=True, null=True)
    achievements = models.JSONField(default=list, blank=True)
    achievements_ne = models.JSONField(default=list, blank=True)
    instruments = models.ManyToManyField(Instrument, related_name='experts', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Contact(models.Model):
    name = models.CharField(max_length=150)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    ip_address = models.GenericIPAddressField(blank=True, null=True, db_index=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"{self.subject} - {self.name}"


class Tutorial(models.Model):
    instrument = models.ForeignKey(Instrument, on_delete=models.CASCADE, related_name='tutorials')
    title = models.CharField(max_length=200)
    title_ne = models.CharField(max_length=200, blank=True, default='')
    description = models.TextField()
    description_ne = models.TextField(blank=True, default='')
    video_url = models.URLField()
    instructor_name = models.CharField(max_length=150, blank=True, default='')
    instructor_name_ne = models.CharField(max_length=150, blank=True, default='')
    duration = models.CharField(max_length=50, blank=True, default='', help_text="e.g., '12:30'")
    caption_en = models.FileField(
        upload_to='tutorials/captions/',
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['vtt', 'srt'],
                message='Upload a valid caption file (VTT or SRT format)'
            )
        ],
        help_text='English captions (VTT or SRT format). Optional for YouTube videos.',
    )
    caption_ne = models.FileField(
        upload_to='tutorials/captions/',
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['vtt', 'srt'],
                message='Upload a valid caption file (VTT or SRT format)'
            )
        ],
        help_text='Nepali captions (VTT or SRT format). Optional for YouTube videos.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"{self.title} - {self.instructor_name}"


class TunerConfiguration(models.Model):
    instrument = models.CharField(max_length=150)
    tuning_name = models.CharField(max_length=100, default='Standard')
    tuning_name_ne = models.CharField(max_length=100, blank=True, default='')
    instructions = models.TextField(blank=True, default='', help_text='Optional tuning tips or setup instructions shown on the tuner page')
    instructions_ne = models.TextField(blank=True, default='', help_text='Optional Nepali tuning tips or setup instructions shown on the tuner page')
    notes = models.JSONField(default=list, help_text='List of note names, e.g. ["E2", "A2", "D3", "G3", "B3", "E4"]')
    frequencies = models.JSONField(default=list, help_text="List of frequencies in Hz, e.g. [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]")
    is_default = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', 'tuning_name']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        if self.is_default:
            TunerConfiguration.objects.filter(
                instrument=self.instrument,
                is_default=True,
            ).exclude(pk=self.pk).update(is_default=False)
            return

        has_other_default = TunerConfiguration.objects.filter(
            instrument=self.instrument,
            is_default=True,
        ).exclude(pk=self.pk).exists()

        if not has_other_default:
            TunerConfiguration.objects.filter(pk=self.pk).update(is_default=True)
            self.is_default = True

    def __str__(self) -> str:
        return f"{self.instrument} - {self.tuning_name}"


class Branding(models.Model):
    name = models.CharField(max_length=120, default=getattr(settings, 'BRANDING_NAME', 'BAJAGHAR'))
    name_ne = models.CharField(max_length=120, blank=True, default='')
    logo = models.FileField(
        upload_to='branding/',
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
                message='Upload a valid image file (JPG, PNG, GIF, WEBP, or SVG)'
            )
        ],
        help_text='Supports: JPG, PNG, GIF, WEBP, SVG'
    )
    logo_alt = models.CharField(max_length=160, blank=True, default=getattr(settings, 'BRANDING_LOGO_ALT', 'BAJAGHAR logo'))
    logo_alt_ne = models.CharField(max_length=160, blank=True, default='')
    contact_email = models.EmailField(
        blank=True,
        default=getattr(settings, 'BRANDING_CONTACT_EMAIL', 'info@bajanepal.com'),
        help_text='Single public email shown in the footer and contact area',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Branding'
        verbose_name_plural = 'Branding'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class Subscription(models.Model):
    PLAN_FREE = 'FREE'
    PLAN_PREMIUM = 'PREMIUM'
    PLAN_CHOICES = [(PLAN_FREE, 'Free'), (PLAN_PREMIUM, 'Premium')]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscription')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default=PLAN_FREE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_premium(self):
        return self.is_active and self.plan == self.PLAN_PREMIUM

    def can_access_course(self, course):
        if course is None:
            return False
        if not getattr(course, 'is_premium', False):
            return True
        return self.is_premium()

    def can_access_lesson(self, lesson):
        if lesson is None:
            return False
        if not getattr(lesson, 'is_premium', False):
            return True
        return self.is_premium()

    def __str__(self):
        return f'{self.user.username} - {self.plan}'


class Course(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField(blank=True)
    photo = models.ImageField(upload_to='courses/photos/', blank=True, null=True)
    level = models.CharField(max_length=80, default='Beginner')
    estimated_duration_minutes = models.PositiveIntegerField(default=0)
    what_you_will_learn = models.TextField(blank=True, default='')
    target_audience = models.TextField(blank=True, default='')
    requirements = models.TextField(blank=True, default='')
    reference_expert = models.ForeignKey('Expert', on_delete=models.SET_NULL, null=True, blank=True, related_name='courses', help_text='The main expert/instructor for this course')
    is_premium = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'title']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title) or 'course'
            candidate = base_slug
            suffix = 2
            while Course.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f'{base_slug}-{suffix}'
                suffix += 1
            self.slug = candidate
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Lesson(models.Model):
    ATTACHMENT_TYPES = [
        ('none', 'No attachment'),
        ('photo', 'Photo'),
        ('video', 'Video'),
        ('3d_model', '3D model'),
    ]

    title = models.CharField(max_length=220)
    attachment_type = models.CharField(max_length=20, choices=ATTACHMENT_TYPES, default='none')
    attachment_photo = models.ImageField(upload_to='lessons/attachments/photos/', blank=True, null=True)
    attachment_video = models.FileField(upload_to='lessons/attachments/videos/', blank=True, null=True)
    attachment_3d_model = models.FileField(
        upload_to='lessons/attachments/models/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['glb', 'gltf', 'bin'])],
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    order = models.PositiveIntegerField(default=0)
    is_premium = models.BooleanField(default=False)
    duration_minutes = models.PositiveIntegerField(default=0)
    video_url = models.URLField(blank=True, default='')
    content = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['course', 'order', 'title']

    def __str__(self):
        return f'{self.course.title} - {self.title}'


class LessonAttachment(models.Model):
    ATTACHMENT_TYPES = [
        ('photo', 'Photo'),
        ('video', 'Video'),
        ('3d_model', '3D model'),
    ]

    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='attachments')
    attachment_type = models.CharField(max_length=20, choices=ATTACHMENT_TYPES)
    photo = models.ImageField(upload_to='lessons/attachments/photos/', blank=True, null=True)
    video_url = models.URLField(blank=True, default='')
    model_3d = models.FileField(
        upload_to='lessons/attachments/models/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['glb', 'gltf', 'bin'])],
    )
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f'{self.lesson} - {self.get_attachment_type_display()}'


class ContentAccess(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='content_access')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True, related_name='access_records')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, null=True, blank=True, related_name='access_records')
    granted = models.BooleanField(default=True)
    access_type = models.CharField(max_length=30, choices=[('FREE', 'Free'), ('PREMIUM', 'Premium')], default='FREE')
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('user', 'course', 'lesson', 'access_type')]

    def __str__(self):
        target = self.course or self.lesson
        return f'{self.user.username} -> {target}'


class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    content_type = models.CharField(max_length=40, choices=[('instrument', 'Instrument'), ('course', 'Course'), ('lesson', 'Lesson'), ('video', 'Video')], default='instrument')
    object_id = models.PositiveIntegerField()
    title = models.CharField(max_length=220, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('user', 'content_type', 'object_id')]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} - {self.content_type} - {self.object_id}'


class RecentlyViewed(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recently_viewed')
    content_type = models.CharField(max_length=40, default='instrument')
    object_id = models.PositiveIntegerField()
    title = models.CharField(max_length=220)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-viewed_at']

    def __str__(self):
        return f'{self.user.username} - {self.title}'


class LearningProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='learning_progress')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='progress_records', null=True, blank=True)
    lesson_title = models.CharField(max_length=220)
    completion_percentage = models.PositiveSmallIntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.user.username} - {self.lesson_title}'


class Quiz(models.Model):
    title = models.CharField(max_length=220)
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='quizzes')
    question = models.TextField()
    choices = models.JSONField(default=list)
    correct_answer = models.CharField(max_length=200)
    explanation = models.TextField(blank=True, default='')
    is_premium = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title


class QuizAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    user_answer = models.CharField(max_length=200)
    score = models.PositiveSmallIntegerField(default=0)
    total_questions = models.PositiveSmallIntegerField(default=1)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']

    def __str__(self):
        return f'{self.user.username} - {self.quiz.title}'


class Achievement(models.Model):
    code = models.CharField(max_length=80, unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=40, default='🏆')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class UserAchievement(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='users')
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('user', 'achievement')]

    def __str__(self):
        return f'{self.user.username} - {self.achievement.title}'

