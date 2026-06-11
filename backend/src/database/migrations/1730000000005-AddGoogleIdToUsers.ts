import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleIdToUsers1730000000005 implements MigrationInterface {
  name = 'AddGoogleIdToUsers1730000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
        ALTER COLUMN password DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS google_id
    `);
    await queryRunner.query(`
      ALTER TABLE users
        ALTER COLUMN password SET NOT NULL
    `);
  }
}
