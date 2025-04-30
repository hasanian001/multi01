import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    // Extract the token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token not provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid authentication token format');
    }

    try {
      // Verify token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Check if token exists in session
      const session = await this.prisma.session.findUnique({
        where: { cookie: token },
      });

      if (!session) {
        throw new UnauthorizedException('Session has expired or is invalid');
      }

      // Check if session has expired
      if (new Date() > session.expires) {
        // Clean up expired session
        await this.prisma.session.delete({ where: { id: session.id } });
        throw new UnauthorizedException('Session has expired');
      }

      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (user.is_banned) {
        throw new UnauthorizedException('Your account has been banned');
      }

      // Attach user to request object
      req.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}