/**
 * Google Secret Manager Integration (Server-Side Only)
 * Resolves credentials securely from Google Cloud Secret Manager when running in GCP,
 * or safely falls back to server environment variables.
 */

export class SecretManagerService {
  private static cachedSecrets: Map<string, string> = new Map();

  /**
   * Resolves a secret by name
   */
  static async getSecret(secretName: string, defaultValue: string = ''): Promise<string> {
    // 1. Check memory cache first
    if (this.cachedSecrets.has(secretName)) {
      return this.cachedSecrets.get(secretName)!;
    }

    // 2. Check environment variables
    const envVal = process.env[secretName];
    if (envVal) {
      this.cachedSecrets.set(secretName, envVal);
      return envVal;
    }

    // 3. If running in GCP Cloud Run with Secret Manager enabled
    const useSecretManager = process.env.USE_SECRET_MANAGER === 'true';
    const projectId = process.env.GCP_PROJECT_ID;

    if (useSecretManager && projectId) {
      try {
        // Dynamic import to avoid hard build dependency if package is resolved at runtime in GCP
        const modName = '@google-cloud/secret-manager';
        const gcpModule: any = await import(/* @vite-ignore */ modName);
        const client = new gcpModule.SecretManagerServiceClient();
        const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

        const [version] = await client.accessSecretVersion({ name });
        const payload = version.payload?.data?.toString();
        if (payload) {
          this.cachedSecrets.set(secretName, payload);
          return payload;
        }
      } catch (err: any) {
        console.warn(`[SecretManager] Could not retrieve secret "${secretName}" from GCP: ${err.message}. Using fallback.`);
      }
    }

    return defaultValue;
  }
}
