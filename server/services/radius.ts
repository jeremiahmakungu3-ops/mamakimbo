import { store, Voucher, Customer, HotspotProfile } from '../db/store.ts';

export class RadiusService {
  /**
   * Syncs a voucher directly into FreeRADIUS radcheck and radreply tables
   */
  static async syncVoucher(voucher: Voucher, profile?: HotspotProfile) {
    // 1. Clear existing entries for this username
    store.radcheck = store.radcheck.filter((r) => r.username !== voucher.code);
    store.radreply = store.radreply.filter((r) => r.username !== voucher.code);

    if (voucher.status !== 'active') {
      return;
    }

    // 2. Add radcheck entry for Password
    store.radcheck.push({
      id: store.radcheck.length + 1,
      username: voucher.code,
      attribute: 'Cleartext-Password',
      op: ':=',
      value: voucher.password,
    });

    // 3. Add radreply entry for MikroTik Rate Limit
    const rateLimit = profile ? `${profile.rate_limit_rx}/${profile.rate_limit_tx}` : '5M/5M';
    store.radreply.push({
      id: store.radreply.length + 1,
      username: voucher.code,
      attribute: 'Mikrotik-Rate-Limit',
      op: '=',
      value: rateLimit,
    });

    // 4. Add Session-Timeout (in seconds)
    const timeoutSeconds = profile ? profile.session_timeout_min * 60 : 3600;
    store.radreply.push({
      id: store.radreply.length + 1,
      username: voucher.code,
      attribute: 'Session-Timeout',
      op: '=',
      value: timeoutSeconds.toString(),
    });

    // 5. Port-Limit (Simultaneous Use)
    const sharedUsers = profile?.shared_users || 1;
    store.radreply.push({
      id: store.radreply.length + 1,
      username: voucher.code,
      attribute: 'Port-Limit',
      op: '=',
      value: sharedUsers.toString(),
    });
  }

  /**
   * FreeRADIUS rlm_rest Authorize Handler
   */
  static handleAuthorize(requestBody: any): { authorized: boolean; reply?: Record<string, string>; error?: string } {
    const username = requestBody['User-Name'] || requestBody['username'];
    if (!username) {
      return { authorized: false, error: 'Missing User-Name' };
    }

    // Check voucher first
    const voucher = store.vouchers.find((v) => v.code === username && v.status === 'active');
    if (voucher) {
      const profile = store.profiles.find((p) => p.id === voucher.profile_id);
      return {
        authorized: true,
        reply: {
          'Cleartext-Password': voucher.password,
          'Mikrotik-Rate-Limit': profile ? `${profile.rate_limit_rx}/${profile.rate_limit_tx}` : '5M/5M',
          'Session-Timeout': ((profile?.session_timeout_min || 60) * 60).toString(),
          'Port-Limit': (profile?.shared_users || 1).toString(),
        },
      };
    }

    // Check customer subscriber account
    const customer = store.customers.find((c) => c.username === username && c.status === 'active');
    if (customer) {
      const profile = store.profiles.find((p) => p.id === customer.profile_id);
      return {
        authorized: true,
        reply: {
          'Cleartext-Password': 'customer_pass',
          'Mikrotik-Rate-Limit': profile ? `${profile.rate_limit_rx}/${profile.rate_limit_tx}` : '10M/10M',
          'Session-Timeout': '86400',
        },
      };
    }

    return { authorized: false, error: 'User not found or subscription expired' };
  }

  /**
   * FreeRADIUS rlm_rest Accounting Handler (Start, Interim-Update, Stop)
   */
  static handleAccounting(requestBody: any) {
    const acctStatusType = requestBody['Acct-Status-Type'];
    const sessionId = requestBody['Acct-Session-Id'] || `sess_${Date.now()}`;
    const username = requestBody['User-Name'] || '';
    const nasIp = requestBody['NAS-IP-Address'] || '';
    const bytesIn = parseInt(requestBody['Acct-Input-Octets'] || '0', 10);
    const bytesOut = parseInt(requestBody['Acct-Output-Octets'] || '0', 10);
    const sessionTime = parseInt(requestBody['Acct-Session-Time'] || '0', 10);
    const framedIp = requestBody['Framed-IP-Address'] || '';
    const mac = requestBody['Calling-Station-Id'] || '';

    // Record or update radacct
    let acct = store.radacct.find((a) => a.acctsessionid === sessionId);
    if (!acct) {
      acct = {
        radacctid: store.radacct.length + 1,
        acctsessionid: sessionId,
        acctuniqueid: `uniq_${sessionId}_${Date.now()}`,
        username,
        nasipaddress: nasIp,
        acctstarttime: new Date().toISOString(),
        acctsessiontime: sessionTime,
        acctinputoctets: bytesIn,
        acctoutputoctets: bytesOut,
        callingstationid: mac,
        framedipaddress: framedIp,
      };
      store.radacct.unshift(acct);
    } else {
      acct.acctsessiontime = sessionTime;
      acct.acctinputoctets = bytesIn;
      acct.acctoutputoctets = bytesOut;
      if (acctStatusType === 'Stop') {
        acct.acctstoptime = new Date().toISOString();
      }
    }

    // Update voucher status when user logs in or stops
    const voucher = store.vouchers.find((v) => v.code === username);
    if (voucher) {
      if (!voucher.activated_at && acctStatusType === 'Start') {
        voucher.activated_at = new Date().toISOString();
        const profile = store.profiles.find((p) => p.id === voucher.profile_id);
        const validityDays = profile?.validity_days || 1;
        voucher.expires_at = new Date(Date.now() + validityDays * 86400000).toISOString();
        voucher.mac_address = mac;
      }

      if (acctStatusType === 'Stop') {
        // Check if expired
        if (voucher.expires_at && new Date(voucher.expires_at).getTime() <= Date.now()) {
          voucher.status = 'expired';
        }
      }
    }

    return { success: true };
  }
}
