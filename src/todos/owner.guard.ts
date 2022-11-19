import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { TodosService } from './todos.service'

export function OwnerGuard(getId: (args: any) => number) {
  @Injectable()
  class Guard implements CanActivate {
    constructor(readonly todos: TodosService) {}
    async canActivate(context: ExecutionContext) {
      const ctx = GqlExecutionContext.create(context)
      const request = ctx.getContext().req
      if (!request.user) {
        return false
      }
      const todoId = getId(ctx.getArgs())
      const todo = await this.todos.findOnePure(todoId)
      return todo.ownerId === request.user.userId
    }
  }

  return Guard
}
