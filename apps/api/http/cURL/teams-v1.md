# Teams v1 API Collection

## Base URL
All v1 endpoints are prefixed with `/api/v1`

## Team Management

### Get User Teams
Get all teams that the current user belongs to

```bash
curl -X GET http://localhost:8787/api/v1/teams \
  -H "Authorization: Bearer jwt_xyz789"
```

Expected successful response (200):
```json
{
  "teams": [
    {
      "id": "team_123",
      "name": "My Team",
      "createdAt": 1742052443000,
      "updatedAt": 1742052443000,
      "memberCount": 5
    }
  ]
}
```

### Create Team
Create a new team

```bash
curl -X POST http://localhost:8787/api/v1/teams \
  -H "Authorization: Bearer jwt_xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Team"
  }'
```

Expected successful response (201):
```json
{
  "team": {
    "id": "team_123",
    "name": "New Team",
    "createdAt": 1742052443000,
    "updatedAt": 1742052443000
  }
}
```

### Get Team
Get details of a specific team

```bash
curl -X GET http://localhost:8787/api/v1/teams/team_123 \
  -H "Authorization: Bearer jwt_xyz789"
```

Expected successful response (200):
```json
{
  "team": {
    "id": "team_123",
    "name": "My Team",
    "createdAt": 1742052443000,
    "updatedAt": 1742052443000
  }
}
```

### Update Team
Update team details

```bash
curl -X PUT http://localhost:8787/api/v1/teams/team_123 \
  -H "Authorization: Bearer jwt_xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Team Name"
  }'
```

Expected successful response (200):
```json
{
  "team": {
    "id": "team_123",
    "name": "Updated Team Name",
    "createdAt": 1742052443000,
    "updatedAt": 1742052443000
  }
}
```

### Delete Team
Delete a team

```bash
curl -X DELETE http://localhost:8787/api/v1/teams/team_123 \
  -H "Authorization: Bearer jwt_xyz789"
```

Expected successful response (200):
```json
{
  "success": true,
  "message": "Team deleted successfully"
}
```

## Team Member Management

### Get Team Members
Get all members of a team

```bash
curl -X GET http://localhost:8787/api/v1/teams/team_123/members \
  -H "Authorization: Bearer jwt_xyz789"
```

Expected successful response (200):
```json
{
  "members": [
    {
      "id": "member_123",
      "teamId": "team_123",
      "userId": "user_123",
      "role": "owner",
      "createdAt": 1742052443000,
      "updatedAt": 1742052443000,
      "user": {
        "id": "user_123",
        "name": "John Doe",
        "email": "user@example.com"
      }
    }
  ]
}
```

### Add Team Member
Add a new member to a team

```bash
curl -X POST http://localhost:8787/api/v1/teams/team_123/members \
  -H "Authorization: Bearer jwt_xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_456",
    "role": "member"
  }'
```

Expected successful response (201):
```json
{
  "member": {
    "id": "member_456",
    "teamId": "team_123",
    "userId": "user_456",
    "role": "member",
    "createdAt": 1742052443000,
    "updatedAt": 1742052443000
  }
}
```

### Update Team Member
Update a team member's role

```bash
curl -X PUT http://localhost:8787/api/v1/teams/team_123/members/member_456 \
  -H "Authorization: Bearer jwt_xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

Expected successful response (200):
```json
{
  "member": {
    "id": "member_456",
    "teamId": "team_123",
    "userId": "user_456",
    "role": "admin",
    "createdAt": 1742052443000,
    "updatedAt": 1742052443000
  }
}
```

### Remove Team Member
Remove a member from a team

```bash
curl -X DELETE http://localhost:8787/api/v1/teams/team_123/members/member_456 \
  -H "Authorization: Bearer jwt_xyz789"
```

Expected successful response (200):
```json
{
  "success": true,
  "message": "Team member removed successfully"
}
```

## Error Responses

### Validation Error (400)
```json
{
  "error": "Invalid input",
  "type": "ValidationError"
}
```

### Authentication Error (401)
```json
{
  "error": "Invalid or expired token",
  "type": "Unauthorized"
}
```

### Permission Error (403)
```json
{
  "error": "You do not have permission to perform this action",
  "type": "Forbidden"
}
```

### Not Found (404)
```json
{
  "error": "Resource not found",
  "type": "ResourceNotFound"
}
```

### Conflict Error (409)
```json
{
  "error": "User is already a member of this team",
  "type": "ConflictError"
}
```

### Server Error (500)
```json
{
  "error": "Internal server error",
  "type": "ServerError"
}
```

## Role-Based Access Control

Team members can have one of four roles that determine their permissions:
- **owner**: Full control over team settings and members
- **admin**: Can manage team settings and members (except owners)
- **member**: Can access team resources but cannot manage team
- **viewer**: Read-only access to team resources

### Permission Rules:
- Only owners can add/remove owners
- Owners and admins can add new members
- Owners can update any member's role
- Admins can update roles of members/viewers only
- Members and viewers cannot modify team or member settings
- Users can remove themselves from a team (except last owner)