# Prisma Migration Guide

This project uses Prisma migrations to manage database schema changes.

## Initial Setup

If you're setting up the project for the first time:

```bash
# Generate Prisma Client
npm run db:generate

# Create and apply initial migration
npx prisma migrate dev --name init

# Or if you want to apply existing migrations
npx prisma migrate deploy
```

## Development Workflow

### Creating a New Migration

1. **Modify the schema** (`prisma/schema.prisma`)
2. **Create migration**:
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```
   This will:
   - Create a new migration file
   - Apply it to your development database
   - Regenerate Prisma Client

### Applying Migrations in Production

```bash
# Apply all pending migrations
npx prisma migrate deploy
```

This command:
- Applies all pending migrations
- Does NOT create new migrations
- Safe for production use

## Migration Commands

- `npx prisma migrate dev` - Create and apply migration (development)
- `npx prisma migrate deploy` - Apply pending migrations (production)
- `npx prisma migrate reset` - Reset database and apply all migrations
- `npx prisma migrate status` - Check migration status

## Important Notes

- **Never edit migration files manually** after they've been applied
- **Always test migrations** in development before deploying
- **Backup your database** before applying migrations in production
- **Review migration SQL** before applying in production

## Troubleshooting

### Migration conflicts
If you have conflicts, you can:
1. Reset your local database: `npx prisma migrate reset`
2. Recreate migrations: `npx prisma migrate dev`

### Production issues
If a migration fails in production:
1. Check the error message
2. Fix the issue in the schema
3. Create a new migration to fix it
4. Apply the fix migration

