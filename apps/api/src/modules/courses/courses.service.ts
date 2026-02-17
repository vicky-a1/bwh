import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEntity } from './course.entity';
import { LessonEntity } from './lesson.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly coursesRepo: Repository<CourseEntity>,
    @InjectRepository(LessonEntity)
    private readonly lessonsRepo: Repository<LessonEntity>,
  ) {}

  listCourses() {
    return this.coursesRepo.find({ order: { createdAt: 'ASC' } });
  }

  async getCourseBySlug(slug: string) {
    const course = await this.coursesRepo.findOne({ where: { slug } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async listLessonsByCourseSlug(slug: string) {
    const course = await this.getCourseBySlug(slug);
    return this.lessonsRepo.find({
      where: { courseId: course.id },
      order: { orderIndex: 'ASC', createdAt: 'ASC' },
    });
  }
}
