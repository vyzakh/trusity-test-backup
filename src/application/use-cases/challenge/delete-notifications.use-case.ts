import { ICurrentUser } from '@core/types';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { NotFoundException } from '@shared/execeptions';

interface Input {
  user: ICurrentUser;
  ids: string[];
}

export class DeleteNotification {
  constructor(private readonly dependencies: { notificationRepo: NotificationRepository }) {}

  async execute(input: Input) {
    const { notificationRepo } = this.dependencies;

    const deleteResult = await notificationRepo.deleteNotification({
      ids: input.ids,
      userId: input.user.userAccountId,
    });
    if (!deleteResult) {
      throw new NotFoundException('We can’t find the notifications that match the ids you provided');
    }
  }
}
