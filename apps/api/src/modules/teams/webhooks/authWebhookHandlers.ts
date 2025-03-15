import { Context } from 'hono';
import { Env } from '../../../types';
import { formatResponse, formatError } from '../../../utils/api-response';
import { getTeamsContainer } from '../di/container';
import { 
  UserCreatedWebhookSchema, 
  UserUpdatedWebhookSchema, 
  UserDeletedWebhookSchema 
} from '../models/webhookSchemas';
import { TeamsWebhookService } from '../services/webhookService';

/**
 * Validate webhook signature
 * 
 * This is a simple implementation. In production, you would:
 * 1. Use a more robust signature verification
 * 2. Use environment variables for secrets
 * 3. Have more comprehensive error handling
 */
async function validateWebhookSignature(c: Context<{ Bindings: Env }>, body: string): Promise<boolean> {
  // Get signature from header
  const signature = c.req.header('X-Webhook-Signature');
  
  // If no signature, fail validation
  if (!signature) {
    return false;
  }
  
  // Get webhook secret from environment
  const secret = c.env.WEBHOOK_SECRET || 'dev-webhook-secret';
  
  // In a production environment, you would use a more robust signature verification
  // For simplicity in this example, we're using a basic string comparison
  // This should be replaced with a proper cryptographic comparison in production
  
  // Mock implementation for demonstration purposes
  const calculatedSignature = `sha256=${secret}-${body.slice(0, 10)}`;
  
  // Simple comparison - in production use a constant-time comparison
  return signature === calculatedSignature;
}

/**
 * Handle user created webhook from auth module
 * 
 * - Creates a new team for the user
 * - Triggers a team created event for the subscriptions module
 */
export async function handleUserCreated(c: Context<{ Bindings: Env }>) {
  try {
    // Get request body as text for signature verification
    const bodyText = await c.req.text();
    
    // Verify webhook signature (optional in dev, required in prod)
    if (c.env.ENVIRONMENT === 'production') {
      const isValid = await validateWebhookSignature(c, bodyText);
      if (!isValid) {
        return formatError(c, 'Invalid webhook signature', 'InvalidSignature', 401);
      }
    }
    
    // Parse and validate webhook payload
    const payload = UserCreatedWebhookSchema.safeParse(JSON.parse(bodyText));
    
    if (!payload.success) {
      return formatError(c, 'Invalid webhook payload', 'ValidationError', 400);
    }
    
    const { user } = payload.data;
    
    // Get container with services
    const container = getTeamsContainer(c.env);
    
    // Create a new team for the user
    const team = await container.teamService.createTeam(user.id, {
      name: `${user.name ? user.name : 'New'}'s Team`
    });
    
    // The team service automatically adds the user as owner, so no need to call addTeamMember
    
    // Emit team created event instead of directly interacting with subscriptions
    const teamsWebhookService = new TeamsWebhookService(c.env);
    await teamsWebhookService.triggerTeamCreated({
      id: team.id,
      name: team.name,
      userId: user.id, // Owner ID
      createdAt: Date.now()
    });
    
    return formatResponse(c, {
      message: 'User onboarded successfully',
      team: {
        id: team.id,
        name: team.name
      }
    });
  } catch (error) {
    console.error('Error handling user.created webhook:', error);
    return formatError(c, 'Error processing webhook', 'InternalServerError', 500);
  }
}

/**
 * Handle user updated webhook from auth module
 * 
 * - Updates team member information when user details change
 */
export async function handleUserUpdated(c: Context<{ Bindings: Env }>) {
  try {
    // Get request body as text for signature verification
    const bodyText = await c.req.text();
    
    // Verify webhook signature (optional in dev, required in prod)
    if (c.env.ENVIRONMENT === 'production') {
      const isValid = await validateWebhookSignature(c, bodyText);
      if (!isValid) {
        return formatError(c, 'Invalid webhook signature', 'InvalidSignature', 401);
      }
    }
    
    // Parse and validate webhook payload
    const payload = UserUpdatedWebhookSchema.safeParse(JSON.parse(bodyText));
    
    if (!payload.success) {
      return formatError(c, 'Invalid webhook payload', 'ValidationError', 400);
    }
    
    const { user } = payload.data;
    
    // Get container with services
    const container = getTeamsContainer(c.env);
    
    // Find all teams where the user is a member
    // This would typically be a more direct query in a real implementation
    const teams = await container.teamService.getUserTeams(user.id);
    
    // For each team, update the member's information
    // In a real implementation, this would be a more optimized bulk operation
    for (const team of teams) {
      const members = await container.teamService.getTeamMembersWithUserInfo(team.id, user.id);
      const userMember = members.find(member => member.userId === user.id);
      
      if (userMember) {
        // No need to update anything here as the user information is fetched 
        // from the user table when needed. The data is already updated in the 
        // auth system's user table.
      }
    }
    
    return formatResponse(c, {
      message: 'User information synchronized successfully'
    });
  } catch (error) {
    console.error('Error handling user.updated webhook:', error);
    return formatError(c, 'Error processing webhook', 'InternalServerError', 500);
  }
}

/**
 * Handle user deleted webhook from auth module
 * 
 * - Transfers team ownership if possible, or archives the team
 * - Cancels subscriptions associated with the user
 */
export async function handleUserDeleted(c: Context<{ Bindings: Env }>) {
  try {
    // Get request body as text for signature verification
    const bodyText = await c.req.text();
    
    // Verify webhook signature (optional in dev, required in prod)
    if (c.env.ENVIRONMENT === 'production') {
      const isValid = await validateWebhookSignature(c, bodyText);
      if (!isValid) {
        return formatError(c, 'Invalid webhook signature', 'InvalidSignature', 401);
      }
    }
    
    // Parse and validate webhook payload
    const payload = UserDeletedWebhookSchema.safeParse(JSON.parse(bodyText));
    
    if (!payload.success) {
      return formatError(c, 'Invalid webhook payload', 'ValidationError', 400);
    }
    
    const { user } = payload.data;
    
    // Get container with services
    const container = getTeamsContainer(c.env);
    
    // Find all teams where the user is a member
    const teams = await container.teamService.getUserTeams(user.id);
    
    // Process each team
    for (const team of teams) {
      // Get team members
      const members = await container.teamService.getTeamMembersWithUserInfo(team.id, user.id);
      const userMember = members.find(member => member.userId === user.id);
      
      if (userMember) {
        // If user is the owner, try to transfer ownership
        if (userMember.role === 'owner') {
          // Find another admin or member to transfer ownership to
          const potentialNewOwner = members.find(member => 
            member.userId !== user.id && 
            (member.role === 'admin' || member.role === 'member')
          );
          
          if (potentialNewOwner) {
            // Transfer ownership
            await container.teamMemberService.updateTeamMember(
              team.id,
              potentialNewOwner.id,
              user.id, // Still using the deleted user's ID for authorization
              { role: 'owner' }
            );
            
            // Downgrade the current owner
            await container.teamMemberService.updateTeamMember(
              team.id,
              userMember.id,
              user.id,
              { role: 'member' }
            );
            
            // Remove the user from the team
            await container.teamMemberService.removeTeamMember(
              team.id,
              userMember.id,
              potentialNewOwner.userId // Use new owner's ID for authorization
            );
          } else {
            // No one to transfer to, archive or delete the team
            // In this example, we'll delete the team, but archiving might be better
            await container.teamService.deleteTeam(team.id, user.id);
            
            // Note: We no longer need to directly interact with subscriptions here
            // The subscriptions module should handle team deletion events
          }
        } else {
          // User is not the owner, just remove them from the team
          await container.teamMemberService.removeTeamMember(
            team.id,
            userMember.id,
            user.id
          );
        }
      }
    }
    
    return formatResponse(c, {
      message: 'User cleanup completed successfully'
    });
  } catch (error) {
    console.error('Error handling user.deleted webhook:', error);
    return formatError(c, 'Error processing webhook', 'InternalServerError', 500);
  }
} 