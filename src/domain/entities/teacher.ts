export class SchoolAddress {
  countryCode: string;
  streetAddressLine1?: string | null;
  streetAddressLine2?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  contactNumber?: string | null;

  constructor(props: SchoolAddress) {
    this.countryCode = props.countryCode;
    this.streetAddressLine1 = props.streetAddressLine1;
    this.streetAddressLine2 = props.streetAddressLine2;
    this.city = props.city;
    this.stateProvince = props.stateProvince;
    this.postalCode = props.postalCode;
    this.contactNumber = props.contactNumber;
  }
}

export class SchoolContact {
  name: string;
  contactNumber: string;
  email: string;

  constructor(props: SchoolContact) {
    this.name = props.name;
    this.contactNumber = props.contactNumber;
    this.email = props.email;
  }
}

export class SchoolLicense {
  totalLicense: number;
  usedLicense: number;

  constructor(props: SchoolLicense) {
    this.totalLicense = props.totalLicense;
    this.usedLicense = props.usedLicense;
  }
}

export class SchoolCarriculum {
  id: number;
  name: string;
  allowCustom: boolean;
  otherName?: string | null;

  constructor(props: SchoolCarriculum) {
    this.id = props.id;
    this.name = props.name;
    this.allowCustom = props.allowCustom;
    this.otherName = props.otherName;
  }
}

export class SchoolGrade {
  id: number;
  grade: string;
  schoolId: string;

  constructor(props: SchoolGrade) {
    this.id = props.id;
    this.grade = props.grade;
    this.schoolId = props.schoolId;
  }
}

export class SchoolGradeSection {
  id: number;
  gradeId: number;
  section: string;
  schoolId: string;

  constructor(props: SchoolGradeSection) {
    this.id = props.id;
    this.gradeId = props.gradeId;
    this.section = props.section;
    this.schoolId = props.schoolId;
  }
}

export class Teacher {
  public readonly id: string;
  public name: string;
  public email: string;
  public contactNumber: string;

  public createdAt: Date;
  public updatedAt: Date;

  constructor(props: Teacher) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.contactNumber = props.contactNumber;

    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
