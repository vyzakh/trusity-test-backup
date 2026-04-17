import { isDefined } from '@shared/utils';

export class SchoolGradeMapper {
  static toEntity(row: any) {
    return {
      id: row.id,
      grade: row.grade,
      schoolGradeId: row.school_grade_id,
      schoolId: row.school_id,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }

  static toRow(input: any) {
    return {
      school_id: input.schoolId,
      grade_id: input.gradeId,
    };
  }

  static toPartialRow(input: any) {
    const row = {};

    if (isDefined(input.gradeId)) {
      row['grade_id'] = input.gradeId;
    }
    if (isDefined(input.updatedAt)) {
      row['updated_at'] = input.updatedAt;
    }

    return row;
  }
}

export class SchoolGradeSectionMapper {
  static toUpperCaseRow(row: any) {
    return {
      id: row.id,
      schoolId: row.school_id,
      schoolGradeId: row.school_grade_id,
      sectionId: row.section_id,
    };
  }

  static toEntity(row: any) {
    return {
      id: row.id,
      section: row.section,
      schoolId: row.school_id,
      schoolGradeSectionId: row.school_grade_section_id,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }

  static toRow(input: any) {
    return {
      school_id: input.schoolId,
      school_grade_id: input.schoolGradeId,
      section_id: input.sectionId,
    };
  }

  static toRowList(inputs: any[]) {
    return inputs.map(this.toRow);
  }
}

export class SchoolAddressMapper {
  static toEntity(row: any) {
    return {
      ...(row.country_id && {
        country: {
          id: row.country_id,
          name: row.country_name,
          emoji: row.country_emoji,
        },
      }),
      ...(row.state_id && {
        state: {
          id: row.state_id,
          name: row.state_name,
        },
      }),
      ...(row.city_id && {
        city: {
          id: row.city_id,
          name: row.city_name,
        },
      }),
      streetAddressLine1: row.street_address_line1,
      streetAddressLine2: row.street_address_line2,
      postalCode: row.postal_code,
      contactNumber: row.contact_number,
    };
  }

  static toRow(input: any) {
    const row: Record<string, any> = {
      school_id: input.schoolId,
    };

    if (isDefined(input.countryId)) {
      row.country_id = input.countryId;
    }
    if (isDefined(input.streetAddressLine1)) {
      row.street_address_line1 = input.streetAddressLine1;
    }
    if (isDefined(input.streetAddressLine2)) {
      row.street_address_line2 = input.streetAddressLine2;
    }
    if (isDefined(input.cityId)) {
      row.city_id = input.cityId;
    }
    if (isDefined(input.stateId)) {
      row.state_id = input.stateId;
    }
    if (isDefined(input.postalCode)) {
      row.postal_code = input.postalCode;
    }
    if (isDefined(input.contactNumber)) {
      row.contact_number = input.contactNumber;
    }
    if (isDefined(input.updatedAt)) {
      row.updated_at = input.updatedAt;
    }

    return row;
  }
}

export class SchoolContactMapper {
  static toEntity(row: any) {
    return {
      name: row.name,
      contactNumber: row.contact_number,
      email: row.email,
    };
  }

  static toRow(input: any) {
    const row: Record<string, any> = {
      school_id: input.schoolId,
    };

    if (isDefined(input.name)) {
      row.name = input.name;
    }
    if (isDefined(input.contactNumber)) {
      row.contact_number = input.contactNumber;
    }
    if (isDefined(input.email)) {
      row.email = input.email;
    }
    if (isDefined(input.updatedAt)) {
      row.updated_at = input.updatedAt;
    }

    return row;
  }
}

export class SchoolLicenseMapper {
  static toEntity(row: any) {
    return {
      totalLicense: row.total_license,
      usedLicense: row.used_license,
    };
  }

  static toRow(input: any) {
    const row: Record<string, any> = {
      school_id: input.schoolId,
    };

    if (isDefined(input.totalLicense)) {
      row.total_license = input.totalLicense;
    }
    if (isDefined(input.usedLicense)) {
      row.used_license = input.usedLicense;
    }
    if (isDefined(input.updatedAt)) {
      row.updated_at = input.updatedAt;
    }

    return row;
  }
}

export class SchoolCurriculumMapper {
  static toEntity(row: any) {
    return {
      id: row.id,
      name: row.name,
      allowCustom: row.allow_custom,
      otherName: row.other_name,
    };
  }

  static toEntityList(rows: any[]) {
    return rows.map(this.toEntity);
  }

  static toRow(input: any) {
    return {
      school_id: input.schoolId,
      curriculum_id: input.curriculumId,
      name: input.curriculumName,
    };
  }

  static toRowList(inputs: any[]) {
    return inputs.map(this.toRow);
  }
}

export class SchoolMapper {
  static toSchool(row: any) {
    return {
      id: row.id,
      name: row.name,
      accountType: row.account_type,
      totalLicense: row.total_license,
      licenseExpiry: row.license_expiry,
      currentAYId: row.current_ay_id,
      academicBaseYear: row.academic_base_year,
      academicStartMonth: row.academic_start_month,
      academicEndMonth: row.academic_end_month,
      promotionStartMonth: row.promotion_start_month,
      promotionStartDay: row.promotion_start_day,
      address: {
        streetAddressLine1: row.street_address_line1,
        streetAddressLine2: row.street_address_line2,
        postalCode: row.postal_code,
        contactNumber: row.address_contact_number,
        countryId: row.country_id,
        stateId: row.state_id,
        cityId: row.city_id,
      },
      principalName: row.principal_name,
      contact: {
        name: row.poc_name,
        email: row.poc_email,
        contactNumber: row.poc_contact_number,
      },
      logoUrl: row.logo_url,
      lastPromotionYear: row.last_promotion_year,
      promotionErrors: row.promotion_errors,
      promotionCompletedAt: row.promotion_completed_at,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static toSchools(rows: any[]) {
    return rows.map(this.toSchool);
  }

  static toAcademicYear(row: any) {
    return {
      id: row.id,
      schoolId: row.school_id,
      startYear: row.start_year,
      endYear: row.end_year,
      startDate: row.start_date,
      endDate: row.end_date,
    };
  }

  static toAcademicYears(rows: any) {
    return rows.map(this.toAcademicYear);
  }
}
