import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CertificationEntity } from '../modules/courses/certification.entity';
import { CourseEntity } from '../modules/courses/course.entity';
import { CourseEnrollmentEntity } from '../modules/courses/enrollment.entity';
import { LessonEntity } from '../modules/courses/lesson.entity';
import { LessonProgressEntity } from '../modules/courses/lesson-progress.entity';
import { DroneEntity } from '../modules/devices/drone.entity';
import { FirmwareReleaseEntity } from '../modules/devices/firmware-release.entity';
import { UserEntity } from '../modules/users/user.entity';
import { Init20260214000100 } from '../migrations/20260214000100-init';

const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl:
    process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  entities: [
    UserEntity,
    CourseEntity,
    LessonEntity,
    CourseEnrollmentEntity,
    LessonProgressEntity,
    CertificationEntity,
    DroneEntity,
    FirmwareReleaseEntity,
  ],
  migrations: [Init20260214000100],
});
