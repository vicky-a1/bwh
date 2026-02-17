import { AppDataSource } from './data-source';
import { CourseEntity } from '../modules/courses/course.entity';
import { LessonEntity } from '../modules/courses/lesson.entity';

async function main() {
  await AppDataSource.initialize();

  const coursesRepo = AppDataSource.getRepository(CourseEntity);
  const lessonsRepo = AppDataSource.getRepository(LessonEntity);

  const slug = 'drone-basics';
  let course = await coursesRepo.findOne({ where: { slug } });
  if (!course) {
    course = await coursesRepo.save(
      coursesRepo.create({
        slug,
        title: 'Drone Basics',
        description: 'Safety, parts, controls, and first flight.',
        level: 'beginner',
      }),
    );
  }

  const lessons = [
    { title: 'Safety first', orderIndex: 1 },
    { title: 'Meet your drone', orderIndex: 2 },
    { title: 'Controls explained', orderIndex: 3 },
    { title: 'First hover', orderIndex: 4 },
  ];

  for (const l of lessons) {
    const exists = await lessonsRepo.findOne({
      where: { courseId: course.id, orderIndex: l.orderIndex },
    });
    if (exists) continue;
    await lessonsRepo.save(
      lessonsRepo.create({
        courseId: course.id,
        title: l.title,
        content: '',
        orderIndex: l.orderIndex,
      }),
    );
  }

  await AppDataSource.destroy();
}

main().catch((err) => {
  process.stderr.write(`${String(err)}\n`);
  process.exit(1);
});
