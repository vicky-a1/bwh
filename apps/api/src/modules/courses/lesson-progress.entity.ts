import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { LessonEntity } from './lesson.entity';

@Entity({ name: 'lesson_progress' })
export class LessonProgressEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Index()
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ name: 'lesson_id', type: 'uuid' })
  lessonId!: string;

  @Index()
  @ManyToOne(() => LessonEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson!: LessonEntity;

  @Column({ name: 'percent', type: 'int', default: 0 })
  percent!: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
