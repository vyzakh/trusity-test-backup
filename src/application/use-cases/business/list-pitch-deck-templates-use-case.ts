import { PitchDeckTemplatesRepository } from "@infrastructure/database";

export class ListPitchDeckTemplatesUseCase {
  constructor(private readonly dependencies: { pitchDeckRepo: PitchDeckTemplatesRepository }) {}

  async execute() {
    const { pitchDeckRepo } = this.dependencies;

    return await pitchDeckRepo.findAllPitchDeckTemplates();
    
  }
}