import { GqlAuthGuard } from './gql-auth.guard'
import { UseGuards } from '@nestjs/common'
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql'
import { AuthService } from './auth.service'
import { SignInInput } from './dto/sign-in.input'
import { SignInResponse } from './dto/sign-in.response'

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => SignInResponse)
  @UseGuards(GqlAuthGuard)
  async signIn(@Args('signInInput') input: SignInInput, @Context() context) {
    return await this.authService.signIn(context.user.username)
  }
}
