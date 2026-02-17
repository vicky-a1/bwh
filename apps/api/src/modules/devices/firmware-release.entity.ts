import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'firmware_releases' })
export class FirmwareReleaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column()
  version!: string;

  @Column({ type: 'text', default: '' })
  notes!: string;

  @Column({ name: 'download_url' })
  downloadUrl!: string;

  @Column({ name: 'sha256', default: '' })
  sha256!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
