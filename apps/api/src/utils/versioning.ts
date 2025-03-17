/**
 * API versioning utilities
 */

export interface ApiVersion {
  version: string;
  releaseDate: string;
  deprecated?: boolean;
  sunset?: string;
}

export const API_VERSIONS: Record<string, ApiVersion> = {
  v1: {
    version: '1.0.0',
    releaseDate: '2023-03-10',
    deprecated: false,
  },
  v2: {
    version: '2.0.0',
    releaseDate: '2023-03-15',
    deprecated: false,
  },
};

// Keep v1 as the latest version for now
// When v2 is ready for general use, change this to 'v2'
export const LATEST_VERSION = 'v1';

/**
 * Get the latest API version
 */
export function getLatestVersion(): ApiVersion {
  return API_VERSIONS[LATEST_VERSION];
}

/**
 * Check if a version is supported
 */
export function isVersionSupported(version: string): boolean {
  return !!API_VERSIONS[version];
}

/**
 * Get all available API versions
 */
export function getAllVersions(): Record<string, ApiVersion> {
  return API_VERSIONS;
}
