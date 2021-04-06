import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserIdToTask1597968117790 implements MigrationInterface {
  name = 'UpdateUserIdToTask1597968117790';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `Task` ADD `UserId` int NOT NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `Task` DROP COLUMN `userId`');
  }
}
