import { Injectable } from '@nestjs/common'
import { CreateTodoInput } from './dto/create-todo.input'
import { UpdateTodoInput } from './dto/update-todo.input'
import { PrismaService } from '../../prisma/prisma.service'
import { NotFoundError } from '@prisma/client/runtime'
import { Todo, User } from '@prisma/client'

type TodoIncluded = Todo & {
  User: User
}

type TodoJoined = Todo & {
  owner: User
}

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}
  create(createTodoInput: CreateTodoInput, ownerId: number) {
    return this.prisma.todo.create({ data: { ...createTodoInput, ownerId } })
  }

  async findAllOwn(skip: number, take: number, userId: number) {
    const todos = await this.prisma.todo.findMany({
      where: {
        ownerId: userId,
      },
      skip,
      take,
      include: {
        User: true,
      },
    })
    return todos.map(transformTodo)
  }

  async findOne(id: number) {
    return transformTodo(
      await this.prisma.todo.findUnique({
        where: { id },
        include: { User: true },
      }),
    )
  }

  findOnePure(id: number) {
    return this.prisma.todo.findUnique({
      where: { id },
    })
  }

  async update(id: number, updateTodoInput: UpdateTodoInput) {
    const todo = await this.prisma.todo.findUnique({ where: { id } })
    if (!todo) {
      throw new NotFoundError(`Todo with id ${id} not found`)
    }

    return transformTodo(
      await this.prisma.todo.update({
        where: { id },
        data: { ...todo, ...updateTodoInput },
        include: { User: true },
      }),
    )
  }

  remove(id: number) {
    return this.prisma.todo.delete({ where: { id } })
  }
}

function transformTodo({ User, ...todo }: TodoIncluded): TodoJoined {
  return {
    ...todo,
    owner: User,
  }
}
