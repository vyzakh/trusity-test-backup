import { Module } from '@nestjs/common';
import { TeacherFeedbackResolver } from './teacher-feedback.resolver';
import { TeacherGradeResolver, TeacherResolver, TeacherSectionResolver } from './teacher.resolver';

@Module({
  providers: [TeacherResolver, TeacherGradeResolver, TeacherSectionResolver, TeacherFeedbackResolver],
})
export class TeacherModule {}
