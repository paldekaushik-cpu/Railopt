import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  signInAnonymously
} from 'firebase/auth';
import { auth } from './config';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
}

export const authService = {
  // Listen to auth state
  onAuthState(callback: (user: AuthUser | null) => void) {
    return onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Railway Officer'),
          role: 'Sr. Divisional Operations Manager (Sr. DOM)'
        });
      } else {
        callback(null);
      }
    });
  },

  // Email/password login
  async login(email: string, pass: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return cred.user;
  },

  // Register
  async register(email: string, pass: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    return cred.user;
  },

  // 1-Click Demo Login for Hackathon Judges & Evaluators
  async demoLogin(): Promise<User> {
    try {
      // Attempt login with default demo account
      const cred = await signInWithEmailAndPassword(auth, 'railopt.admin@indianrailways.gov.in', 'RailOpt2026!');
      return cred.user;
    } catch {
      try {
        // If not registered yet, create it
        const cred = await createUserWithEmailAndPassword(auth, 'railopt.admin@indianrailways.gov.in', 'RailOpt2026!');
        return cred.user;
      } catch {
        // Fallback to anonymous auth if email provider is constrained
        const cred = await signInAnonymously(auth);
        return cred.user;
      }
    }
  },

  // Logout
  async logout(): Promise<void> {
    await signOut(auth);
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  }
};
