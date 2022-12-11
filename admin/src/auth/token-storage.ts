const AUTH_TOKEN_STORAGE_KEY = "auth-token";

export const handlers = {
  get() {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  },
  set(val: string) {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, val);
  },
  clear() {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  },
};

export default handlers;
