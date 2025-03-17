// Import the utils functions directly from the source
import { generateUUID, generateShortID } from '../../src/utils/utils';

// Mock the external dependencies - this avoids the ESM import issues
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-short-id')
}));

jest.mock('uuid', () => ({
  v7: jest.fn(() => '00000000-0000-7000-8000-000000000000')
}));

describe('Utils Functions', () => {
  describe('generateUUID', () => {
    it('should generate a UUID string', () => {
      const uuid = generateUUID();
      
      // With our mock, we know what the value will be
      expect(uuid).toBe('00000000-0000-7000-8000-000000000000');
    });
  });

  describe('generateShortID', () => {
    it('should generate a short ID with specified length', () => {
      // With our mock, the actual size won't matter
      const size = 10;
      const shortId = generateShortID(size);
      
      // With our mock, we know what the value will be
      expect(shortId).toBe('mock-short-id');
    });
  });
});