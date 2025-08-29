import { Environment } from '../../types/environment';

export const resolveBaseUrl = (env: Environment) => {
  let r = '';
  switch (env) {
    case Environment.Sandbox:
      r = 'https://sandbox.api.getsafepay.com/drops';
      break;
    case Environment.Development:
      r = 'https://dev.api.getsafepay.com/drops';
      break;
    case Environment.Local:
      r = 'http://127.0.0.1:3000';
      break;
    default:
      r = 'https://getsafepay.com/drops';
  }
  return r;
};
