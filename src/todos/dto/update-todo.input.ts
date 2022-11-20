import { CreateTodoInput } from './create-todo.input'
import { InputType, Field, Int, PartialType } from '@nestjs/graphql'

@InputType()
export class UpdateTodoInput extends PartialType(CreateTodoInput) {
  @Field(() => Int)
  id: number

  @Field(() => String, { nullable: true })
  title: string

  @Field(() => String, { nullable: true })
  description: string

  @Field(() => Boolean, { nullable: true })
  done: boolean
}
