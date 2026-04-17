import { NotificationMapper } from '@application/mappers/notification.mapper';
import { applyOffsetPagination } from '@shared/utils';
import { Knex } from 'knex';

export class NotificationRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async createNotification(input: Record<string, any>) {
    const [row] = await this.db('notification').insert(
      {
        notification_type_id: input.notificationTypeId,
        title: input.title,
        message: input.message,
        data: input.data,
        created_by: input.createdBy,
      },
      '*',
    );

    return NotificationMapper.toNotification(row);
  }

  async createNotifications(inputs: Record<string, any>[]) {
    const rowsToInsert = inputs.map((item) => ({
      notification_type_id: item.notificationTypeId,
      title: item.title,
      message: item.message,
      data: item.data,
      created_by: item.createdBy,
    }));

    const rows = await this.db.batchInsert('notification', rowsToInsert, 500).returning('*');
    return rows.map(NotificationMapper.toNotification);
  }

  async getNotificationsByUser(input: Record<string, any>) {
    const query = this.db('notification_recipient as nr')
      .join('notification as n', 'nr.notification_id', 'n.id')
      .where('nr.user_account_id', input.accountId)
      .select('n.id', 'n.title', 'n.message', 'n.data', 'n.created_by', 'n.created_at', 'n.updated_at', 'nr.read_at')
      .orderBy('n.created_at', 'desc');

    applyOffsetPagination(query, input.offset, input.limit, 100);

    const rows = await query;
    return rows.map((row) => {
      return {
        id: row.id,
        title: row.title,
        message: row.message,
        data: row.data,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        readAt: row.read_at,
      };
    });
  }

  async getNotificationsCount(input: { accountId: string }) {
    const result = await this.db('notification_recipient')
      .where('user_account_id', input.accountId)
      .select(
        this.db.raw(`
      COUNT(*) as total,
      SUM(CASE WHEN read_at IS NOT NULL THEN 1 ELSE 0 END) as read_count,
      SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) as unread_count
    `),
      )
      .first();

    return {
      total: result.total,
      read: result.read_count,
      unread: result.unread_count,
    };
  }

  async updateReadNotification(input: { read: string[]; accountId: string }) {
    const updatedRows = await this.db('notification_recipient').where('user_account_id', input.accountId).whereIn('notification_id', input.read).update({
      read_at: this.db.fn.now(),
    });

    return updatedRows;
  }

  async crateNotificationRecipients(inputs: Record<string, any>[]) {
    const data = inputs.map((input) => ({
      notification_id: input.notificationId,
      user_account_id: input.userAccountId,
    }));

    await this.db.batchInsert('notification_recipient', data, 500);
  }

  async deleteNotification(input: Record<string, any>) {
    const deletedCount = await this.db('notification_recipient').whereIn('notification_id', input.ids).andWhere('user_account_id', input.userId).del();
    return deletedCount > 0;
  }

  async getNotificationType(input: Record<string, any>) {
    const query = this.db('notification_type').select('*');

    query.where((qb) => {
      if (input.notificationType) {
        qb.where({ code: input.notificationType });
      }
    });

    const [row] = await query;

    if (!row) return null;

    return NotificationMapper.toNotificationType(row);
  }
}
