import { Module } from '@nestjs/common';
import { StudentPitchResolver } from '../business/student-pitch.resolver';
import { StudentUserResolver } from './student-user.resolver';
import { StudentAcademicHistoryResolver, StudentResolver } from './student.resolver';

@Module({
  providers: [StudentResolver, StudentUserResolver, StudentPitchResolver, StudentAcademicHistoryResolver],
})
export class StudentModule {}
