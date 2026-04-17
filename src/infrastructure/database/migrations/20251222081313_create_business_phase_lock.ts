import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('business_phase', (table) => {
    table.increments('id', { primaryKey: true });
    table.string('name').notNullable();
    table.string('code').notNullable().unique();
  });
  await knex.schema.createTable('business_phase_lock', (table) => {
    table.bigIncrements('id', { primaryKey: true });
    table.bigInteger('student_id').notNullable().references('id').inTable('student').onDelete('CASCADE');
    table.bigInteger('academic_year_id').notNullable().references('id').inTable('academic_year').onDelete('CASCADE');
    table.string('phase').notNullable().references('code').inTable('business_phase').onDelete('CASCADE');
    table.boolean('is_locked').notNullable();
    table.timestamps(true, true);
    table.unique(['student_id', 'academic_year_id', 'phase'], { indexName: 'uq_student_ay_business_phase' });
    table.index(['student_id', 'academic_year_id'], 'idx_bpl_student_ay');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('business_phase_lock');
  await knex.schema.dropTableIfExists('business_phase');
}
