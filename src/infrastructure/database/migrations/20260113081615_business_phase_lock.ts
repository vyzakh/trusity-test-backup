import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('b2b_lock_status', (table) => {
    table.increments('id').primary();

    table.bigInteger('school_id').notNullable().references('id').inTable('school').onDelete('CASCADE');

    table.bigInteger('grade_id').notNullable().references('id').inTable('grade').onDelete('CASCADE');

    table.bigInteger('section_id').notNullable().references('id').inTable('section').onDelete('CASCADE');

    table.bigInteger('academic_year_id').notNullable().references('id').inTable('academic_year').onDelete('CASCADE');

    table.boolean('innovation').notNullable().defaultTo(true);
    table.boolean('entrepreneurship').notNullable().defaultTo(true);
    table.boolean('communication').notNullable().defaultTo(true);

    table.timestamps(true, true);

    table.unique(['school_id', 'grade_id', 'section_id', 'academic_year_id'], {
      indexName: 'uniq_b2b_lock_status',
    });
  });

  await knex.schema.createTable('b2c_lock_default', (table) => {
    table.increments('id').primary();

    table.string('phase').notNullable().references('code').inTable('business_phase').onDelete('CASCADE');

    table.boolean('is_locked').notNullable().defaultTo(false);

    table.timestamps(true, true);

    table.unique(['phase'], {
      indexName: 'uniq_b2c_lock_default_phase',
    });
  });

  await knex.raw(`
    CREATE OR REPLACE FUNCTION trg_insert_b2b_lock_status()
    RETURNS TRIGGER AS $$
    DECLARE
      v_academic_year_id BIGINT;
      v_account_type TEXT;
    BEGIN
      -- Fetch academic year & account type from school
      SELECT current_ay_id, account_type
      INTO v_academic_year_id, v_account_type
      FROM school
      WHERE id = NEW.school_id;

      -- Only apply for B2B schools
      IF v_account_type <> 'b2b' THEN
        RETURN NEW;
      END IF;

      -- Insert default lock status (single row)
      INSERT INTO b2b_lock_status (
        school_id,
        grade_id,
        section_id,
        academic_year_id,
        innovation,
        entrepreneurship,
        communication,
        created_at,
        updated_at
      )
      VALUES (
        NEW.school_id,
        NEW.grade_id,
        NEW.section_id,
        v_academic_year_id,
        FALSE,  -- innovation unlocked
        TRUE,   -- entrepreneurship locked
        TRUE,   -- communication locked
        NOW(),
        NOW()
      )
      ON CONFLICT (school_id, grade_id, section_id, academic_year_id)
      DO NOTHING;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER after_school_section_insert
    AFTER INSERT ON school_section
    FOR EACH ROW
    EXECUTE FUNCTION trg_insert_b2b_lock_status();
  `);

  await knex.raw(`
    CREATE OR REPLACE FUNCTION trg_create_business_phase_lock_for_student()
    RETURNS TRIGGER AS $$
    DECLARE
      v_account_type TEXT;
    BEGIN
      -- Get student account type
      SELECT account_type
      INTO v_account_type
      FROM student
      WHERE id = NEW.student_id;

      IF v_account_type = 'b2b' THEN
        INSERT INTO business_phase_lock (
          student_id,
          academic_year_id,
          phase,
          is_locked,
          created_at,
          updated_at
        )
        SELECT
          NEW.student_id,
          NEW.academic_year_id,
          phase,
          is_locked,
          NOW(),
          NOW()
        FROM (
          SELECT
            'innovation'        AS phase,
            b.innovation        AS is_locked
          FROM b2b_lock_status b
          WHERE b.school_id = NEW.school_id
            AND b.grade_id = NEW.grade_id
            AND b.section_id = NEW.section_id
            AND b.academic_year_id = NEW.academic_year_id

          UNION ALL

          SELECT
            'entrepreneurship',
            b.entrepreneurship
          FROM b2b_lock_status b
          WHERE b.school_id = NEW.school_id
            AND b.grade_id = NEW.grade_id
            AND b.section_id = NEW.section_id
            AND b.academic_year_id = NEW.academic_year_id

          UNION ALL

          SELECT
            'communication',
            b.communication
          FROM b2b_lock_status b
          WHERE b.school_id = NEW.school_id
            AND b.grade_id = NEW.grade_id
            AND b.section_id = NEW.section_id
            AND b.academic_year_id = NEW.academic_year_id
        ) AS derived
        ON CONFLICT (student_id, academic_year_id, phase)
        DO NOTHING;

      ELSIF v_account_type = 'b2c' THEN
        INSERT INTO business_phase_lock (
          student_id,
          academic_year_id,
          phase,
          is_locked,
          created_at,
          updated_at
        )
        SELECT
          NEW.student_id,
          NEW.academic_year_id,
          d.phase,
          d.is_locked,
          NOW(),
          NOW()
        FROM b2c_lock_default d
        ON CONFLICT (student_id, academic_year_id, phase)
        DO NOTHING;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
`);

  await knex.raw(`
    CREATE TRIGGER after_enrollment_insert_business_phase_lock
    AFTER INSERT ON enrollment
    FOR EACH ROW
    EXECUTE FUNCTION trg_create_business_phase_lock_for_student();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TRIGGER IF EXISTS after_school_section_insert ON school_section`);
  await knex.raw(`DROP FUNCTION IF EXISTS trg_insert_b2b_lock_status`);
  await knex.raw(`DROP TRIGGER IF EXISTS after_enrollment_insert_business_phase_lock ON enrollment`);
  await knex.raw(`DROP FUNCTION IF EXISTS trg_create_business_phase_lock_for_student`);
  await knex.schema.dropTableIfExists('b2b_lock_status');
  await knex.schema.dropTableIfExists('b2c_lock_default');
}
