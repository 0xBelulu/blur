import { handleRequest } from '../../server/api.js';

export function onRequest({ request, env }) {
  return handleRequest(request, env);
}
