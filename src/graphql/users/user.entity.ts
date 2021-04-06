import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as bcrypt from 'bcryptjs';
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Task } from '../tasks/task.entity';

@ObjectType()
@Entity()
@Unique(['email'])
export class User extends BaseEntity {
  @Field((type) => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  salt: string;

  @OneToMany((type) => Task, (task) => task.User, { eager: false })
  Tasks: Task[];

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
