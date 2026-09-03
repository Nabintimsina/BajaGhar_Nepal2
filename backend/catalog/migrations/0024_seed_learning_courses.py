from django.db import migrations


def seed_learning_courses(apps, schema_editor):
    Course = apps.get_model('catalog', 'Course')
    Instrument = apps.get_model('catalog', 'Instrument')
    Lesson = apps.get_model('catalog', 'Lesson')

    instruments = {
        instrument.name: instrument
        for instrument in Instrument.objects.all()
    }

    courses = [
        {
            'slug': 'learn-madal-beginner',
            'title': 'Learn Madal - Beginner',
            'description': 'A guided beginner course covering the Madal, its cultural context, and first rhythms.',
            'instrument': instruments.get('Madal'),
            'lessons': [
                ('Introduction to Madal', 'Meet the instrument and understand its role in Nepali music.', False, 8),
                ('History and Cultural Context', 'Discover how Madal accompanies songs, dances, festivals, and gatherings.', False, 12),
                ('Parts of the Madal', 'Identify the shell, heads, straps, and tonal surfaces.', False, 10),
                ('How to Hold the Madal', 'Set up a comfortable and balanced playing position.', False, 8),
                ('Basic Playing Technique', 'Practice the essential hand positions and open tones.', False, 15),
                ('Basic Rhythms', 'Build your first steady patterns with guided repetition.', False, 20),
                ('Expert Demonstration', 'Study a complete beginner pattern performed by a traditional percussionist.', True, 14),
                ('Practice and Final Quiz', 'Review the course and test your understanding of Madal basics.', True, 18),
            ],
        },
        {
            'slug': 'madal-intermediate',
            'title': 'Madal - Intermediate',
            'description': 'Develop stronger control, variation, and performance fluency on the Madal.',
            'instrument': instruments.get('Madal'),
            'lessons': [
                ('Expanding Your Tone Vocabulary', 'Move beyond the basic tones with controlled combinations.', False, 18),
                ('Variations and Transitions', 'Connect patterns smoothly and keep a steady pulse.', True, 22),
                ('Performance Practice', 'Apply intermediate patterns to a complete musical phrase.', True, 25),
            ],
        },
        {
            'slug': 'dhime-beginner',
            'title': 'Dhime - Beginner',
            'description': 'Learn the foundations of Dhime playing and its place in Newar festival traditions.',
            'instrument': instruments.get('Dhime'),
            'lessons': [
                ('Meet the Dhime', 'Explore the instrument, its sound, and its community setting.', False, 10),
                ('Holding and Striking', 'Learn a stable position and the first basic strokes.', False, 15),
                ('Festival Rhythm Basics', 'Practice a simple pattern used in celebration music.', True, 20),
            ],
        },
        {
            'slug': 'nepali-rhythm-basics',
            'title': 'Nepali Rhythm Basics',
            'description': 'Build a listening and rhythm foundation before choosing a traditional instrument.',
            'instrument': None,
            'lessons': [
                ('Listening for the Pulse', 'Hear the repeating pulse inside Nepali musical forms.', False, 8),
                ('Counting and Repeating', 'Use voice and body percussion to internalize a basic cycle.', False, 12),
                ('From Pulse to Instrument', 'Connect rhythm practice to the drums and instruments in the archive.', False, 10),
            ],
        },
    ]

    for course_data in courses:
        lesson_data = course_data.pop('lessons')
        course, _ = Course.objects.get_or_create(slug=course_data['slug'], defaults=course_data)
        for order, (title, description, is_premium, duration_minutes) in enumerate(lesson_data, start=1):
            Lesson.objects.get_or_create(
                course=course,
                order=order,
                defaults={
                    'title': title,
                    'description': description,
                    'is_premium': is_premium,
                    'duration_minutes': duration_minutes,
                },
            )


def unseed_learning_courses(apps, schema_editor):
    Course = apps.get_model('catalog', 'Course')
    Course.objects.filter(
        slug__in=[
            'learn-madal-beginner',
            'madal-intermediate',
            'dhime-beginner',
            'nepali-rhythm-basics',
        ]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('catalog', '0023_achievement_course_quiz_subscription_recentlyviewed_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_learning_courses, unseed_learning_courses),
    ]
