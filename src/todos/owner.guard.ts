import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { TodosService } from './todos.service'

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private readonly todos: TodosService) {}
  async canActivate(context: ExecutionContext) {
    // const ctx = GqlExecutionContext.create(context)
    // const request = ctx.getContext().req
    // console.log(
    //   '🚀 ~ file: owner.guard.ts ~ line 16 ~ OwnerGuard ~ canActivate ~ request',
    //   request,
    // )
    // if (!request.user) {
    //   return false
    // }

    // const userId = request.user.id
    // const { id } = request.params
    // if (!id) {
    //   throw new BadRequestException(`id is required`)
    // }
    // const todo = await this.todos.findOnePure(id)
    // return todo.ownerId === userId
    return true
  }
}
