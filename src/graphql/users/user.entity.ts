export class CookieOptions {
  httpOnly: boolean;
  maxAge: string;
}

export class RefreshToken {
  accessToken: string;
  refreshTokenGenerate: string;
  cookieOptions: CookieOptions;
}

export interface IRefreshToken {
  data: {
    RefreshToken: RefreshToken;
  };
}

export interface ISignOut {
  data: {
    SignOut: boolean;
  };
}
