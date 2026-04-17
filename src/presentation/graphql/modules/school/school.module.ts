import { Module } from '@nestjs/common';
import { SchoolAddressResolver } from './school-address.resolver';
import { SchoolAdminResolver } from './school-admin.resolver';
import { SchoolGradeResolver, SchoolSectionResolver } from './school-grade.resolver';
import { SchoolResolver } from './school.resolver';

@Module({
  providers: [SchoolResolver, SchoolGradeResolver, SchoolSectionResolver, SchoolAddressResolver, SchoolAdminResolver],
})
export class SchoolModule {}
