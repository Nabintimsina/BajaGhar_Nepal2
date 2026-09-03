from django.db import migrations


def complete_dhime_lessons(apps, schema_editor):
    Course = apps.get_model('catalog', 'Course')
    Lesson = apps.get_model('catalog', 'Lesson')

    course = Course.objects.filter(slug='dhime-beginner').first()
    if not course:
        return

    lessons = list(Lesson.objects.filter(course=course).order_by('order', 'id'))
    if len(lessons) < 3:
        return

    lessons[0].content = '''## Meet the Dhime

The Dhime is a large, double-headed drum associated with Newar musical traditions of the Kathmandu Valley. Its deep, resonant voice helps bring people together during festivals, processions, and community celebrations.

## What to notice

- A hollow wooden body creates the drum's resonance.
- Two stretched heads produce contrasting tones.
- The player combines hand strokes and steady pulse to support the ensemble.
- The instrument is commonly carried with a strap while performing.

## Listening exercise

Listen for the low center of the sound first. Then notice how repeated strokes create a shared pulse for dancers, processions, and other musicians. Before practicing, sit or stand comfortably and focus on producing an even tone with each hand.'''
    lessons[0].save(update_fields=['content'])

    lessons[1].video_url = 'https://youtu.be/maRj2i-rLKo'
    lessons[1].content = ''
    lessons[1].save(update_fields=['video_url', 'content'])

    lessons[2].video_url = 'https://youtu.be/qjNAVgFe2S0'
    lessons[2].content = ''
    lessons[2].save(update_fields=['video_url', 'content'])


def reverse_complete_dhime_lessons(apps, schema_editor):
    Course = apps.get_model('catalog', 'Course')
    Lesson = apps.get_model('catalog', 'Lesson')
    course = Course.objects.filter(slug='dhime-beginner').first()
    if not course:
        return
    lessons = list(Lesson.objects.filter(course=course).order_by('order', 'id'))
    for lesson in lessons:
        lesson.content = ''
        lesson.video_url = ''
        lesson.save(update_fields=['content', 'video_url'])


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0024_seed_learning_courses'),
    ]

    operations = [
        migrations.RunPython(complete_dhime_lessons, reverse_complete_dhime_lessons),
    ]
