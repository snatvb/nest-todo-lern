import { User } from '~/users/entities/user.entity'
import { ObjectType, Field, Int } from '@nestjs/graphql'

@ObjectType()
export class Todo {
  @Field(() => Int)
  id: number

  @Field()
  title: string

  @Field({ nullable: true })
  description: string

  @Field({ nullable: true })
  done: boolean

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date

  @Field(() => User)
  owner: User
}
