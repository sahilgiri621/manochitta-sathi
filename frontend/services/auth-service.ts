import { api } from "@/lib/api"
import type { AuthSession, LoginCredentials, RegisterData, User } from "@/lib/types"

export const authService = {
  login(credentials: LoginCredentials): Promise<AuthSession> {
    return api.login(credentials)
  },
  googleLogin(credential: string): Promise<AuthSession> {
    return api.loginWithGoogle(credential)
  },
  register(payload: RegisterData): Promise<User> {
    return api.register(payload)
  },
  logout(): Promise<void> {
    return api.logout()
  },
  getCurrentUser(): Promise<User> {
    return api.getCurrentUser()
  },
  forgotPassword(email: string): Promise<void> {
    return api.forgotPassword(email)
  },
  resetPassword(token: string, password: string): Promise<void> {
    return api.resetPassword(token, password)
  },
  verifyEmail(token: string): Promise<User> {
    return api.verifyEmail(token)
  },
  resendVerification(email: string): Promise<void> {
    return api.resendVerification(email)
  },
}
