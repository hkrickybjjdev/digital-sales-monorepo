import { nanoid } from 'nanoid';
import { v7 as uuidv7 } from 'uuid';

// Generate a unique UUID
export function generateUUID(): string {
  return uuidv7();
}

// Generate a Short ID
export function generateShortID(size: number): string {
  return nanoid(size);
}

/**
 * Helper method to wait for the specified delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
