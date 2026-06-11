import { MigrationInterface, QueryRunner } from 'typeorm';

export class IntelligenceFeatures1730000000002 implements MigrationInterface {
  name = 'IntelligenceFeatures1730000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS estimated_minutes INT DEFAULT 30,
        ADD COLUMN IF NOT EXISTS time_spent_seconds INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS is_inbox BOOLEAN DEFAULT FALSE
    `);

    await queryRunner.query(`
      ALTER TABLE tasks ALTER COLUMN project_id DROP NOT NULL
    `);

    await queryRunner.query(`
      UPDATE tasks t SET user_id = p.user_id
      FROM projects p WHERE t.project_id = p.id AND t.user_id IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        daily_briefing_time TIME DEFAULT '08:00',
        daily_briefing_enabled BOOLEAN DEFAULT TRUE,
        weekly_review_enabled BOOLEAN DEFAULT TRUE,
        weekly_review_day INT DEFAULT 0,
        weekly_review_time TIME DEFAULT '19:00',
        timezone VARCHAR(50) DEFAULT 'Europe/Paris',
        last_daily_briefing_date DATE,
        last_weekly_review_date DATE,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS task_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        tasks_json JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS task_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        target_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        UNIQUE(source_task_id, target_task_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_inbox ON tasks(user_id, is_inbox)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_at ON tasks(scheduled_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS task_links`);
    await queryRunner.query(`DROP TABLE IF EXISTS task_templates`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_settings`);
    await queryRunner.query(`
      ALTER TABLE tasks
        DROP COLUMN IF EXISTS user_id,
        DROP COLUMN IF EXISTS estimated_minutes,
        DROP COLUMN IF EXISTS time_spent_seconds,
        DROP COLUMN IF EXISTS scheduled_at,
        DROP COLUMN IF EXISTS is_inbox
    `);
  }
}
