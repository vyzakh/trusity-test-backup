import { z } from "zod";

export const SaveBusinessModelSchema = z.object({
  businessId:z.string().regex(/^\d+$/),
  keyPartners: z.string().min(1, "Key Partners is required"),
  customerSegments: z.string().min(1, "Customer Segments is required"),
  valuePropositions: z.string().min(1, "Value Propositions is required"),
  channels: z.string().min(1, "Channels is required"),
  customerRelationships: z.string().min(1, "Customer Relationships is required"),
  revenueStreams: z.string().min(1, "Revenue Streams is required"),
  keyResources: z.string().min(1, "Key Resources is required"),
  keyActivities: z.string().min(1, "Key Activities is required"),
  costStructure: z.string().min(1, "Cost Structure is required"),
  targetMarketSize: z.string().min(1, "Target Market Size is required"),
  goalsAndKPIs: z.string().min(1, "Goals and KPIs is required"),
});

