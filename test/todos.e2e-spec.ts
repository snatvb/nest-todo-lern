import { INestApplication } from '@nestjs/common'
import request, { SuperTestExecutionResult } from 'supertest-graphql'
import gql from 'graphql-tag'
import { User } from '~/users/entities/user.entity'
import {
  createApp,
  createUser,
  expectForbidden,
  loginUser,
  removeMe,
} from './helpers'

const user1 = {
  username: 'todo_tester',
  password: 'todo_tester_pass',
  email: 'todo_tester_mail@todos.com',
}

const user2 = {
  username: 'todo_tester2',
  password: 'todo_tester_pass2',
  email: 'todo_tester_mail2@todos.com',
}

type Todo = {
  id: number
  title: string
  done: boolean
  description?: string | null
  owner: {
    id: number
  }
}

const todoElement = `
id
title
done
description
owner {
  id
}
`

const updateQuery = gql`
  mutation updateTodo($input: UpdateTodoInput!) {
    updateTodo(updateTodoInput: $input) {
      ${todoElement}
    }
  }
`

const getQuery = gql`
  query todo($id: Int!) {
    todo(id: $id) {
      ${todoElement}
    }
  }
`

const getTodosQuery = gql`
  query todos($skip: Int!, $take: Int!) {
    todos(skip: $skip, take: $take) {
      ${todoElement}
    }
  }
`

describe('Todos (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Todos', () => {
    let user: User
    let token: string

    let secondUser: User
    let secondToken: string

    let createdTodoId: number

    beforeAll(async () => {
      await createUser(app, user1)
      const signed = await loginUser(app, user1)
      user = signed.user
      token = signed.accessToken

      await createUser(app, user2)
      const secondSigned = await loginUser(app, user2)
      secondUser = secondSigned.user
      secondToken = secondSigned.accessToken

      createdTodoId = (await create(app, token).expectNoErrors()).data
        .createTodo.id
      expect(createdTodoId).toBeDefined()
    })

    afterAll(async () => {
      try {
        await testRemoveCreatedTodo()
      } finally {
        const response = await removeMe(app, token)
        const responseSecond = await removeMe(app, secondToken)
        expect(response.username).toEqual(user.username)
        expect(responseSecond.username).toEqual(secondUser.username)
      }
    })

    it('Get todos', async () => {
      const response = await request<{
        todos: Todo[]
      }>(app.getHttpServer())
        .set('Authorization', `Bearer ${token}`)
        .query(getTodosQuery)
        .variables({
          skip: 0,
          take: 1,
        })

      expect(response.data.todos.length).toBe(1)
    })

    it('Get todo by id', async () => {
      const response = await request<{
        todo: Todo
      }>(app.getHttpServer())
        .set('Authorization', `Bearer ${token}`)
        .query(getQuery)
        .variables({
          id: createdTodoId,
        })

      expect(response.data.todo.id).toBe(createdTodoId)
    })

    it('Get todo by id should failure', async () => {
      const response = await request<{
        todo: Todo
      }>(app.getHttpServer())
        .set('Authorization', `Bearer ${secondToken}`)
        .query(getQuery)
        .variables({
          id: createdTodoId,
        })

      expectForbidden(response)
    })

    it('Update todo', async () => {
      const response = await request<{
        updateTodo: Todo
      }>(app.getHttpServer())
        .set('Authorization', `Bearer ${token}`)
        .mutate(updateQuery)
        .variables({
          input: {
            id: createdTodoId,
            title: 'updated title',
            done: true,
          },
        })

      expect(response.data.updateTodo.id).toBe(createdTodoId)
      expect(response.data.updateTodo.done).toBe(true)
      expect(response.data.updateTodo.title).toBe('updated title')
      expect(response.data.updateTodo.description).toBe('Test description')
    })

    it('Update todo should be failure', async () => {
      const response = await request<{
        updateTodo: Todo
      }>(app.getHttpServer())
        .set('Authorization', `Bearer ${secondToken}`)
        .mutate(updateQuery)
        .variables({
          input: {
            id: createdTodoId,
            title: 'updated title',
            done: true,
          },
        })

      expectForbidden(response)
    })

    async function testRemoveCreatedTodo() {
      const response = await remove(app, token, createdTodoId)
      expect(response.data.removeTodo.id).toBe(createdTodoId)
    }
  })
})

function create(
  app: INestApplication,
  token: string,
  title = 'Test todo',
  description = 'Test description',
) {
  return request<{
    createTodo: { id: number; title: string; description: string }
  }>(app.getHttpServer())
    .set('Authorization', `Bearer ${token}`)
    .mutate(
      gql`
        mutation createTodo($input: CreateTodoInput!) {
          createTodo(createTodoInput: $input) {
            id
            title
            description
          }
        }
      `,
    )
    .variables({
      input: {
        title,
        description,
      },
    })
}

function remove(app: INestApplication, token: string, id: number) {
  return request<{
    removeTodo: { id: number; title: string }
  }>(app.getHttpServer())
    .set('Authorization', `Bearer ${token}`)
    .mutate(
      gql`
        mutation removeTodo($id: Int!) {
          removeTodo(id: $id) {
            id
            done
          }
        }
      `,
    )
    .variables({
      id,
    })
    .expectNoErrors()
}
