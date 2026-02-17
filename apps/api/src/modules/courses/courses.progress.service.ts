import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CertificationEntity } from './certification.entity';
import { CourseEnrollmentEntity } from './enrollment.entity';
import { LessonEntity } from './lesson.entity';
import { LessonProgressEntity } from './lesson-progress.entity';

@Injectable()
export class CoursesProgressService {
  constructor(
    @InjectRepository(CourseEnrollmentEntity)
    private readonly enrollmentsRepo: Repository<CourseEnrollmentEntity>,
    @InjectRepository(LessonProgressEntity)
    private readonly progressRepo: Repository<LessonProgressEntity>,
    @InjectRepository(LessonEntity)
    private readonly lessonsRepo: Repository<LessonEntity>,
    @InjectRepository(CertificationEntity)
    private readonly certRepo: Repository<CertificationEntity>,
  ) {}

  async enroll(userId: string, courseId: string) {
    const existing = await this.enrollmentsRepo.findOne({
      where: { userId, courseId },
    });
    if (existing) return existing;
    return this.enrollmentsRepo.save(
      this.enrollmentsRepo.create({
        userId,
        courseId,
      }),
    );
  }

  async upsertLessonProgress(
    userId: string,
    lessonId: string,
    percent: number,
  ) {
    const lesson = await this.lessonsRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const existing = await this.progressRepo.findOne({
      where: { userId, lessonId },
    });

    const entity = existing
      ? Object.assign(existing, { percent })
      : this.progressRepo.create({
          userId,
          lessonId,
          percent,
        });

    return this.progressRepo.save(entity);
  }

  async issueCertification(userId: string, courseId: string) {
    const existing = await this.certRepo.findOne({
      where: { userId, courseId },
    });
    if (existing) return existing;
    return this.certRepo.save(
      this.certRepo.create({
        userId,
        courseId,
      }),
    );
  }
}
