export class UserAccount {
  public readonly id: string;
  public email: string;
  public scope: string;

  public createdAt: Date;
  public updatedAt: Date;

  constructor(props: UserAccount) {
    this.id = props.id;
    this.email = props.email;
    this.scope = props.scope;

    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
