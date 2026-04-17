import { ICurrentUser } from '@core/types';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';

interface Input {
  user: ICurrentUser;
  read: string[];
}

export class UpdateReadNotifications {
  constructor(private readonly dependencies: { notificationRepo: NotificationRepository }) {}

  async execute(input: Input) {
    const { notificationRepo } = this.dependencies;

    const updatedRead = await notificationRepo.updateReadNotification({
      read: input.read,
      accountId: input.user.userAccountId,
    });

    return updatedRead === 0    
  }
}
