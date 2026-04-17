import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('school', (table) => {
    table.bigIncrements('id', { primaryKey: true });
    table.string('name', 255).notNullable();
    table.specificType('account_type', 'business_model_enum').notNullable();
    table.bigInteger('current_ay_id').unsigned();
    table.bigInteger('country_id').unsigned();
    table.bigInteger('state_id').unsigned();
    table.bigInteger('city_id').unsigned();
    table.string('street_address_line1', 255);
    table.string('street_address_line2', 255);
    table.string('postal_code', 20);
    table.string('address_contact_number', 20);
    table.integer('total_license').unsigned().defaultTo(0).notNullable();
    table.string('poc_name', 100);
    table.string('poc_contact_number', 20);
    table.string('poc_email', 255);
    table.string('principal_name', 255);
    table.integer('academic_start_month');
    table.integer('academic_end_month');
    table.integer('promotion_start_month');
    table.integer('promotion_start_day');
    table.text('logo_url');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);

    table.check('academic_start_month >= 1 AND academic_start_month <= 12', {}, 'chk_academic_start_month');
    table.check('academic_end_month >= 1 AND academic_end_month <= 12', {}, 'chk_academic_end_month');
    table.check('promotion_start_month >= 1 AND promotion_start_month <= 12', {}, 'chk_promotion_start_month');
    table.check('promotion_start_day >= 1 AND promotion_start_day <= 31', {}, 'chk_promotion_start_day');

    table.foreign('country_id').references('id').inTable('country').onDelete('SET NULL');
    table.foreign('state_id').references('id').inTable('state').onDelete('SET NULL');
    table.foreign('city_id').references('id').inTable('city').onDelete('SET NULL');

    table.index(['account_type']);
  });

  await knex.schema.createTable('academic_year', (table) => {
    table.bigIncrements('id', { primaryKey: true });
    table.bigInteger('school_id').unsigned().notNullable();
    table.integer('start_year').notNullable();
    table.integer('end_year').notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.timestamps(true, true);

    table.unique(['school_id', 'start_year', 'end_year'], { indexName: 'uniq_school_academic_year' });

    table.foreign('school_id').references('id').inTable('school').onDelete('CASCADE');
  });

  await knex.schema.alterTable('school', (table) => {
    table.foreign('current_ay_id').references('id').inTable('academic_year').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('school', (table) => {
    table.dropForeign(['current_ay_id']);
  });
  await knex.schema.dropTableIfExists('academic_year');
  await knex.schema.dropTableIfExists('school');
}
