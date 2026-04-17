// import { Knex } from 'knex';

// export async function seed(knex: Knex): Promise<void> {
//   await knex('resource_permission').del();
//   await knex('permission_dependency').del();
//   await knex('permission').del();
//   await knex('resource').del();

//   await knex('resource').insert([
//     { id: 1, name: 'School management', description: 'School management', sort_order: 1 },
//     { id: 2, name: 'Challenge management', description: 'Challenge management', sort_order: 2 },
//     { id: 3, name: 'Learning files', description: 'Learning files management', sort_order: 3 },
//     { id: 4, name: 'Student management', description: 'Student management', sort_order: 4 },
//     { id: 5, name: 'Teacher management', description: 'Teacher management', sort_order: 5 },
//   ]);

//   await knex('permission').insert([
//     { id: 1, code: 'school:create', name: 'Create School', description: 'Allows the user to create a new school record.', sort_order: 1 },
//     { id: 2, code: 'school:update', name: 'Update School', description: 'Allows the user to update existing school information.', sort_order: 2 },
//     { id: 3, code: 'school:delete', name: 'Delete School', description: 'Allows the user to permanently delete a school record.', sort_order: 3 },
//     { id: 4, code: 'school:toggle_status', name: 'Enable/Disable School', description: 'Allows the user to enable or disable a school (default is disabled).', sort_order: 4 },

//     { id: 5, code: 'challenge:create', name: 'Add Challenge', description: 'Allows the user to create a new challenge.', sort_order: 1 },
//     { id: 6, code: 'challenge:update', name: 'Update Challenge', description: 'Allows the user to update an existing challenge.', sort_order: 2 },
//     { id: 7, code: 'challenge:delete', name: 'Delete Challenge', description: 'Allows the user to permanently delete a challenge.', sort_order: 3 },
//     { id: 8, code: 'challenge:assign', name: 'Assign/Unassign Challenge', description: 'Allows the user to assign or unassign challenges to users or groups.', sort_order: 4 },

//     { id: 9, code: 'learning_files:create', name: 'Add Learning Files', description: 'Allows the user to add new learning files.', sort_order: 1 },
//     { id: 10, code: 'learning_files:update', name: 'Update Learning Files', description: 'Allows the user to update existing learning files.', sort_order: 2 },
//     { id: 11, code: 'learning_files:delete', name: 'Delete Learning Files', description: 'Allows the user to delete learning files.', sort_order: 3 },

//     { id: 12, code: 'student:create', name: 'Create Student', description: 'Allows the user to add a new student.', sort_order: 1 },
//     { id: 13, code: 'student:update', name: 'Update Student', description: 'Allows the user to update student details.', sort_order: 2 },
//     { id: 14, code: 'student:delete', name: 'Delete Student', description: 'Allows the user to delete a student record.', sort_order: 3 },

//     { id: 15, code: 'teacher:create', name: 'Create Teacher', description: 'Allows the user to add a new teacher.', sort_order: 1 },
//     { id: 16, code: 'teacher:update', name: 'Update Teacher', description: 'Allows the user to update teacher details.', sort_order: 2 },
//     { id: 17, code: 'teacher:delete', name: 'Delete Teacher', description: 'Allows the user to delete a teacher record.', sort_order: 3 },
//   ]);

//   await knex('permission_dependency').insert([
//     { parent_permission_id: 1, child_permission_id: 2 },
//     { parent_permission_id: 2, child_permission_id: 1 },
//     { parent_permission_id: 3, child_permission_id: 1 },
//     { parent_permission_id: 4, child_permission_id: 1 },

//     { parent_permission_id: 5, child_permission_id: 6 },
//     { parent_permission_id: 6, child_permission_id: 5 },
//     { parent_permission_id: 7, child_permission_id: 5 },
//     { parent_permission_id: 8, child_permission_id: 5 },

//     { parent_permission_id: 9, child_permission_id: 10 },
//     { parent_permission_id: 10, child_permission_id: 9 },
//     { parent_permission_id: 11, child_permission_id: 9 },

//     { parent_permission_id: 12, child_permission_id: 13 },
//     { parent_permission_id: 13, child_permission_id: 12 },
//     { parent_permission_id: 14, child_permission_id: 12 },

//     { parent_permission_id: 15, child_permission_id: 16 },
//     { parent_permission_id: 16, child_permission_id: 15 },
//     { parent_permission_id: 17, child_permission_id: 15 },
//   ]);

//   await knex('resource_permission').insert([
//     { resource_id: 1, permission_id: 1 },
//     { resource_id: 1, permission_id: 2 },
//     { resource_id: 1, permission_id: 3 },
//     { resource_id: 1, permission_id: 4 },

//     { resource_id: 2, permission_id: 5 },
//     { resource_id: 2, permission_id: 6 },
//     { resource_id: 2, permission_id: 7 },
//     { resource_id: 2, permission_id: 8 },

//     { resource_id: 3, permission_id: 9 },
//     { resource_id: 3, permission_id: 10 },
//     { resource_id: 3, permission_id: 11 },

//     { resource_id: 4, permission_id: 12 },
//     { resource_id: 4, permission_id: 13 },
//     { resource_id: 4, permission_id: 14 },

//     { resource_id: 5, permission_id: 15 },
//     { resource_id: 5, permission_id: 16 },
//     { resource_id: 5, permission_id: 17 },
//   ]);
// }
import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('resource_permission').del();
  await knex('permission_dependency').del();
  await knex('permission').del();
  await knex('resource').del();

  await knex('resource').insert([
    { id: 1, name: 'School management', description: 'School management', sort_order: 1 },
    { id: 2, name: 'Challenge management', description: 'Challenge management', sort_order: 2 },
    { id: 3, name: 'Learning files', description: 'Learning files management', sort_order: 3 },
    { id: 4, name: 'Student management', description: 'Student management', sort_order: 4 },
    { id: 5, name: 'Teacher management', description: 'Teacher management', sort_order: 5 },
  ]);

  await knex('permission').insert([
    { id: 1, code: 'school:create', name: 'Create School', description: 'Allows the user to create a new school record.', sort_order: 1 },
    { id: 2, code: 'school:update', name: 'Update School', description: 'Allows the user to update existing school information.', sort_order: 2 },
    { id: 3, code: 'school:toggle_status', name: 'Enable/Disable School', description: 'Allows the user to enable or disable a school (default is disabled).', sort_order: 3 },

    { id: 4, code: 'challenge:create', name: 'Add Challenge', description: 'Allows the user to create a new challenge.', sort_order: 1 },
    { id: 5, code: 'challenge:update', name: 'Update Challenge', description: 'Allows the user to update an existing challenge.', sort_order: 2 },
    { id: 6, code: 'challenge:delete', name: 'Delete Challenge', description: 'Allows the user to permanently delete a challenge.', sort_order: 3 },
    { id: 7, code: 'challenge:assign', name: 'Assign/Unassign Challenge', description: 'Allows the user to assign or unassign challenges to users or groups.', sort_order: 4 },

    { id: 8, code: 'learning_files:create', name: 'Add Learning Files', description: 'Allows the user to add new learning files.', sort_order: 1 },
    { id: 9, code: 'learning_files:delete', name: 'Delete Learning Files', description: 'Allows the user to delete learning files.', sort_order: 2 },

    { id: 10, code: 'student:create', name: 'Create Student', description: 'Allows the user to add a new student.', sort_order: 1 },
    { id: 11, code: 'student:update', name: 'Update Student', description: 'Allows the user to update student details.', sort_order: 2 },
    { id: 12, code: 'student:delete', name: 'Delete Student', description: 'Allows the user to delete a student record.', sort_order: 3 },

    { id: 13, code: 'teacher:create', name: 'Create Teacher', description: 'Allows the user to add a new teacher.', sort_order: 1 },
    { id: 14, code: 'teacher:update', name: 'Update Teacher', description: 'Allows the user to update teacher details.', sort_order: 2 },
    { id: 15, code: 'teacher:delete', name: 'Delete Teacher', description: 'Allows the user to delete a teacher record.', sort_order: 3 },
  ]);

  await knex('resource_permission').insert([
    { resource_id: 1, permission_id: 1 },
    { resource_id: 1, permission_id: 2 },
    { resource_id: 1, permission_id: 3 },

    { resource_id: 2, permission_id: 4 },
    { resource_id: 2, permission_id: 5 },
    { resource_id: 2, permission_id: 6 },
    { resource_id: 2, permission_id: 7 },

    { resource_id: 3, permission_id: 8 },
    { resource_id: 3, permission_id: 9 },

    { resource_id: 4, permission_id: 10 },
    { resource_id: 4, permission_id: 11 },
    { resource_id: 4, permission_id: 12 },

    { resource_id: 5, permission_id: 13 },
    { resource_id: 5, permission_id: 14 },
    { resource_id: 5, permission_id: 15 },
  ]);
}
