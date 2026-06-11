import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1781141978373 implements MigrationInterface {
    name = 'Init1781141978373'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "project_id" uuid, "assignee_id" uuid, "is_inbox" boolean NOT NULL DEFAULT false, "scheduled_at" TIMESTAMP, "title" character varying(255) NOT NULL, "notes" text, "due_date" date, "priority" character varying(10) NOT NULL DEFAULT 'medium', "status" character varying(10) NOT NULL DEFAULT 'todo', "reminder_at" TIMESTAMP, "reminder_sent" boolean NOT NULL DEFAULT false, "estimated_minutes" integer NOT NULL DEFAULT '30', "time_spent_seconds" integer NOT NULL DEFAULT '0', "issue_number" integer, "github_commit_url" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "parent_task_id" uuid, "recurrence" jsonb, "recurrence_parent_id" uuid, "recurrence_date" date, "depends_on_ids" jsonb DEFAULT '[]', CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "color" character varying(7) NOT NULL DEFAULT '#185FA5', "start_date" date, "end_date" date, "hours_per_week" integer, "estimated_weeks" integer, "github_repo_owner" character varying(255), "github_repo_name" character varying(255), "status" character varying(20) NOT NULL DEFAULT 'not_started', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token_hash" character varying(255) NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password" character varying(255), "name" character varying(100) NOT NULL, "google_id" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE ("google_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "task_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "task_id" uuid NOT NULL, "old_status" character varying(10), "new_status" character varying(10) NOT NULL, "changed_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_716670443aea4a2f4a599bb7c53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "time_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "task_id" uuid NOT NULL, "start_time" TIMESTAMP NOT NULL, "end_time" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b8bc5f10269ba2fe88708904aa0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "project_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" character varying(20) NOT NULL DEFAULT 'member', "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0b2f46f804be4aea9234c78bcc9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "task_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "task_id" uuid NOT NULL, "user_id" uuid NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_83b99b0b03db29d4cafcb579b77" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_settings" ("user_id" uuid NOT NULL, "daily_briefing_time" TIME NOT NULL DEFAULT '08:00:00', "daily_briefing_enabled" boolean NOT NULL DEFAULT true, "weekly_review_enabled" boolean NOT NULL DEFAULT true, "weekly_review_day" integer NOT NULL DEFAULT '0', "weekly_review_time" TIME NOT NULL DEFAULT '19:00:00', "timezone" character varying NOT NULL DEFAULT 'Europe/Paris', "last_daily_briefing_date" date, "last_weekly_review_date" date, "preferences" jsonb, "google_tokens" jsonb, "github_token" character varying(255), "github_username" character varying(255), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4ed056b9344e6f7d8d46ec4b302" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TABLE "notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "title" character varying(255) NOT NULL, "content" text NOT NULL DEFAULT '', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_af6206538ea96c4e77e9f400c3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "task_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "tasks_json" jsonb NOT NULL DEFAULT '[]', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a1347b5446b9e3158e2b72f58b2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "task_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_task_id" uuid NOT NULL, "target_task_id" uuid NOT NULL, CONSTRAINT "UQ_4307522673f624b9a71ac24cc41" UNIQUE ("source_task_id", "target_task_id"), CONSTRAINT "PK_c855bf1378b7865b93ff161550b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "project_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "drive_file_id" character varying NOT NULL, "name" character varying NOT NULL, "mime_type" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba9b1f07ba163e0e21f72f4e02b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_db55af84c226af9dce09487b61b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_855d484825b715c545349212c7f" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_54fc42a253a8338488ec1f960ad" FOREIGN KEY ("parent_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_8aacfa08824e0675446f6f1a53f" FOREIGN KEY ("recurrence_parent_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_bd55b203eb9f92b0c8390380010" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_history" ADD CONSTRAINT "FK_e733285140c013322a9ae1be644" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_entries" ADD CONSTRAINT "FK_f16c3c269283ee42429d09d693d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_entries" ADD CONSTRAINT "FK_104aa11ede7c8d5afbbe1fdbb24" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_members" ADD CONSTRAINT "FK_b5729113570c20c7e214cf3f58d" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_members" ADD CONSTRAINT "FK_e89aae80e010c2faa72e6a49ce8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_comments" ADD CONSTRAINT "FK_ba9e465cfc707006e60aae59946" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_comments" ADD CONSTRAINT "FK_07ff0d4347a198527663bda63d9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_settings" ADD CONSTRAINT "FK_4ed056b9344e6f7d8d46ec4b302" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notes" ADD CONSTRAINT "FK_7708dcb62ff332f0eaf9f0743a7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_templates" ADD CONSTRAINT "FK_8458278105f61621f0f90528fbe" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_links" ADD CONSTRAINT "FK_0bf64debbc059dcf4601f9071dd" FOREIGN KEY ("source_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_links" ADD CONSTRAINT "FK_3b5f444d217f9afc0c21d5df9f9" FOREIGN KEY ("target_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task_links" DROP CONSTRAINT "FK_3b5f444d217f9afc0c21d5df9f9"`);
        await queryRunner.query(`ALTER TABLE "task_links" DROP CONSTRAINT "FK_0bf64debbc059dcf4601f9071dd"`);
        await queryRunner.query(`ALTER TABLE "task_templates" DROP CONSTRAINT "FK_8458278105f61621f0f90528fbe"`);
        await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT "FK_7708dcb62ff332f0eaf9f0743a7"`);
        await queryRunner.query(`ALTER TABLE "user_settings" DROP CONSTRAINT "FK_4ed056b9344e6f7d8d46ec4b302"`);
        await queryRunner.query(`ALTER TABLE "task_comments" DROP CONSTRAINT "FK_07ff0d4347a198527663bda63d9"`);
        await queryRunner.query(`ALTER TABLE "task_comments" DROP CONSTRAINT "FK_ba9e465cfc707006e60aae59946"`);
        await queryRunner.query(`ALTER TABLE "project_members" DROP CONSTRAINT "FK_e89aae80e010c2faa72e6a49ce8"`);
        await queryRunner.query(`ALTER TABLE "project_members" DROP CONSTRAINT "FK_b5729113570c20c7e214cf3f58d"`);
        await queryRunner.query(`ALTER TABLE "time_entries" DROP CONSTRAINT "FK_104aa11ede7c8d5afbbe1fdbb24"`);
        await queryRunner.query(`ALTER TABLE "time_entries" DROP CONSTRAINT "FK_f16c3c269283ee42429d09d693d"`);
        await queryRunner.query(`ALTER TABLE "task_history" DROP CONSTRAINT "FK_e733285140c013322a9ae1be644"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_bd55b203eb9f92b0c8390380010"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_8aacfa08824e0675446f6f1a53f"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_54fc42a253a8338488ec1f960ad"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_855d484825b715c545349212c7f"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_db55af84c226af9dce09487b61b"`);
        await queryRunner.query(`DROP TABLE "project_files"`);
        await queryRunner.query(`DROP TABLE "task_links"`);
        await queryRunner.query(`DROP TABLE "task_templates"`);
        await queryRunner.query(`DROP TABLE "notes"`);
        await queryRunner.query(`DROP TABLE "user_settings"`);
        await queryRunner.query(`DROP TABLE "task_comments"`);
        await queryRunner.query(`DROP TABLE "project_members"`);
        await queryRunner.query(`DROP TABLE "time_entries"`);
        await queryRunner.query(`DROP TABLE "task_history"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
    }

}
