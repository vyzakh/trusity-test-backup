import { ICurrentUser } from '@core/types';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';

interface Input {
  user: ICurrentUser;
  pagination?: {
    limit?: number | null;
    offset?: number | null;
  };
}

export class GetNotificationsUseCase {
  constructor(private readonly dependencies: { notificationRepo: NotificationRepository }) {}

  async execute(input: Input) {
    const { notificationRepo } = this.dependencies;
    const userNotifications = await notificationRepo.getNotificationsByUser({
      accountId: input.user.userAccountId,
      offset: input.pagination?.offset,
      limit:input.pagination?.limit
    });
    if (!userNotifications || userNotifications.length === 0) {
      return []
    }
    return userNotifications;
  }
}
