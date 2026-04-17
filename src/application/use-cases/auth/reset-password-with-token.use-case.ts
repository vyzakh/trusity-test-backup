import { UserAccountRepository } from '@infrastructure/database';
import { BadRequestException } from '@shared/execeptions';
import { genTimestamp, getTimestampStatus, hashPassword } from '@shared/utils';

interface ResetPasswordWithTokenUseCaseInput {
  data: { token: string; password: string };
}

export class ResetPasswordWithTokenUseCase {
  constructor(private readonly dependencies: { userAccountRepo: UserAccountRepository }) {}

  async execute(input: ResetPasswordWithTokenUseCaseInput) {
    const { userAccountRepo } = this.dependencies;
    const { data } = input;

    const userAccount = await userAccountRepo.getUserAccount({ passwordResetToken: data.token });
    if (!userAccount) {
      throw new BadRequestException('The password reset link you used is no longer valid. Please request a new link to reset your password.');
    }

    const passwordResetTokenStatus = getTimestampStatus(userAccount.passwordResetTokenExpAt);

    if (!passwordResetTokenStatus.isValid || !passwordResetTokenStatus.isFuture) {
      throw new BadRequestException('The password reset link you used is no longer valid. Please request a new link to reset your password.');
    }

    const password = hashPassword(data.password);

    await userAccountRepo.updateUserAccount({
      userAccountId: userAccount.id,
      passwordResetToken: null,
      passwordResetTokenExpAt: null,
      updatedAt: genTimestamp().iso,
    });
    await userAccountRepo.updateUserAuth({
      userAccountId: userAccount.id,
      passwordSalt: password.salt,
      passwordHash: password.hash,
      updatedAt: genTimestamp().iso,
    });
  }
}
