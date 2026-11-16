import { CognitoUserPool, CognitoUser, AuthenticationDetails } from "amazon-cognito-identity-js";

const pool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
});

export function signIn(email: string, password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    user.authenticateUser(new AuthenticationDetails({ Username: email, Password: password }), {
      onSuccess: (session) => resolve(session.getIdToken().getJwtToken()),
      onFailure: reject,
      newPasswordRequired: () => reject(new Error("A password change is required.")),
    });
  });
}

export function signOut() {
  pool.getCurrentUser()?.signOut();
}

export function getToken(): Promise<string | null> {
  return new Promise((resolve) => {
    const user = pool.getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err: unknown, session: { getIdToken: () => { getJwtToken: () => string } } | null) =>
      resolve(err || !session ? null : session.getIdToken().getJwtToken())
    );
  });
}

// STEP 1: Request password reset verification code
export function forgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({
      Username: email.trim().toLowerCase(),
      Pool: pool,
    });

    user.forgotPassword({
      onSuccess: () => resolve(),

      onFailure: (error) => reject(error),

      inputVerificationCode: () => resolve(),
    });
  });
}

// STEP 2: Verify code and update password
export function confirmPassword(
  email: string,
  verificationCode: string,
  newPassword: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({
      Username: email.trim().toLowerCase(),
      Pool: pool,
    });

    user.confirmPassword(verificationCode.trim(), newPassword, {
      onSuccess: () => resolve(),
      onFailure: (error) => reject(error),
    });
  });
}