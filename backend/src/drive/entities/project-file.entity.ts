import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('project_files')
export class ProjectFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'drive_file_id' })
  driveFileId!: string;

  @Column()
  name!: string;

  @Column({ name: 'mime_type', nullable: true })
  mimeType!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
