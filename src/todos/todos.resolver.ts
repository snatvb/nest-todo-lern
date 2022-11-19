import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql'
import { TodosService } from './todos.service'
import { Todo } from './entities/todo.entity'
import { CreateTodoInput } from './dto/create-todo.input'
import { UpdateTodoInput } from './dto/update-todo.input'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '~/auth/jwr-auth.guard'
import { OwnerGuard } from './owner.guard'

@Resolver(() => Todo)
export class TodosResolver {
  constructor(private readonly todosService: TodosService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Todo)
  createTodo(
    @Args('createTodoInput') input: CreateTodoInput,
    @Context() context,
  ) {
    return this.todosService.create(input, context.req.user.userId)
  }

  @Query(() => [Todo], { name: 'todos' })
  findAll(
    @Args('skip', { type: () => Int }) skip: number,
    @Args('take', { type: () => Int }) take: number,
  ) {
    return this.todosService.findAll(skip, take)
  }

  @UseGuards(JwtAuthGuard, OwnerGuard(({ id }) => id))
  @Query(() => Todo, { name: 'todo' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.todosService.findOne(id)
  }

  @UseGuards(JwtAuthGuard, OwnerGuard(({ id }) => id))
  @Mutation(() => Todo)
  updateTodo(@Args('updateTodoInput') updateTodoInput: UpdateTodoInput) {
    return this.todosService.update(updateTodoInput.id, updateTodoInput)
  }

  @UseGuards(JwtAuthGuard, OwnerGuard(({ id }) => id))
  @Mutation(() => Todo)
  removeTodo(@Args('id', { type: () => Int }) id: number) {
    return this.todosService.remove(id)
  }
}
