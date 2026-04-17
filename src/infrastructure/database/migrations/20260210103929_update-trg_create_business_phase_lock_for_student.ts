import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
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

        -- MISS CASE: create b2b_lock_status if not exists
        IF NOT EXISTS (
          SELECT 1
          FROM b2b_lock_status b
          WHERE b.school_id = NEW.school_id
            AND b.grade_id = NEW.grade_id
            AND b.section_id = NEW.section_id
            AND b.academic_year_id = NEW.academic_year_id
        ) THEN
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
            NEW.academic_year_id,
            FALSE,  -- innovation unlocked
            TRUE,   -- entrepreneurship locked
            TRUE,   -- communication locked
            NOW(),
            NOW()
          )
          ON CONFLICT (school_id, grade_id, section_id, academic_year_id)
          DO NOTHING;
        END IF;

        -- Now safely insert business_phase_lock
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
          SELECT 'innovation' AS phase, b.innovation AS is_locked
          FROM b2b_lock_status b
          WHERE b.school_id = NEW.school_id
            AND b.grade_id = NEW.grade_id
            AND b.section_id = NEW.section_id
            AND b.academic_year_id = NEW.academic_year_id

          UNION ALL
          SELECT 'entrepreneurship', b.entrepreneurship
          FROM b2b_lock_status b
          WHERE b.school_id = NEW.school_id
            AND b.grade_id = NEW.grade_id
            AND b.section_id = NEW.section_id
            AND b.academic_year_id = NEW.academic_year_id

          UNION ALL
          SELECT 'communication', b.communication
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
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TRIGGER IF EXISTS after_enrollment_insert_business_phase_lock
    ON enrollment;
  `);
  await knex.raw(`DROP FUNCTION IF EXISTS trg_create_business_phase_lock_for_student`);
}
