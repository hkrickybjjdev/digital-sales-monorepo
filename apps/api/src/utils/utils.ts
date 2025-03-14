import { v7 as uuidv7 } from 'uuid'
import { nanoid } from 'nanoid';

// Generate a unique UUID
export function generateUUID(): string {
    return uuidv7()
}
  
// Generate a Short ID
export function generateShortID(size:number): string {
    return nanoid(size)
}
  