export const resolveBaseUrl = (env: string) => {
  let r = "";
  switch (env) {
    case "sandbox":
      r = "https://sandbox.api.getsafepay.com/drops";
      break;
    case "development":
      r = "https://dev.api.getsafepay.com/drops";
      break;
    case "local":
      r = "http://127.0.0.1:3000";
      break;
    default:
      r = "https://getsafepay.com/drops";
  }
  return r;
};
