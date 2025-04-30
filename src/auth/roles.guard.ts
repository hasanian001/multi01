import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get request from GQL context
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const user = req.user;

    // Check if user is authenticated
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if user has required role
    const hasRole = requiredRoles.some(role => user.role === role);
    if (!hasRole) {
      throw new UnauthorizedException(`User with role ${user.role} does not have permission to access this resource`);
    }

    return true;
  }
}