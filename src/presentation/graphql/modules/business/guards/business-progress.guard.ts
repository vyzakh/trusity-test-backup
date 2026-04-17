export interface ProgressSection {
  id: string;
  name: string;
  completed: boolean;
  order: number;
  redirectUrl?: string;
}

export interface ProgressCheckResult {
  canAccess: boolean;
  nextRedirectUrl?: string;
  currentSection?: string;
  message?: string;
}

import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';

export const PROGRESS_KEY = 'progress_section';

@Injectable()
export class ProgressGuard implements CanActivate {
  private readonly logger = new Logger(ProgressGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Create GraphQL execution context
    const gqlContext = GqlExecutionContext.create(context);
    const info: GraphQLResolveInfo = gqlContext.getInfo();

    // Skip introspection queries
    if (this.isIntrospectionQuery(info)) {
      return true;
    }

    // Get required section from decorator
    const requiredSection = this.reflector.get<string>(PROGRESS_KEY, context.getHandler());

    if (!requiredSection) {
      return true; // No progress requirement
    }

    // Extract all GraphQL context information
    const contextData = gqlContext.getContext();
    const args = gqlContext.getArgs();

    // Extract operation details from GraphQL info
    const operationDetails = this.extractOperationDetails(info);
    const requestedFields = this.getRequestedFields(info);

    // Get user ID from GraphQL context
    const userId = contextData.user?.id || contextData.req?.user?.id;

    this.logger.log(`Progress check for operation: ${operationDetails.fieldName}`, {
      operation: operationDetails,
      requiredSection,
      userId: userId ? '[PRESENT]' : '[MISSING]',
      requestedFields,
    });

    if (!userId) {
      throw new ForbiddenException({
        message: 'Authentication required',
        code: 'UNAUTHENTICATED',
        operation: operationDetails,
      });
    }

    // Check section access
    const progressCheck = await this.checkSectionAccess(userId, requiredSection);

    if (!progressCheck.canAccess) {
      this.logger.warn(`Access denied for ${operationDetails.fieldName}`, {
        userId: userId,
        requiredSection,
        currentSection: progressCheck.currentSection,
        operation: operationDetails,
      });

      // Enhanced exception with GraphQL operation details
      throw new ForbiddenException({
        message: progressCheck.message,
        redirectUrl: progressCheck.nextRedirectUrl,
        currentSection: progressCheck.currentSection,
        requiredSection: requiredSection,
        code: 'PROGRESS_BLOCKED',
        operation: {
          ...operationDetails,
          args: this.sanitizeArgs(args),
          requestedFields,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Store progress and operation info in GraphQL context for resolver access
    contextData.progressInfo = progressCheck;
    contextData.operationInfo = operationDetails;
    contextData.requestedFields = requestedFields;
    contextData.sanitizedArgs = this.sanitizeArgs(args);

    return true;
  }

  // Progress logic methods
  private async getUserProgress(userId: string): Promise<ProgressSection[]> {
    // Replace this with your actual database query
    // Example using TypeORM, Prisma, or any other ORM:
    /*
    return await this.progressRepository.find({
      where: { userId },
      order: { order: 'ASC' }
    });
    */

    // Mock data for demonstration - replace with real DB call
    const mockProgress: ProgressSection[] = [
      { id: '1', name: 'profile', completed: true, order: 1, redirectUrl: '/profile' },
      { id: '2', name: 'documents', completed: false, order: 2, redirectUrl: '/documents' },
      { id: '3', name: 'verification', completed: false, order: 3, redirectUrl: '/verification' },
      { id: '4', name: 'payment', completed: false, order: 4, redirectUrl: '/payment' },
      { id: '5', name: 'review', completed: false, order: 5, redirectUrl: '/review' },
    ];

    // Simulate database delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    return mockProgress;
  }

  private async checkSectionAccess(userId: string, targetSection: string): Promise<ProgressCheckResult> {
    const progress = await this.getUserProgress(userId);
    const currentSection = progress.find((p) => p.name === targetSection);

    if (!currentSection) {
      return {
        canAccess: false,
        message: `Section '${targetSection}' not found`,
      };
    }

    const previousSections = progress.filter((p) => p.order < currentSection.order).sort((a, b) => a.order - b.order);

    const incompletePrevious = previousSections.find((p) => !p.completed);

    if (incompletePrevious) {
      return {
        canAccess: false,
        nextRedirectUrl: incompletePrevious.redirectUrl,
        currentSection: incompletePrevious.name,
        message: `Please complete '${incompletePrevious.name}' section first`,
      };
    }

    return {
      canAccess: true,
      currentSection: targetSection,
      nextRedirectUrl: currentSection.redirectUrl,
    };
  }

  // GraphQL utility methods
  private extractOperationDetails(info: GraphQLResolveInfo) {
    return {
      operationName: info.operation.name?.value || 'anonymous',
      operationType: info.operation.operation,
      fieldName: info.fieldName,
      parentType: info.parentType.name,
      returnType: info.returnType.toString(),
      path: info.path,
      variables: info.variableValues,
    };
  }

  private getRequestedFields(info: GraphQLResolveInfo): string[] {
    const selections = info.fieldNodes[0]?.selectionSet?.selections || [];
    return this.extractFieldNames(selections);
  }

  private extractFieldNames(selections: readonly any[]): string[] {
    const fields: string[] = [];

    selections.forEach((selection) => {
      if (selection.kind === 'Field') {
        fields.push(selection.name.value);

        // Recursively get nested fields
        if (selection.selectionSet) {
          const nestedFields = this.extractFieldNames(selection.selectionSet.selections);
          fields.push(...nestedFields.map((nested) => `${selection.name.value}.${nested}`));
        }
      }
    });

    return fields;
  }

  private isIntrospectionQuery(info: GraphQLResolveInfo): boolean {
    return info.fieldName.startsWith('__') || info.parentType.name === '__Schema' || info.parentType.name === '__Type';
  }

  private sanitizeArgs(args: any): any {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;

      const result = Array.isArray(obj) ? [] : {};

      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }

      return result;
    };

    return sanitizeObject({ ...args });
  }

  // Method to update progress (can be called from resolvers)
  async updateProgress(userId: string, sectionName: string, completed: boolean = true): Promise<boolean> {
    // Replace with actual database update
    /*
    await this.progressRepository.update(
      { userId, name: sectionName },
      { completed }
    );
    */

    this.logger.log(`Progress updated: ${sectionName} = ${completed}`, { userId });
    return true;
  }

  // Method to get all progress (can be called from resolvers)
  async getProgressForUser(userId: string): Promise<ProgressSection[]> {
    return this.getUserProgress(userId);
  }
}

// progress.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const RequireProgress = (section: string) => SetMetadata(PROGRESS_KEY, section);

// Combined decorator for easier usage
export function ProgressCheck(section: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    SetMetadata(PROGRESS_KEY, section)(target, propertyKey, descriptor);
  };
}
