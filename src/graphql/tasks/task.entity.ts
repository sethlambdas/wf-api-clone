import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { TaskStatus } from './enums/task-status.enum';

@ObjectType()
@Entity()
export class Task extends BaseEntity {
  @Field((type) => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  description: string;

  @Field((type) => TaskStatus)
  @Column()
  status: TaskStatus;

  @Field((type) => Int)
  @Column()
  UserId: number;

  @Field((type) => User)
  @ManyToOne((type) => User, (user) => user.Tasks, { eager: false })
  @JoinColumn({ name: 'UserId' })
  User: User;
}
