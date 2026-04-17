import { Knex } from 'knex';

const completedBusinessExpression = `
  business_progress_status.problem_statement = true AND
  business_progress_status.market_research = true AND
  business_progress_status.market_fit = true AND
  business_progress_status.prototype = true AND
  business_progress_status.financial_planning = true AND
  business_progress_status.branding = true AND
  business_progress_status.marketing = true AND
  business_progress_status.revenue_model = true AND
  business_progress_status.capex = true AND
  business_progress_status.opex = true AND
  business_progress_status.business_model = true AND
  business_progress_status.pitch_script = true AND
  business_progress_status.pitch_deck = true AND
  business_progress_status.pitch_feedback = true AND
  business_progress_status.investment = true AND
  business_progress_status.launch = true
`;

export class BusinessPhaseLockRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async getBusinessPhaseLock(input: Record<string, any>) {
    return this.db('business_phase_lock')
      .where({
        student_id: input.studentId,
        academic_year_id: input.academicYearId,
        phase: input.phase,
      })
      .first();
  }

  async unlockB2BClassPhases(input: Record<string, any>) {
    // console.log(input);
    const { schoolId, gradeId, sectionId, academicYearId, phases } = input;

    const incoming = {
      innovation: true,
      entrepreneurship: true,
      communication: true,
    };

    for (const p of phases) {
      incoming[p.phase] = p.is_locked;
    }

    await this.db('b2b_lock_status')
      .insert({
        school_id: schoolId,
        grade_id: gradeId,
        section_id: sectionId,
        academic_year_id: academicYearId,
        ...incoming,
      })
      .onConflict(['school_id', 'grade_id', 'section_id', 'academic_year_id'])
      .merge({
        innovation: this.db.raw('b2b_lock_status.innovation AND excluded.innovation'),
        entrepreneurship: this.db.raw('b2b_lock_status.entrepreneurship AND excluded.entrepreneurship'),
        communication: this.db.raw('b2b_lock_status.communication AND excluded.communication'),
        updated_at: this.db.fn.now(),
      });
  }

  async syncStudentsFromB2BClass(input: Record<string, any>) {
    const { schoolId, gradeId, sectionId, academicYearId, studentIds } = input;

    if (!studentIds.length) return;

    const classLock = await this.db('b2b_lock_status')
      .select('innovation', 'entrepreneurship', 'communication')
      .where({
        school_id: schoolId,
        grade_id: gradeId,
        section_id: sectionId,
        academic_year_id: academicYearId,
      })
      .first();

    if (!classLock) return;

    const rows: Record<string, any>[] = [];

    for (const studentId of studentIds) {
      rows.push(
        {
          student_id: studentId,
          academic_year_id: academicYearId,
          phase: 'innovation',
          is_locked: classLock.innovation,
        },
        {
          student_id: studentId,
          academic_year_id: academicYearId,
          phase: 'entrepreneurship',
          is_locked: classLock.entrepreneurship,
        },
        {
          student_id: studentId,
          academic_year_id: academicYearId,
          phase: 'communication',
          is_locked: classLock.communication,
        },
      );
    }

    await this.db('business_phase_lock')
      .insert(rows)
      .onConflict(['student_id', 'academic_year_id', 'phase'])
      .merge({
        is_locked: this.db.raw('business_phase_lock.is_locked AND excluded.is_locked'),
        updated_at: this.db.fn.now(),
      });
  }

  async toggleB2CStudentPhaseLocks(input: Record<string, any>) {
    const { studentIds, academicYearId, businessPhase } = input;

    if (!studentIds.length || !businessPhase.length) return;

    const rows: Record<string, any>[] = [];

    for (const studentId of studentIds) {
      for (const phase of businessPhase) {
        rows.push({
          student_id: studentId,
          academic_year_id: academicYearId,
          phase: phase.phase,
          is_locked: phase.is_locked,
        });
      }
    }

    await this.db('business_phase_lock')
      .insert(rows)
      .onConflict(['student_id', 'academic_year_id', 'phase'])
      .merge({
        is_locked: this.db.ref('excluded.is_locked'),
        updated_at: this.db.fn.now(),
      });
  }

  async initializeClassPhaseLocks(input: Record<string, any>) {
    await this.db('b2b_lock_status')
      .insert({
        school_id: input.schoolId,
        grade_id: input.gradeId,
        section_id: input.sectionId,
        academic_year_id: input.academicYearId,
        innovation: false,
        entrepreneurship: true,
        communication: true,
      })
      .onConflict(['school_id', 'grade_id', 'section_id', 'academic_year_id'])
      .ignore();
  }

  async upsertBusinessPhaseLockFromClass(input: Record<string, any>) {
    const knex = this.db;
    const row = await knex('enrollment as e')
      .join('b2b_lock_status as b2b', function () {
        this.on('b2b.school_id', '=', 'e.school_id')
          .andOn('b2b.grade_id', '=', 'e.grade_id')
          .andOn('b2b.section_id', '=', 'e.section_id')
          .andOn('b2b.academic_year_id', '=', 'e.academic_year_id');
      })
      .where('e.student_id', input.studentId)
      .where('e.academic_year_id', input.academicYearId)
      .select('e.student_id', 'e.academic_year_id', 'b2b.innovation', 'b2b.entrepreneurship', 'b2b.communication')
      .first();

    if (!row) {
      throw new Error('Class lock status not found for student');
    }

    const lockRows = [
      {
        student_id: row.student_id,
        academic_year_id: row.academic_year_id,
        phase: 'innovation',
        is_locked: row.innovation,
      },
      {
        student_id: row.student_id,
        academic_year_id: row.academic_year_id,
        phase: 'entrepreneurship',
        is_locked: row.entrepreneurship,
      },
      {
        student_id: row.student_id,
        academic_year_id: row.academic_year_id,
        phase: 'communication',
        is_locked: row.communication,
      },
    ];
    await knex('business_phase_lock')
      .insert(lockRows)
      .onConflict(['student_id', 'academic_year_id', 'phase'])
      .merge({
        is_locked: knex.ref('excluded.is_locked'),
        updated_at: knex.fn.now(),
      });
  }

  async upsertBusinessPhaseLockFromB2CDefault(input: Record<string, any>) {
    const knex = this.db;

    const defaults = await knex('b2c_lock_default').select('phase', 'is_locked');

    const rows = defaults.map((d) => ({
      student_id: input.studentId,
      academic_year_id: input.academicYearId,
      phase: d.phase,
      is_locked: d.is_locked,
    }));

    await knex('business_phase_lock')
      .insert(rows)
      .onConflict(['student_id', 'academic_year_id', 'phase'])
      .merge({
        is_locked: knex.ref('excluded.is_locked'),
        updated_at: knex.fn.now(),
      });
  }

  async getPhaseLockStatusForClass(input: Record<string, any>) {
    const knex = this.db;
    return await knex('b2b_lock_status as bls')
      .where({
        school_id: input.schoolId,
        grade_id: input.gradeId,
        section_id: input.sectionId,
      })
      .modify((q) => {
        if (input.academicYearId) {
          q.where('academic_year_id', input.academicYearId);
        } else {
          q.where('academic_year_id', knex.raw('(SELECT current_ay_id FROM school WHERE id = ?)', [input.schoolId]));
        }
      })
      .first()
      .then((row) =>
        row
          ? [
              { phase: 'innovation', is_locked: row.innovation },
              { phase: 'entrepreneurship', is_locked: row.entrepreneurship },
              { phase: 'communication', is_locked: row.communication },
            ]
          : [],
      );
  }

  async getStudentPhaseLockStatus(input: Record<string, any>) {
    const knex = this.db;

    const result = await knex('enrollment as e')
      .join('business_phase_lock as bpl', function () {
        this.on('bpl.student_id', '=', 'e.student_id');

        if (input.academicYearId) {
          this.on('bpl.academic_year_id', '=', knex.raw('?', [input.academicYearId]));
        } else {
          this.on('bpl.academic_year_id', '=', 'e.academic_year_id');
        }
      })
      .leftJoin('enrollment_status as enrs', 'enrs.id', 'e.enrollment_status_id')
      .modify((q) => {
        if (input.businessId) {
          q.join('business_progress_status', function () {
            this.on('business_progress_status.student_id', '=', 'e.student_id').andOn('business_progress_status.business_id', '=', knex.raw('?', [input.businessId]));
          });
        }
      })
      .modify((q) => {
        if (input.studentId) q.where('e.student_id', input.studentId);
        if (input.schoolId) q.where('e.school_id', input.schoolId);
        if (input.studentIds?.length) q.whereIn('e.student_id', input.studentIds);
        if (input.academicYearId) q.where('e.academic_year_id', input.academicYearId);
        if (input.enrollmentStatus) q.where('enrs.code', input.enrollmentStatus);
      })
      .groupBy('bpl.phase')
      .select([
        'bpl.phase',
        input.businessId
          ? knex.raw(
              `
            CASE
              WHEN BOOL_AND(${completedBusinessExpression})
                THEN false
              ELSE BOOL_OR(bpl.is_locked)
            END AS is_locked
          `,
            )
          : knex.raw('BOOL_OR(bpl.is_locked) AS is_locked'),
        knex.raw('COUNT(DISTINCT bpl.is_locked) AS lock_variants'),
      ]);
    return result;
  }
}
