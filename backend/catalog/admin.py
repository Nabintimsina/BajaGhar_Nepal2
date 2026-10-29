from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from types import MethodType
from django.urls import reverse
from django.utils.html import format_html, format_html_join
from .models import Expert, Contact, TunerConfiguration, Branding, Course, Lesson, LessonAttachment, Subscription, NormalUser, StaffUser, ExpertUser

User = get_user_model()

admin.site.site_header = 'BAJAGHAR Administration'
admin.site.site_title = 'BAJAGHAR Admin'
admin.site.index_title = 'Content Management'

def delete_selected_with_cascade(modeladmin, request, queryset):
    """Custom action to delete selected items and cascade dependents"""
    queryset.delete()

delete_selected_with_cascade.short_description = 'Delete selected items and related data'


def sync_expert_profile(user, expert):
    full_name = user.get_full_name().strip()
    if full_name:
        expert.name = full_name
    expert.contact_email = user.email
    expert.save(update_fields=['name', 'contact_email'])


class UserSectionAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_active', 'last_login')
    list_filter = ('is_active', 'is_superuser', 'date_joined')
    ordering = ('username',)


class NormalUserAdmin(UserSectionAdmin):
    def get_queryset(self, request):
        return super().get_queryset(request).filter(is_staff=False, expert_profile__isnull=True)


class StaffUserAdmin(UserSectionAdmin):
    def get_queryset(self, request):
        return super().get_queryset(request).filter(is_staff=True, expert_profile__isnull=True)


class ExpertUserAdmin(UserSectionAdmin):
    def get_queryset(self, request):
        return super().get_queryset(request).filter(expert_profile__isnull=False)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        expert, _ = Expert.objects.get_or_create(
            user=obj,
            defaults={
                'name': obj.get_full_name() or obj.username,
                'expertise': 'Nepali traditional music',
                'bio': '',
            },
        )
        sync_expert_profile(obj, expert)


admin.site.unregister(User)
admin.site.register(NormalUser, NormalUserAdmin)
admin.site.register(StaffUser, StaffUserAdmin)
admin.site.register(ExpertUser, ExpertUserAdmin)

_default_get_app_list = admin.site.get_app_list


def get_app_list_with_user_sections(site, request):
    app_list = _default_get_app_list(request)
    auth_app = next((app for app in app_list if app['app_label'] == 'auth'), None)
    catalog_app = next((app for app in app_list if app['app_label'] == 'catalog'), None)
    if not auth_app or not catalog_app:
        return app_list

    user_section_names = {'Normal users', 'Staff users', 'Expert users'}
    user_sections = [
        model for model in catalog_app['models']
        if model['name'] in user_section_names
    ]
    catalog_app['models'] = [
        model for model in catalog_app['models']
        if model['name'] not in user_section_names
    ]
    auth_app['models'].extend(user_sections)
    model_order = {
        'Groups': 0,
        'Staff users': 1,
        'Expert users': 2,
        'Normal users': 3,
    }
    auth_app['models'].sort(key=lambda model: model_order.get(model['name'], 99))
    return app_list


admin.site.get_app_list = MethodType(get_app_list_with_user_sections, admin.site)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'is_active', 'updated_at')
    list_filter = ('plan', 'is_active')
    search_fields = ('user__username', 'user__email')
    fields = ('user', 'plan', 'is_active')
    ordering = ('user__username',)


@admin.register(Expert)
class ExpertAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'expertise', 'contact_email', 'created_at')
    search_fields = ('name', 'expertise', 'bio')
    list_filter = ('user',)
    actions = [delete_selected_with_cascade]
    fieldsets = (
        (None, {'fields': ('user', 'name', 'name_ne', 'expertise', 'expertise_ne', 'contact_email')}),
        ('Biography', {'fields': ('bio', 'bio_ne', 'detailed_bio', 'detailed_bio_ne')}),
        ('Achievements', {'fields': ('achievements', 'achievements_ne')}),
        ('Timestamps', {'fields': ('photo', 'created_at')}),
    )
    readonly_fields = ('created_at',)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if not obj.user_id:
            return

        user = obj.user
        if 'name' in form.changed_data:
            name_parts = obj.name.strip().split(None, 1)
            user.first_name = name_parts[0] if name_parts else ''
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''
        if 'contact_email' in form.changed_data:
            user.email = obj.contact_email
        user.save(update_fields=['first_name', 'last_name', 'email'])
        sync_expert_profile(user, obj)


@admin.register(TunerConfiguration)
class TunerConfigurationAdmin(admin.ModelAdmin):
    list_display = ('instrument', 'tuning_name', 'is_default', 'updated_at')
    list_filter = ('is_default',)
    search_fields = ('instrument', 'tuning_name')
    ordering = ('instrument', '-is_default', 'tuning_name')
    actions = [delete_selected_with_cascade]


class LessonInline(admin.StackedInline):
    model = Lesson
    extra = 0
    min_num = 0
    ordering = ('order', 'id')
    fieldsets = (
        ('Lesson details', {
            'fields': ('title', 'content', 'order', 'duration_minutes', 'is_premium'),
        }),
        ('Media', {
            'fields': (
                'attachment_type', 'attachment_photo', 'video_url',
                'attachment_3d_model', 'current_media', 'attachment_action',
            ),
            'description': 'Choose a media type. Video attachments use a YouTube link.',
        }),
        ('Record information', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    readonly_fields = (
        'attachment_action', 'current_media',
        'created_at', 'updated_at',
    )

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == 'video_url':
            kwargs['label'] = 'YouTube video link'
            kwargs['help_text'] = 'Paste a YouTube video URL.'
        return super().formfield_for_dbfield(db_field, request, **kwargs)

    @admin.display(description='Attached media')
    def current_media(self, obj):
        if not obj:
            return 'Save the lesson first to attach media.'

        media_items = []
        direct_media = (
            ('Photo', obj.attachment_photo.url if obj.attachment_photo else '', True),
            ('YouTube video', obj.video_url, False),
            ('3D model', obj.attachment_3d_model.url if obj.attachment_3d_model else '', False),
        )
        for label, url, is_image in direct_media:
            if url:
                preview = format_html(
                    '<img src="{}" style="display:block;max-width:180px;max-height:100px;margin-bottom:6px;object-fit:contain;" />',
                    url,
                ) if is_image else ''
                media_items.append(format_html(
                    '<div style="margin-bottom:12px;">{}<strong>{}</strong>: <a href="{}" target="_blank" rel="noopener">Open file</a></div>',
                    preview, label, url,
                ))

        for attachment in obj.attachments.all():
            field = attachment.photo or attachment.model_3d
            url = field.url if field else attachment.video_url
            if url:
                media_items.append(format_html(
                    '<div style="margin-bottom:12px;"><strong>{}</strong>: <a href="{}" target="_blank" rel="noopener">Open attachment</a></div>',
                    attachment.get_attachment_type_display(), url,
                ))

        return format_html_join('', '{}', ((item,) for item in media_items)) if media_items else 'No media attached.'

    @admin.display(description='Attachments')
    def attachment_action(self, obj):
        if not obj or not obj.pk:
            return 'Save the lesson first to add attachments.'

        url = reverse('admin:catalog_lesson_change', args=[obj.pk])
        return format_html('<a href="{}#lessonattachment_set-group">Add another attachment</a>', url)

    class Media:
        js = ('catalog/admin/lesson_attachments.js',)


class LessonAttachmentInline(admin.StackedInline):
    model = LessonAttachment
    extra = 1
    min_num = 0
    ordering = ('order', 'id')
    fields = ('attachment_type', 'photo', 'video_url', 'model_3d', 'order')

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == 'video_url':
            kwargs['label'] = 'YouTube video link'
            kwargs['help_text'] = 'Paste a YouTube video URL.'
        return super().formfield_for_dbfield(db_field, request, **kwargs)

    class Media:
        js = ('catalog/admin/lesson_attachments.js',)


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'is_premium', 'updated_at')
    search_fields = ('title', 'course__title')
    list_filter = ('is_premium', 'course')
    ordering = ('course', 'order', 'id')
    inlines = (LessonAttachmentInline,)
    fields = (
        'course', 'title', 'content', 'order', 'is_premium', 'duration_minutes',
        'video_url', 'created_at', 'updated_at',
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'level', 'is_premium', 'is_featured', 'is_visible',
        'lesson_count', 'updated_at',
    )
    list_filter = ('is_premium', 'is_featured', 'is_visible', 'level')
    search_fields = ('title', 'slug', 'description')
    autocomplete_fields = ('reference_expert',)
    prepopulated_fields = {'slug': ('title',)}
    ordering = ('order', 'title')
    inlines = (LessonInline,)
    actions = [delete_selected_with_cascade]
    fieldsets = (
        ('Course identity', {'fields': ('title', 'slug', 'reference_expert', 'photo', 'description')}),
        ('Learning information', {
            'fields': (
                'level', 'estimated_duration_minutes', 'what_you_will_learn',
                'target_audience', 'requirements',
            ),
        }),
        ('Access and publishing', {'fields': ('is_premium', 'is_featured', 'is_visible', 'order')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at')

    @admin.display(description='Lessons')
    def lesson_count(self, obj):
        return obj.lessons.count()


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'ip_address', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    readonly_fields = ('name', 'email', 'subject', 'message', 'ip_address', 'is_read', 'created_at')
    actions = [delete_selected_with_cascade]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return True

    def has_view_permission(self, request, obj=None):
        return True


@admin.register(Branding)
class BrandingAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_ne', 'contact_email', 'updated_at')
    search_fields = ('name', 'name_ne', 'contact_email')
    fieldsets = (
        (None, {'fields': ('name', 'name_ne', 'logo', 'logo_alt', 'logo_alt_ne', 'contact_email')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at')
    actions = [delete_selected_with_cascade]

    def has_add_permission(self, request):
        return not Branding.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False



