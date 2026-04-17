import { Question, QuestionSet } from 'nest-commander';

@QuestionSet({ name: 'setup' })
export class SetupQuestions {
  @Question({
    message: 'Enter super admin name:',
    name: 'name',
    default: 'Trusity Admin',
  })
  parseName(input: string) {
    return input.trim();
  }

  @Question({
    message: 'Enter super admin email:',
    name: 'email',
    default: 'admin@trusity.com',
  })
  parseEmail(input: string) {
    return input.toLowerCase().trim();
  }

  @Question({
    message: 'Enter super admin password:',
    name: 'password',
    type: 'password',
    mask: '*',
    default: 'Trusity@7376',
  })
  parsePassword(input: string) {
    return input;
  }
}
