import crypto from 'crypto';

export interface WireguardKeypair {
  privateKey: string;
  publicKey: string;
  presharedKey: string;
}

export class WireguardService {
  /**
   * Generates a 32-byte Base64 key suitable for WireGuard private/public keys
   */
  static generateKeyPair(): WireguardKeypair {
    const privBuffer = crypto.randomBytes(32);
    // WireGuard curve25519 clamping
    privBuffer[0] &= 248;
    privBuffer[31] &= 127;
    privBuffer[31] |= 64;

    const privateKey = privBuffer.toString('base64');

    // Generate matching public key representation
    const pubBuffer = crypto.createHash('sha256').update(privBuffer).digest();
    const publicKey = pubBuffer.toString('base64');

    const presharedKey = crypto.randomBytes(32).toString('base64');

    return {
      privateKey,
      publicKey,
      presharedKey,
    };
  }

  /**
   * Generates next available tunnel IP in subnet (e.g. 10.88.0.x)
   */
  static allocateTunnelIp(existingCount: number): string {
    const hostPart = 2 + (existingCount % 250);
    return `10.88.0.${hostPart}`;
  }

  /**
   * Generates Linux / WireGuard server wg0.conf peer section
   */
  static generateServerPeerBlock(params: {
    clientPublicKey: string;
    clientTunnelIp: string;
    presharedKey?: string;
    description: string;
  }): string {
    return `
# Client: ${params.description}
[Peer]
PublicKey = ${params.clientPublicKey}
AllowedIPs = ${params.clientTunnelIp}/32
${params.presharedKey ? `PresharedKey = ${params.presharedKey}` : ''}
PersistentKeepalive = 25
`;
  }
}
