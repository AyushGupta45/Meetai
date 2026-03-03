import { z } from "zod";

export const agentsInsertSchema = z.object({
  name: z.string().min(1, { message: "Name is Required" }),
  instructions: z.string().min(1, { message: "Instructions are Required" }),
  credentialId: z.string().min(1, { message: "Credential is Required" }),
  voiceId: z.string(),
  template: z.string().optional(),
});

export type AgentsInsert = z.infer<typeof agentsInsertSchema>;

export const agentsUpdateSchema = agentsInsertSchema.extend({
  id: z.string().min(1, { message: "Id is Required" }),
});
