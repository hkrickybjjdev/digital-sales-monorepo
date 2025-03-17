import { z } from 'zod';

// Team schema for validation
export const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Team member role enum
export const TeamRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer']);

// Team member schema for validation
export const teamMemberSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  userId: z.string(),
  role: TeamRoleSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Create team request schema
export const createTeamSchema = z.object({
  name: z.string().min(2).max(50),
});

// Update team request schema
export const updateTeamSchema = z.object({
  name: z.string().min(2).max(50).optional(),
});

// Add team member request schema
export const addTeamMemberSchema = z.object({
  userId: z.string(),
  role: TeamRoleSchema,
});

// Update team member request schema
export const updateTeamMemberSchema = z.object({
  role: TeamRoleSchema,
});

// Types derived from schemas
export type Team = z.infer<typeof teamSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
export type TeamRole = z.infer<typeof TeamRoleSchema>;
export type CreateTeamRequest = z.infer<typeof createTeamSchema>;
export type UpdateTeamRequest = z.infer<typeof updateTeamSchema>;
export type AddTeamMemberRequest = z.infer<typeof addTeamMemberSchema>;
export type UpdateTeamMemberRequest = z.infer<typeof updateTeamMemberSchema>;

// Team response types
export interface TeamWithMemberCount extends Team {
  memberCount: number;
}

// Team member response types
export interface TeamMemberWithUser extends TeamMember {
  user: {
    id: string;
    name: string;
    email: string;
  };
}
