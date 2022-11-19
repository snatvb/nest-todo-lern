import { INestApplication } from '@nestjs/common'
import request from 'supertest-graphql'
import gql from 'graphql-tag'
import { User } from '~/users/entities/user.entity'
import { createApp, createUser, loginUser, removeMe } from './helpers'

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
  owner: {
    id: number
  }
}

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
        .query(
          gql`
            query todos($skip: Int!, $take: Int!) {
              todos(skip: $skip, take: $take) {
                id
                title
                done
                owner {
                  id
                }
              }
            }
          `,
        )
        .variables({
          skip: 0,
          take: 1,
        })

      expect(response.data.todos.length).toBe(1)
    })

    async function testRemoveCreatedTodo() {
      const response = await remove(app, token, createdTodoId)
      expect(response.data.removeTodo.id).toBe(createdTodoId)
    }
  })

  // beforeAll(async () => {
  //   app = await createApp()
  //   await createUser(app)
  //   const signed = await loginUser(app, user1)
  //   user = signed.user
  //   token = signed.accessToken

  //   await createUser(app, user2)
  //   const secondSigned = await loginUser(app, user2)
  //   secondUser = secondSigned.user
  //   secondToken = secondSigned.accessToken

  //   const title = 'Test todo'
  //   const response = await request<{
  //     crateTodo: { id: number; title: string }
  //   }>(app.getHttpServer())
  //     .set('Authorization', `Bearer ${token}`)
  //     .mutate(
  //       gql`
  //         mutation createTodo($input: CreateTodoInput!) {
  //           createTodo(createTodoInput: $input) {
  //             id
  //             title
  //           }
  //         }
  //       `,
  //     )
  //     .variables({
  //       input: {
  //         title,
  //       },
  //     })
  //     .expectNoErrors()

  //   expect(response.data.crateTodo.title).toBe(title)
  // })

  // afterAll(async () => {
  //   try {
  //     const response = await removeMe(app, token)
  //     const responseSecond = await removeMe(app, secondToken)
  //     expect(response.username).toEqual(user.username)
  //     expect(responseSecond.username).toEqual(secondUser.username)
  //   } finally {
  //     await app.close()
  //   }
  // })
})

function create(app: INestApplication, token: string, title = 'Test todo') {
  return request<{
    createTodo: { id: number; title: string }
  }>(app.getHttpServer())
    .set('Authorization', `Bearer ${token}`)
    .mutate(
      gql`
        mutation createTodo($input: CreateTodoInput!) {
          createTodo(createTodoInput: $input) {
            id
            title
          }
        }
      `,
    )
    .variables({
      input: {
        title,
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
