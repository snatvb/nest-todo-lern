import { Injectable } from '@nestjs/common'
import { CreateTodoInput } from './dto/create-todo.input'
import { UpdateTodoInput } from './dto/update-todo.input'
import { PrismaService } from '../../prisma/prisma.service'
import { NotFoundError } from '@prisma/client/runtime'

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}
  create(createTodoInput: CreateTodoInput, ownerId: number) {
    return this.prisma.todo.create({ data: { ...createTodoInput, ownerId } })
  }

  async findAll(skip: number, take: number) {
    const todos = await this.prisma.todo.findMany({
      skip,
      take,
      include: {
        User: true,
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return todos.map(({ User: { password, ...user }, ...todo }) => ({
      ...todo,
      owner: user,
    }))
  }

  async findOne(id: number) {
    const { User, ...todo } = await this.prisma.todo.findUnique({
      where: { id },
      include: { User: true },
    })

    return {
      ...todo,
      owner: User,
    }
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

    return this.prisma.todo.update({ where: { id }, data: updateTodoInput })
  }

  remove(id: number) {
    return this.prisma.todo.delete({ where: { id } })
  }
}
