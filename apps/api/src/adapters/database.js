import { mockDb } from '../storage/mockDb.js';

export function getDatabaseAdapter() {
  const provider = process.env.DATABASE_PROVIDER || 'mock';
  if (provider !== 'mock') {
    throw new Error(`DATABASE_PROVIDER=${provider} is not implemented yet. Replace this adapter with your central Postgres/Supabase implementation.`);
  }
  return mockDb;
}
