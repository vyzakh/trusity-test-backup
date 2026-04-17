import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IS_PRIVATE_KEY, IS_PUBLIC_KEY, SCOPES_KEY } from '@shared/decorators';
import { PERMISSIONS_KEY } from '@shared/decorators/permissions.decorator';
import { PlatformUserRole, UserScope } from '@shared/enums';
import { ForbiddenException, UnauthenticatedException } from '@shared/execeptions';

@Injectable()
export class GqlSessionAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);

    if (isPublic) {
      return true;
    }

    const isPrivate = this.reflector.getAllAndOverride<boolean>(IS_PRIVATE_KEY, [context.getHandler(), context.getClass()]);

    if (isPrivate) {
      if (!request.user) {
        throw new UnauthenticatedException('You need to be authenticated to perform this action.');
      }

      const requiredScopes = this.reflector.getAllAndOverride<string[]>(SCOPES_KEY, [context.getHandler(), context.getClass()]);

      if (!requiredScopes || requiredScopes.length === 0) {
        return true;
      }

      if (!requiredScopes.includes(request.user.scope)) {
        throw new ForbiddenException('You do not have permission to perform this action.');
      }
    }
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (requiredPermissions && requiredPermissions.length > 0) {
      return this.checkPermissions(request.user, requiredPermissions);
    }

    return true;
  }

  private checkPermissions(user: any, requiredPermissions: string[]): boolean {
    if (user.role === PlatformUserRole.SUPERADMIN) {
      return true;
    }

    switch (user.scope) {
      case UserScope.PLATFORM_USER:
        return this.checkPlatformUserPermissions(user, requiredPermissions);

      case UserScope.SCHOOL_ADMIN:
        return this.checkSchoolAdminPermissions(user, requiredPermissions);

      case UserScope.TEACHER:
        return this.checkTeacherPermissions(user, requiredPermissions);
      case UserScope.STUDENT:
        throw new ForbiddenException('Insufficient privileges for this operation.');

      default:
        throw new ForbiddenException('Unknown user scope.');
    }
  }

  private checkPlatformUserPermissions(user: any, requiredPermissions: string[]): boolean {
    const userPermissions = user.permissions || [];
    const hasRequiredPermission = requiredPermissions.some((permission) => userPermissions.includes(permission));

    if (!hasRequiredPermission) {
      throw new ForbiddenException(`Missing required permission. Need one of: ${requiredPermissions.join(', ')}`);
    }

    return true;
  }

  private checkSchoolAdminPermissions(user: any, requiredPermissions: string[]): boolean {
    //const userPermissions = user.permissions || [];
    //console.log('sa', userPermissions);

    //const hasRequiredPermission = requiredPermissions.some((permission) => userPermissions.includes(permission));

    // if (!hasRequiredPermission) {
    //   throw new ForbiddenException(`Missing required permission. Need one of: ${requiredPermissions.join(', ')}`);
    // }

    const allowedPermissions = [
      'school:create',
      'school:update',
      'school:delete',
      'school:toggle_status',
      'student:create',
      'student:update',
      'student:delete',
      'teacher:create',
      'teacher:update',
      'teacher:delete',
      'badge:update',
      'phase:toggle_lock',
      'report:generate_and_share'
    ];

    const hasValidScopePermission = requiredPermissions.every((permission) => allowedPermissions.includes(permission));

    if (!hasValidScopePermission) {
      const invalidPermissions = requiredPermissions.filter((permission) => !allowedPermissions.includes(permission));

      throw new ForbiddenException(`School admins cannot access: ${invalidPermissions.join(', ')}`);
    }

    return true;
  }

  private checkTeacherPermissions(user: any, requiredPermissions: string[]): boolean {

    const allowedPermissions = [
      'phase:toggle_lock',
      'report:generate_and_share'
    ];

    const hasValidScopePermission = requiredPermissions.every((permission) => allowedPermissions.includes(permission));

    if (!hasValidScopePermission) {
      const invalidPermissions = requiredPermissions.filter((permission) => !allowedPermissions.includes(permission));

      throw new ForbiddenException(`Teacher cannot access: ${invalidPermissions.join(', ')}`);
    }

    return true;
  }
}
