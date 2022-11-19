import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql'
import { UsersService } from './users.service'
import { User } from './entities/user.entity'
import { CreateUserInput } from './dto/create-user.input'
import { UpdateUserInput } from './dto/update-user.input'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '~/auth/jwr-auth.guard'
import { OwnerGuard } from './owner.guard'

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => [User], { name: 'users' })
  findAll(
    @Args('skip', { type: () => Int }) skip: number,
    @Args('take', { type: () => Int }) take: number,
  ) {
    return this.usersService.findAll(skip, take)
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => User, { name: 'me' })
  me(@Context() context) {
    return this.usersService.findOneByUsername(context.req.user.username)
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.findOne(id)
  }

  @UseGuards(
    JwtAuthGuard,
    OwnerGuard(({ updateUserInput }) => updateUserInput.id),
  )
  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput.id, updateUserInput)
  }

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput)
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.remove(id)
  }

  @UseGuards(JwtAuthGuard, OwnerGuard((_, { userId }) => userId))
  @Mutation(() => User)
  removeMe(@Context() context) {
    return this.usersService.remove(context.req.user.userId)
  }
}
