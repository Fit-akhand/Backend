let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenMemory = {
  getAccess: () => accessToken,
  getRefresh: () => refreshToken,
  set: (access: string | null, refresh: string | null) => {
    accessToken = access;
    refreshToken = refresh;
  },
  clear: () => {
    accessToken = null;
    refreshToken = null;
  },
};
