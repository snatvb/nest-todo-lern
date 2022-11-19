import { CanActivate, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

export function OwnerGuard(
  getId: (args: any, user: { username: string; userId: number }) => number,
) {
  return class OwnerGuard implements CanActivate {
    async canActivate(context: ExecutionContext) {
      const ctx = GqlExecutionContext.create(context)
      const request = ctx.getContext().req
      if (!request.user) {
        return false
      }
      return request.user.userId === getId(ctx.getArgs(), request.user)
    }
  }
}
