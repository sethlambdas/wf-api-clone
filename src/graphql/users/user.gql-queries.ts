export const REFRESH_TOKEN_QL = `
  query RefreshToken($refreshToken: String) {
    RefreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshTokenGenerate
      cookieOptions {
        httpOnly
        maxAge
      }
    }
  }
`;

export const LOGOUT_QL = `
  query {
    SignOut
  }
`;
