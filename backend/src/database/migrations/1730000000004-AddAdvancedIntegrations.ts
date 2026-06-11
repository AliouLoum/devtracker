import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdvancedIntegrations1730000000004 implements MigrationInterface {
  name = 'AddAdvancedIntegrations1730000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns to projects
    await queryRunner.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS github_repo_owner VARCHAR(255),
        ADD COLUMN IF NOT EXISTS github_repo_name VARCHAR(255)
    `);

    // Add columns to tasks
    await queryRunner.query(`
      ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS issue_number INT,
        ADD COLUMN IF NOT EXISTS github_commit_url VARCHAR(255)
    `);

    // Add columns to user_settings
    await queryRunner.query(`
      ALTER TABLE user_settings
        ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"desktop":{"enabled":true,"reminders":true,"dailyBriefing":true,"milestones":true,"overdueAlerts":true},"email":{"enabled":true,"dailyBriefingTime":"08:00","weeklyReviewDay":0,"weeklyReviewTime":"19:00","reminders":true,"milestones":true},"ai":{"model":"meta/llama-3.1-70b-instruct","modelCode":"nvidia/llama-3.1-nemotron-70b-instruct","temperature":0.7,"streaming":true}}'::jsonb,
        ADD COLUMN IF NOT EXISTS google_tokens JSONB,
        ADD COLUMN IF NOT EXISTS github_token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS github_username VARCHAR(255)
    `);

    // Create project_files table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS project_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        drive_file_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS project_files`);
    await queryRunner.query(`
      ALTER TABLE user_settings
        DROP COLUMN IF EXISTS preferences,
        DROP COLUMN IF EXISTS google_tokens,
        DROP COLUMN IF EXISTS github_token,
        DROP COLUMN IF EXISTS github_username
    `);
    await queryRunner.query(`
      ALTER TABLE tasks
        DROP COLUMN IF EXISTS issue_number,
        DROP COLUMN IF EXISTS github_commit_url
    `);
    await queryRunner.query(`
      ALTER TABLE projects
        DROP COLUMN IF EXISTS github_repo_owner,
        DROP COLUMN IF EXISTS github_repo_name
    `);
  }
}
