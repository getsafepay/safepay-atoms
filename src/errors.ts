type SafepayError = {
  reason: string;
  message: string;
  details?: {
    message: string;
  };
};

export function CAPTURE_CONTEXT_INVALID(): SafepayError {
  return {
    reason: 'CAPTURE_CONTEXT_INVALID',
    message: 'You have not supplied a valid capture context.',
  };
}

export function CAPTURE_CONTEXT_EXPIRED(): SafepayError {
  return {
    reason: 'CAPTURE_CONTEXT_EXPIRED',
    message: 'Your capture context has expired.',
  };
}
export function BROWSER_ENCRYPTION_FAILED(): SafepayError {
  return {
    reason: 'BROWSER_ENCRYPTION_FAILED',
    message: 'In-browser encryption has failed.',
  };
}
export function CREATE_FIELD_INVALID_FIELD_TYPE(e: string): SafepayError {
  var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : [];
  return {
    reason: 'CREATE_FIELD_INVALID_FIELD_TYPE',
    message: 'Invalid field "'.concat(e, '". Supported values are [ ').concat(t.join(', '), ' ].'),
    details: { message: 'Supported values are [ '.concat(t.join(', '), ' ].') },
  };
}

export function IFRAME_JWT_VALIDATION_FAILED(): SafepayError {
  return { reason: 'IFRAME_JWT_VALIDATION_FAILED', message: 'Invalid JWT.' };
}
export function UNKNOWN_REASON(e: string) {
  return {
    reason: 'UNKNOWN_REASON',
    message: 'Microform could not handle the recieved Flex API reason code.',
    details: e,
  };
}
export function API_INTERNAL_ERROR(): SafepayError {
  return {
    reason: 'API_INTERNAL_ERROR',
    message: 'An unknown error has occurred.',
  };
}
export function API_JSON_PARSER_ERROR(): SafepayError {
  return {
    reason: 'API_JSON_PARSER_ERROR',
    message: 'There was a problem processing your request.',
  };
}
export function API_JWE_PARSING_ERROR(): SafepayError {
  return {
    reason: 'API_JWE_PARSING_ERROR',
    message: 'Unable create a token as the JWE contents could not be parsed.',
  };
}
export function API_GATEWAY_ERROR(): SafepayError {
  return {
    reason: 'API_GATEWAY_ERROR',
    message: 'The API gateway rejected your request.',
  };
}
export function CREATE_TOKEN_CAPTURE_CONTEXT_USED_TOO_MANY_TIMES(): SafepayError {
  return {
    reason: 'CREATE_TOKEN_CAPTURE_CONTEXT_USED_TOO_MANY_TIMES',
    message: 'The supplied capture context has exceeded its usage limits. Please request another before trying again.',
  };
}
export function CREATE_TOKEN_CAPTURE_CONTEXT_NOT_FOUND(): SafepayError {
  return {
    reason: 'CREATE_TOKEN_CAPTURE_CONTEXT_NOT_FOUND',
    message: 'The capture context could not be found. Please request another before trying again.',
  };
}
export function CREATE_TOKEN_CARD_TYPE_NOT_ALLOWED(e: string[]) {
  const t = {
    reason: 'CREATE_TOKEN_CARD_TYPE_NOT_ALLOWED',
    message: "Card Type is not in this session's allowedCardNetworks.",
    details: { message: 'Validation error', location: 'type' },
  };
  return e && (t.details.message += ': supported values ['.concat(e.join(', '), ']'));
}
