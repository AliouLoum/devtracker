import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '..', '..', '.env') });

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER ?? 'devtracker',
  password: process.env.DATABASE_PASSWORD ?? 'devtracker',
  database: process.env.DATABASE_NAME ?? 'devtracker',
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'database', 'migrations', '*.{ts,js}')],
  synchronize: false,
});
