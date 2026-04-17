import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('notification_type').del();

  await knex('notification_type').insert([
    { id: 1, code: 'CREATED_CHALLENGE', title: 'Challenge Created', template: '**{{scopeName}}** **{{userAccountName}}** created a new challenge **{{challengeName}}**' },
    { id: 2, code: 'UPDATED_CHALLENGE', title: 'Challenge updated', template: '**{{scopeName}}** **{{userAccountName}}** has Updated the details of challenge **{{challengeName}}**' },
    { id: 3, code: 'DELETED_CHALLENGE', title: 'Challenge deleted', template: '**{{scopeName}}** **{{userAccountName}}** has deleted challenge **{{challengeName}}**' },
    { id: 4, code: 'ASSIGNED_CHALLENGE', title: 'Challenge Assigned', template: '**{{scopeName}}** **{{userAccountName}}** assigned challenge **{{challengeName}}** to **{{studentName}}**' },
    { id: 5, code: 'CREATED_BUSINESS', title:'Business Created', template:'A new business idea **{{businessName}}** created by student **{{studentName}}**' },
    { id: 6, code: 'UPDATED_BUSINESS', title:'Business Updated', template:'Student **{{studentName}}** has Updated  Business idea **{{businessName}}**' },
    { id: 7, code: 'DELETED_BUSINESS', title:'Business Deleted', template:'Student **{{studentName}}** has Deleted  Business idea **{{businessName}}**' },
    { id: 8, code: 'CREATED_SCHOOL_ADMIN', title:'New School Admin Added', template:'**{{scopeName}}** **{{userAccountName}}** has  Created School Admin **{{schoolAdminName}}** for School **{{schoolName}}**' },
    { id: 9, code: 'UPDATED_SCHOOL_ADMIN', title:'School Admin Details Updated', template:'**{{scopeName}}** **{{userAccountName}}** has updated the Details of School Admin **{{schoolAdminName}}**' },
    { id: 10, code: 'DELETED_SCHOOL_ADMIN', title:'School Admin Deleted', template:'**{{scopeName}}** **{{userAccountName}}** has deleted the School Admin **{{schoolAdminName}}**' },
    { id: 11, code: 'CREATED_SCHOOL', title:'New School Added', template:'Trusity Admin **{{userAccountName}}** created a new school: **{{schoolName}}**' },
    { id: 12, code: 'UPDATED_SCHOOL', title:'School Updated', template:'Trusity Admin **{{userAccountName}}** has updated school **{{schoolName}}**' },
    { id: 13, code: 'CREATED_STUDENT', title:'New Student Added', template:'**{{scopeName}}** **{{userAccountName}}** created a new student **{{studentName}}** Under School **{{schoolName}}**' },
    { id: 14, code: 'UPDATED_STUDENT', title:'Student Updated', template:'**{{scopeName}}** **{{userAccountName}}** has updated student **{{studentName}}**' },
    { id: 15, code: 'CREATED_FEEDBACK', title:'Feedback Added', template:'Teacher **{{userAccountName}}** has added a feedback to an Idea **{{businessName}}** for student **{{studentName}}** under sub-phase **{{subPhaseName}}**' },
    { id: 16, code: 'RECIEVED_FEEDBACK', title:'Feedback Recieved', template:'You have received a feedback from teacher **{{userAccountName}}** on your idea **{{businessName}}** under sub-phase **{{subPhaseName}}**' },
    { id: 17, code: 'CREATED_TEACHER', title:'New Teacher Added', template:'**{{scopeName}}** **{{userAccountName}}** has  Created a new teacher **{{teacherName}}** for School **{{schoolName}}**' },
    { id: 18, code: 'HIDE_CHALLENGE', title:'',template:'School Admin **{{schoolAdminName}}** from **{{schoolName}}** made the challenge **{{challengeName}}** **{{hidden}}**' },
    { id: 19, code: 'UPLOADED_BULK_STUDENTS', title:'Students Uploaded in Bulk',template:'**{{scopeName}}** **{{userAccountName}}** bulk uploaded students under school **{{schoolName}}**' },
    { id: 20, code: 'UPDATED_TEACHER', title:'teacher updated', template:'**{{scopeName}}** **{{userAccountName}}** has updated the details of Teacher **{{teacherName}}** under school {{schoolName}}' },
    { id: 21, code: 'DELETED_TEACHER', title:'teacher deleted', template:'**{{scopeName}}** **{{userAccountName}}** has deleted the Teacher **{{teacherName}}** under school {{schoolName}}' },
    { id: 22, code: 'COMPLETED_BUSINESS', title:'business completed', template:'student **{{userAccountName}}** has completed business **{{businessName}}**' },
    { id: 23, code: 'PROMOTED_SCHOOL', title:'Students Auto-Promotion Completed', template:'Students of your school have been auto-promoted to the new academic year. Please verify and make the neccessary changes, if required.' },
    { id: 24, code: 'DELETED_STUDENT', title:'Student Deleted', template:'**{{scopeName}}** **{{userAccountName}}** has deleted student **{{studentName}}**' },
    { id: 25, code: 'SCHOOL_ACTIVATION', title:'School Status Updated', template:'Trusity Admin {{userAccountName}} has {{activation}} School {{schoolName}}' },
  ]);
}
