import Safepay from '@sfpy/node-core';

const API_HOST_BY_ENV: Record<string, string> = {
  sandbox: 'https://sandbox.api.getsafepay.com',
  development: 'https://dev.api.getsafepay.com',
  production: 'https://api.getsafepay.com',
};

export interface LiveSession {
  authToken: string;
  user: string;
  env: string;
  _merchantApiKey: string;
  _host: string;
}

export async function createLiveSession(): Promise<LiveSession> {
  const secretKey = process.env.X_SFPY_MERCHANT_SECRET;
  if (!secretKey) throw new Error('X_SFPY_MERCHANT_SECRET is not set');

  const merchantApiKey = process.env.SFPY_MERCHANT_API_KEY;
  if (!merchantApiKey) throw new Error('SFPY_MERCHANT_API_KEY is not set');

  const env = (process.env.DROPS_ENV || 'sandbox').toLowerCase();
  const host = API_HOST_BY_ENV[env] ?? API_HOST_BY_ENV.sandbox;

  const secretClient = new Safepay(secretKey, { authType: 'secret', host });
  const passportRes = await secretClient.client.passport.create();
  const authToken: string = passportRes.data;

  const jwtClient = new Safepay(authToken, { authType: 'jwt', host });
  const customerRes = await jwtClient.customers.object.create({
    first_name: 'E2E',
    last_name: 'Test',
    email: `e2e+${Date.now()}@getsafepay.com`,
    phone_number: '+923331234567',
    country: 'PK',
    is_guest: false,
  });
  const user: string = customerRes.data.token;

  return { authToken, user, env, _merchantApiKey: merchantApiKey, _host: host };
}

export async function createTracker(session: LiveSession): Promise<string> {
  const jwtClient = new Safepay(session.authToken, { authType: 'jwt', host: session._host });
  const trackerRes = await jwtClient.payments.session.setup({
    merchant_api_key: session._merchantApiKey,
    intent: 'CYBERSOURCE',
    mode: 'payment',
    currency: 'PKR',
    user: session.user,
    amount: 5000,
    entry_mode: 'raw',
  });
  return trackerRes.data.tracker.token;
}
