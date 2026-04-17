import { Knex } from 'knex';

export class SessionRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async clearSession(input: Record<string, any>) {
    const query = this.db('sessions');

    query.modify((qb) => {
      if (input.schoolId) {
        qb.whereRaw("sess->'passport'->'user'->>'schoolId' = ?", [input.schoolId]).del();
      }

      if (input.userAccountId) {
        qb.whereRaw("sess->'passport'->'user'->>'userAccountId' = ?", [input.userAccountId]).del();
      }
    });

    await query;
  }

  async updateUserProfileInSessions(input: {
    userId: string;
    userScope: string;
    updates: {
      name?: string;
      avatarUrl?: string | null;
      email?: string;
      contactNumber?: string;
      permissions?: string[];
    };
  }): Promise<number> {
    const { userId, userScope, updates } = input;

    const sessions = await this.db('sessions')
      .select('sid', 'sess')
      .whereRaw("sess->'passport'->'user'->>'id' = ?", [userId])
      .whereRaw("sess->'passport'->'user'->>'scope' = ?", [userScope]);

    let updatedCount = 0;

    for (const session of sessions) {
      if (updates.name !== undefined) {
        session.sess.passport.user.name = updates.name;
      }
      if (updates.avatarUrl !== undefined) {
        session.sess.passport.user.avatarUrl = updates.avatarUrl;
      }
      if (updates.name !== undefined) {
        session.sess.passport.user.name = updates.name;
      }
      if (updates.contactNumber !== undefined) {
        session.sess.passport.user.contactNumber = updates.contactNumber;
      }
      if (updates.permissions !== undefined) {
        session.sess.passport.user.permissions = updates.permissions;
      }
      session.sess.passport.user.updatedAt = new Date().toISOString();

      await this.db('sessions').where('sid', session.sid).update({ sess: session.sess });

      updatedCount++;
    }

    return updatedCount;
  }

  async updateTeacherSessions(input: Record<string, any>) {
    const query = this.db('sessions');

    query.modify((qb) => {
      if (input.schoolId) {
        qb.whereRaw("sess->'passport'->'user'->>'schoolId' = ?", [input.schoolId]);
      }
      if (input.userAccountId) {
        qb.whereRaw("sess->'passport'->'user'->>'userAccountId' = ?", [input.userAccountId]);
      }
      if (input.teacherId) {
        qb.whereRaw("sess->'passport'->'user'->>'id' = ?", [input.teacherId]);
      }
      if (input.classAssignments) {
        qb.update({
          sess: this.db.raw(`jsonb_set(sess::jsonb, '{passport,user,classAssignments}', ?)`, [JSON.stringify(input.classAssignments)]),
        });
      }
    });

    await query;
  }
}
