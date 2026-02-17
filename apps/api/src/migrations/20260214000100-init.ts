import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Init20260214000100 implements MigrationInterface {
  name = 'Init20260214000100';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar NOT NULL UNIQUE,
        "password_hash" varchar NOT NULL,
        "display_name" varchar NOT NULL DEFAULT '',
        "role" varchar NOT NULL DEFAULT 'student',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "courses" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "slug" varchar NOT NULL UNIQUE,
        "title" varchar NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "level" varchar NOT NULL DEFAULT 'beginner',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lessons" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "title" varchar NOT NULL,
        "content" text NOT NULL DEFAULT '',
        "order_index" int NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_lessons_course_id" ON "lessons"("course_id")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "course_enrollments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "enrolled_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_course_enrollments_user_course" UNIQUE ("user_id", "course_id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_enrollments_user_id" ON "course_enrollments"("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_enrollments_course_id" ON "course_enrollments"("course_id")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lesson_progress" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "lesson_id" uuid NOT NULL REFERENCES "lessons"("id") ON DELETE CASCADE,
        "percent" int NOT NULL DEFAULT 0,
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_lesson_progress_user_lesson" UNIQUE ("user_id", "lesson_id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_progress_user_id" ON "lesson_progress"("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_progress_lesson_id" ON "lesson_progress"("lesson_id")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "certifications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "issued_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_certifications_user_course" UNIQUE ("user_id", "course_id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_cert_user_id" ON "certifications"("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_cert_course_id" ON "certifications"("course_id")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "drones" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "name" varchar NOT NULL,
        "device_code" varchar NOT NULL UNIQUE,
        "firmware_version" varchar NOT NULL DEFAULT '',
        "last_seen_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_drones_owner_id" ON "drones"("owner_id")',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "firmware_releases" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "version" varchar NOT NULL UNIQUE,
        "notes" text NOT NULL DEFAULT '',
        "download_url" varchar NOT NULL,
        "sha256" varchar NOT NULL DEFAULT '',
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "firmware_releases"');
    await queryRunner.query('DROP TABLE IF EXISTS "drones"');
    await queryRunner.query('DROP TABLE IF EXISTS "certifications"');
    await queryRunner.query('DROP TABLE IF EXISTS "lesson_progress"');
    await queryRunner.query('DROP TABLE IF EXISTS "course_enrollments"');
    await queryRunner.query('DROP TABLE IF EXISTS "lessons"');
    await queryRunner.query('DROP TABLE IF EXISTS "courses"');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');
  }
}
