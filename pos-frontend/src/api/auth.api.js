import client from './client.js';

// POST /api/auth/login → { token, usuario }
export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then((r) => r.data.data);
