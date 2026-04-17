import { ICurrentUser } from '@core/types';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';

interface Input {
  user: ICurrentUser;
}

export class GetNotificationCountUseCase {
  constructor(private readonly dependencies: { notificationRepo: NotificationRepository }) {}

  async execute(input: Input) {
    const { notificationRepo } = this.dependencies;
    const countResult = await notificationRepo.getNotificationsCount({
      accountId: input.user.userAccountId,
    });

    return { count: countResult.total, unreadCount: countResult.unread };
  }
}
