import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotesTable1730000000001 implements MigrationInterface {
  name = 'CreateNotesTable1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_notes_user_id ON notes(user_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notes_user_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS notes`);
  }
}
