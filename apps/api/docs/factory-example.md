# Factory Pattern with Database Injection Example

Below is a complete example of how a module's factory.ts file should look with the new database injection pattern:

```typescript
// src/modules/teams/factory.ts

import { Env } from '../../types';
import { createDatabase } from '../../database/databaseFactory';
import { TeamRepository } from './repositories/teamRepository';
import { TeamMemberRepository } from './repositories/teamMemberRepository';
import { TeamService } from './services/teamService';
import { TeamMemberService } from './services/teamMemberService';
import { ITeamRepository, ITeamMemberRepository, ITeamService, ITeamMemberService } from './services/interfaces';

// Interface for all services in this module
export interface TeamServices {
  teamRepository: ITeamRepository;
  teamMemberRepository: ITeamMemberRepository;
  teamService: ITeamService;
  teamMemberService: ITeamMemberService;
}

/**
 * Create a team repository instance
 */
export function createTeamRepository(env: Env): TeamRepository {
  const dbService = createDatabase(env);
  return new TeamRepository(dbService);
}

/**
 * Create a team member repository instance
 */
export function createTeamMemberRepository(env: Env): TeamMemberRepository {
  const dbService = createDatabase(env);
  return new TeamMemberRepository(dbService);
}

/**
 * Create a team service instance with all dependencies
 */
export function createTeamService(env: Env): TeamService {
  const teamRepository = createTeamRepository(env);
  const teamMemberRepository = createTeamMemberRepository(env);
  
  return new TeamService(teamRepository, teamMemberRepository);
}

/**
 * Create a team member service instance with all dependencies
 */
export function createTeamMemberService(env: Env): TeamMemberService {
  const teamRepository = createTeamRepository(env);
  const teamMemberRepository = createTeamMemberRepository(env);
  
  return new TeamMemberService(teamMemberRepository, teamRepository);
}

/**
 * Helper function for backward compatibility
 */
export function getService<K extends keyof TeamServices>(
  env: Env,
  serviceName: K
): TeamServices[K] {
  switch(serviceName) {
    case 'teamRepository':
      return createTeamRepository(env) as unknown as TeamServices[K];
    case 'teamMemberRepository':
      return createTeamMemberRepository(env) as unknown as TeamServices[K];
    case 'teamService':
      return createTeamService(env) as unknown as TeamServices[K];
    case 'teamMemberService':
      return createTeamMemberService(env) as unknown as TeamServices[K];
    default:
      throw new Error(`Service ${String(serviceName)} not found`);
  }
}
```

## Repository Implementation Example

```typescript
// src/modules/teams/repositories/teamRepository.ts

import { SQLDatabase, RequestContext } from '../../../database/sqlDatabase';
import { Team, TeamCreate } from '../models/schemas';
import { ITeamRepository } from '../services/interfaces';

export class TeamRepository implements ITeamRepository {
  constructor(private readonly dbService: SQLDatabase) {}
  
  async getTeamById(id: string): Promise<Team | null> {
    return this.dbService.queryOne<Team>({
      sql: 'SELECT * FROM Team WHERE id = ?',
      params: [id]
    });
  }
  
  async createTeam(team: TeamCreate, context?: RequestContext): Promise<Team> {
    const id = crypto.randomUUID();
    const now = Date.now();
    
    await this.dbService.executeWithAudit(
      {
        sql: `INSERT INTO Team (id, name, ownerId, createdAt, updatedAt) 
              VALUES (?, ?, ?, ?, ?)`,
        params: [id, team.name, team.ownerId, now, now]
      },
      {
        eventType: 'team_created',
        userId: context?.userId || team.ownerId,
        resourceType: 'Team',
        resourceId: id,
        outcome: 'success'
      },
      context
    );
    
    return {
      id,
      name: team.name,
      ownerId: team.ownerId,
      createdAt: now,
      updatedAt: now
    };
  }
  
  // Additional repository methods...
}
```

## Service Implementation Example

```typescript
// src/modules/teams/services/teamService.ts

import { Team, TeamCreate } from '../models/schemas';
import { ITeamRepository, ITeamMemberRepository, ITeamService } from './interfaces';

export class TeamService implements ITeamService {
  constructor(
    private readonly teamRepository: ITeamRepository,
    private readonly teamMemberRepository: ITeamMemberRepository
  ) {}
  
  async createTeam(data: TeamCreate, context?: any): Promise<Team> {
    // Create the team
    const team = await this.teamRepository.createTeam(data, context);
    
    // Add the owner as a team member
    await this.teamMemberRepository.addTeamMember({
      teamId: team.id,
      userId: data.ownerId,
      role: 'admin',
      status: 'active'
    }, context);
    
    return team;
  }
  
  // Additional service methods...
}
``` 