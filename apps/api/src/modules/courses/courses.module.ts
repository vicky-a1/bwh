import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesController } from './courses.controller';
import { CertificationEntity } from './certification.entity';
import { CourseEntity } from './course.entity';
import { CoursesProgressController } from './courses.progress.controller';
import { CoursesProgressService } from './courses.progress.service';
import { CoursesService } from './courses.service';
import { CourseEnrollmentEntity } from './enrollment.entity';
import { LessonEntity } from './lesson.entity';
import { LessonProgressEntity } from './lesson-progress.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourseEntity,
      LessonEntity,
      CourseEnrollmentEntity,
      LessonProgressEntity,
      CertificationEntity,
    ]),
  ],
  controllers: [CoursesController, CoursesProgressController],
  providers: [CoursesService, CoursesProgressService],
})
export class CoursesModule {}
