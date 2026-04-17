export class NotificationMapper {
  static toNotificationType(row: any) {
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      template: row.template,
    };
  }

  static toNotification(row: any) {
    return {
      id: row.id,
      notificationTypeId: row.notification_type_id,
      title: row.title,
      message: row.message,
      data: row.data,
      createdBy: row.created_by,
    };
  }

  static toNotifications(rows: any[]) {
    return rows.map((row) => this.toNotification(row));
  }
}
