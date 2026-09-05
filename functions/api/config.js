import { cors, json } from '../../lib/api/shared.js';

/* Public, non-secret client configuration.
   TURN credentials are deliberately NOT served from here — they are handed to
   the browser by whoever set them, which is the only thing a browser-relayed
   TURN server can do anyway (the client must authenticate directly to the
   relay). Set these in the Cloudflare Pages dashboard:

       HC_TURN_URLS       turn:relay.example.com:3478,turn:relay.example.com:3478?transport=tcp
       HC_TURN_USERNAME   <username>
       HC_TURN_CREDENTIAL <credential>

   Leave them unset and the client falls back to the free Metered openrelay.
   For real protection use short-lived HMAC credentials from a paid provider
   rather than a long-lived shared password. */
export const onRequestGet = (ctx) => {
  const env = ctx.env || {};
  const urls = env.HC_TURN_URLS;
  const username = env.HC_TURN_USERNAME;
  const credential = env.HC_TURN_CREDENTIAL;

  const body = {
    turn:
      urls && username && credential
        ? { urls, username, credential }
        : null,
    turnSource: urls && username && credential ? 'env' : 'free-openrelay',
  };
  return json(body);
};

export const onRequestOptions = cors;
