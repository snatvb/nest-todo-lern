import { INestApplication } from '@nestjs/common'
import request from 'supertest-graphql'
import gql from 'graphql-tag'
import { User } from '~/users/entities/user.entity'
import { createApp, createUser, loginUser, removeMe } from './helpers'

describe('Users (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Users', () => {
    let user: User
    let token: string

    let secondUser: User
    let secondToken: string

    beforeAll(async () => {
      await createUser(app)
      const signed = await loginUser(app)
      user = signed.user
      token = signed.accessToken

      const user2 = {
        username: 'e2e_tester_2',
        password: 'e2e_tester_pass_2',
        email: 'e2e_tester_2@ete2.com',
      }
      await createUser(app, user2)
      const secondSigned = await loginUser(app, user2)
      secondUser = secondSigned.user
      secondToken = secondSigned.accessToken
    })

    afterAll(async () => {
      const response = await removeMe(app, token)
      const responseSecond = await removeMe(app, secondToken)
      expect(response.username).toEqual(user.username)
      expect(responseSecond.username).toEqual(secondUser.username)
    })

    it('updateUser', async () => {
      const response = await updateUser(app, token, user.id).expectNoErrors()
      user.avatar = response.data.updateUser.avatar
      expect(response.data.updateUser.avatar).toBe(
        'https://example.com/avatar.png',
      )
      expect(response.data.updateUser.id).toBe(user.id)
    })

    it('updateUser should failure', async () => {
      const response = await updateUser(app, token, secondUser.id)
      expect(response.errors?.[0]?.extensions.code).toBe('FORBIDDEN')
    })
  })
})

function updateUser(app: INestApplication, token: string, userId: number) {
  return request<{
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
        id: userId,
        avatar: 'https://example.com/avatar.png',
      },
    })
}
