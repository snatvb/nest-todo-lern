import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest-graphql'
import { AppModule } from './../src/app.module'
import gql from 'graphql-tag'
import { User } from '~/users/entities/user.entity'

const testUser = {
  username: 'e2e_tester',
  password: 'e2e_tester_pass',
  email: 'e2e_tester@testere2e.com',
}

describe('AppController (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Users', () => {
    let user: User
    let token: string
    beforeAll(async () => {
      await createUser(app)
      const signed = await loginUser(app)
      user = signed.data.signIn.user
      token = signed.data.signIn.accessToken
    })

    afterAll(async () => {
      const response = await request<{
        removeUser: { id: number; username: string }
      }>(app.getHttpServer())
        .mutate(
          gql`
            mutation removeUser($input: Int!) {
              removeUser(id: $input) {
                id
                username
              }
            }
          `,
        )
        .variables({
          input: user.id,
        })
        .expectNoErrors()

      expect(response.data.removeUser.username).toEqual(user.username)
    })

    it('updateUser', async () => {
      const response = await request<{
        updateUser: { id: number; avatar: string }
      }>(app.getHttpServer())
        .set('Authorization', `Bearer ${token}`)
        .mutate(
          gql`
            mutation updateUser($input: UpdateUserInput!) {
              updateUser(updateUserInput: $input) {
                id
                avatar
              }
            }
          `,
        )
        .variables({
          input: {
            id: user.id,
            avatar: 'https://example.com/avatar.png',
          },
        })
        .expectNoErrors()

      user.avatar = response.data.updateUser.avatar
      expect(response.data.updateUser.avatar).toBe(
        'https://example.com/avatar.png',
      )
      expect(response.data.updateUser.id).toBe(user.id)
    })
  })
})

function createUser(app: INestApplication) {
  return request<{
    createUser: { id: number; username: string }
  }>(app.getHttpServer())
    .mutate(
      gql`
        mutation createUser($input: CreateUserInput!) {
          createUser(createUserInput: $input) {
            id
            username
          }
        }
      `,
    )
    .variables({
      input: testUser,
    })
    .expectNoErrors()
}

function loginUser(app: INestApplication) {
  return request<{
    signIn: { user: User; accessToken: string }
  }>(app.getHttpServer())
    .mutate(
      gql`
        mutation signIn($input: SignInInput!) {
          signIn(signInInput: $input) {
            user {
              id
              username
              email
              avatar
              createdAt
              updatedAt
            }
            accessToken
          }
        }
      `,
    )
    .variables({
      input: {
        username: testUser.username,
        password: testUser.password,
      },
    })
    .expectNoErrors()
}
