export interface Env {
  // Environment variables
  ENVIRONMENT: string;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  
  // KV Namespaces
  PAGES_METADATA: KVNamespace;
  
  // R2 Buckets
  STORAGE_BUCKET: R2Bucket;
  
  // D1 Database
  DB: D1Database;
}