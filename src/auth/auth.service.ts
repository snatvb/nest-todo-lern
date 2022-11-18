import { Injectable } from '@nestjs/common'
import { UsersService } from '~/users/users.service'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findOneByUsername(username)
    if (
      user &&
      (await this.userService.validatePassword(password, user.password))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user
      return result
    }
    return null
  }

  async signIn(username: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...user } = await this.userService.findOneByUsername(
      username,
    )
    return {
      accessToken: this.jwtService.sign({ username, sub: user.id }),
      user,
    }
  }
}
