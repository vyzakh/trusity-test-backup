import { Knex } from 'knex';

export class StudentPitchScriptRepository {
  constructor(private readonly db: Knex | Knex.Transaction) {}

  async createPitchScript(input: Record<string, any>) {
    const [pitchScript] = await this.db('pitch_assets').insert(
      {
        business_id: input.businessId,
        narrative: input.narrative,
        pitch_description: input.pitchDescription,
      },
      '*',
    );

    return {
      id: pitchScript.id,
      businessId: pitchScript.business_id,
      narrative: pitchScript.narrative,
      pitchDescription: pitchScript.pitch_description,
      createdAt: pitchScript.created_at,
      updatedAt: pitchScript.updated_at,
    };
  }

  async updatePitchScript(businessId: number, input: Record<string, any>) {
    const [pitchScript] = await this.db('pitch_assets')
      .where({ business_id: businessId })
      .update(
        input,
        '*',
      );

    if (!pitchScript) {
      return null;
    }
  
    return {
      id: pitchScript.id,
      businessId: pitchScript.business_id,
      narrative: pitchScript.narrative,
      aiGeneratedScript: pitchScript.ai_generated_script,
      pitchDescription: pitchScript.pitch_description,
      createdAt: pitchScript.created_at,
      updatedAt: pitchScript.updated_at,
    };
  }

   async getPitchScriptByBusinessId(businessId: number) {
    const pitchScript = await this.db('pitch_assets')
      .where({ business_id: businessId })
      .first();

    if (!pitchScript) {
      return null;
    }

    return {
      id: pitchScript.id,
      businessId: pitchScript.business_id,
      callToAction: pitchScript.call_to_action,
      narrative: pitchScript.narrative,
      pitchDescription: pitchScript.pitch_description,
      createdAt: pitchScript.created_at,
      updatedAt: pitchScript.updated_at,
    };
  }

}
