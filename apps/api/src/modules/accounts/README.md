# Accounts Module

The Accounts module manages organization, group, role, and subscription functionality within the digital sales platform.

## Architecture

This module follows a clean architecture pattern with the following layers:

1. **Models Layer**
   - Defines data structures using Zod schemas for validation
   - Provides type definitions derived from schemas
   - Located in `models/schemas.ts`

2. **Repository Layer**
   - Handles database operations
   - Provides data access abstraction
   - Implements CRUD operations for each entity
   - Uses `D1Database` via dependency injection in the constructor
   - Repository classes follow this pattern:
     ```typescript
     export class EntityRepository {
       constructor(private readonly db: D1Database) {}
       
       // Repository methods...
     }
     ```
   - Files: 
     - `organizationRepository.ts`
     - `groupRepository.ts`
     - `roleRepository.ts`
     - `userRoleRepository.ts` 
     - `planRepository.ts`
     - `subscriptionRepository.ts`

3. **Service Layer**
   - Implements business logic
   - Orchestrates operations across repositories
   - Repositories are instantiated in the service constructor with the injected database
   - Service classes follow this pattern:
     ```typescript
     export class EntityService {
       private entityRepository: EntityRepository;
       
       constructor(db: D1Database) {
         this.entityRepository = new EntityRepository(db);
       }
       
       // Service methods...
     }
     ```
   - Files:
     - `organizationService.ts`
     - `groupService.ts`
     - `roleService.ts`
     - `subscriptionService.ts`
     - `userSetupService.ts`

4. **Controller Layer**
   - Contains handler functions for HTTP requests
   - Validates input using Zod schemas
   - Instantiates services with the database from the environment
   - Calls appropriate service methods
   - Formats responses according to API standards
   - Files:
     - `organizationHandlers.ts`
     - `groupHandlers.ts`
     - `roleHandlers.ts`
     - `subscriptionHandlers.ts`
     - `integrationHandlers.ts`

5. **Module Entry Point**
   - Defines routes and connects them to handler functions
   - Applies middleware like authentication
   - Exports the module router

## Main Entities

- **Organization:** Top-level entity representing a customer organization
- **Group:** Collection of users within an organization
- **Role:** Defines a set of permissions (e.g., Admin, User)
- **Plan:** Subscription plan with features and pricing
- **Subscription:** Links a user to a plan for a specific period

## API Endpoints

### Organization Endpoints
- `POST /organizations` - Create a new organization
- `GET /organizations` - List all organizations
- `GET /organizations/:id` - Get organization by ID
- `GET /organizations/:id/groups` - Get organization with its groups
- `PUT /organizations/:id` - Update organization
- `DELETE /organizations/:id` - Delete organization

### Group Endpoints
- `POST /groups` - Create a new group
- `GET /groups/:id` - Get group by ID
- `PUT /groups/:id` - Update group
- `DELETE /groups/:id` - Delete group
- `GET /organizations/:organizationId/groups` - List groups by organization
- `GET /groups/:id/users` - Get users in a group
- `POST /groups/:id/users` - Assign user to group
- `DELETE /groups/:id/users/:userId` - Remove user from group

### Role Endpoints
- `GET /roles` - List all roles
- `GET /roles/:id` - Get role by ID
- `GET /users/:userId/roles` - Get user roles
- `POST /roles/assign` - Assign role to user
- `DELETE /users/:userId/roles/:roleId` - Remove role from user
- `GET /users/:userId/permissions` - Get user permissions
- `GET /roles/:roleId/users` - Get users by role

### Subscription Endpoints
- `GET /subscriptions/:id` - Get subscription
- `GET /users/:userId/subscription` - Get user subscription
- `POST /subscriptions` - Create subscription
- `PUT /subscriptions/:id` - Update subscription
- `DELETE /subscriptions/:id` - Cancel subscription
- `POST /users/:userId/subscription/upgrade` - Upgrade subscription
- `GET /users/:userId/subscriptions` - List user subscriptions
- `GET /plans` - List available plans
- `POST /users/:userId/free-plan` - Assign free plan

### Integration Endpoints
- `POST /integrations/user-registration` - Handle user registration
- `POST /integrations/user-update` - Handle user update
- `POST /integrations/user-deletion` - Handle user deletion 