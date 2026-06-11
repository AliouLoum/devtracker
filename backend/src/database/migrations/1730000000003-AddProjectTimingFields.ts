import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectTimingFields1730000000003 implements MigrationInterface {
  name = 'AddProjectTimingFields1730000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS hours_per_week INT,
        ADD COLUMN IF NOT EXISTS estimated_weeks INT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE projects
        DROP COLUMN IF EXISTS hours_per_week,
        DROP COLUMN IF EXISTS estimated_weeks
    `);
  }
}
