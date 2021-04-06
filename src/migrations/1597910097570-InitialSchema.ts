import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1597910097570 implements MigrationInterface {
  name = 'InitialSchema1597910097570';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE `User` (`id` int NOT NULL AUTO_INCREMENT, `email` varchar(255) NOT NULL, `password` varchar(255) NOT NULL, `salt` varchar(255) NOT NULL, UNIQUE INDEX `IDX_78a916df40e02a9deb1c4b75ed` (`email`), PRIMARY KEY (`id`)) ENGINE=InnoDB',
    );
    await queryRunner.query(
      'CREATE TABLE `Task` (`id` int NOT NULL AUTO_INCREMENT, `title` varchar(255) NOT NULL, `description` varchar(255) NOT NULL, `status` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `Task`');
    await queryRunner.query('DROP INDEX `IDX_78a916df40e02a9deb1c4b75ed` ON `User`');
    await queryRunner.query('DROP TABLE `User`');
  }
}
