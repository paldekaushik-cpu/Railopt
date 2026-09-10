import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from './config';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
}

const LOCAL_STORAGE_DEMO_KEY = 'railopt_demo_officer_user';
const listeners = new Set<(user: AuthUser | null) => void>();

function getStoredDemoUser(): AuthUser | null {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_DEMO_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function notifyListeners(user: AuthUser | null) {
  listeners.forEach(cb => {
    try {
      cb(user);
    } catch (err) {
      console.warn('Auth state listener error:', err);
    }
  });
}

// Attach Firebase onAuthStateChanged once
let isFirebaseAuthAttached = false;
let currentActiveUser: AuthUser | null = getStoredDemoUser();

function ensureFirebaseListener() {
  if (isFirebaseAuthAttached) return;
  isFirebaseAuthAttached = true;

  onAuthStateChanged(auth, (firebaseUser: User | null) => {
    if (firebaseUser) {
      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Railway Officer'),
        role: 'Sr. Divisional Operations Manager (Sr. DOM)'
      };
      currentActiveUser = authUser;
      notifyListeners(authUser);
    } else {
      // If Firebase user is null, check if local demo user is active
      const demoUser = getStoredDemoUser();
      currentActiveUser = demoUser;
      notifyListeners(demoUser);
    }
  });
}

export const authService = {
  // Listen to auth state
  onAuthState(callback: (user: AuthUser | null) => void) {
    listeners.add(callback);
    ensureFirebaseListener();

    // Immediately trigger with current known state
    callback(currentActiveUser);

    return () => {
      listeners.delete(callback);
    };
  },

  // Instant 1-Click Demo Login for Hackathon Evaluators
  async demoLogin(): Promise<AuthUser> {
    // Attempt anonymous sign-in in background if available
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.warn('Anonymous auth note (using local demo session):', e);
    }

    const demoUser: AuthUser = {
      uid: auth.currentUser?.uid || 'demo-sr-dom-officer-01',
      email: 'sr.dom.operations@indianrailways.gov.in',
      displayName: 'K. S. Sharma (Sr. DOM)',
      role: 'Sr. Divisional Operations Manager (Sr. DOM)'
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_DEMO_KEY, JSON.stringify(demoUser));
    } catch (e) {
      console.warn('LocalStorage save note:', e);
    }

    currentActiveUser = demoUser;
    notifyListeners(demoUser);
    return demoUser;
  },

  // Google Sign-In (Official Railways / Evaluator Google Account)
  async loginWithGoogle(): Promise<AuthUser> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const authUser: AuthUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName || 'Railway Officer',
      role: 'Sr. Divisional Operations Manager (Sr. DOM)'
    };
    currentActiveUser = authUser;
    try {
      localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
    } catch {
      // ignore
    }
    notifyListeners(authUser);
    return authUser;
  },

  // Email/password login
  async login(email: string, pass: string): Promise<AuthUser> {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const authUser: AuthUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || email.split('@')[0],
        role: 'Sr. Divisional Operations Manager (Sr. DOM)'
      };
      currentActiveUser = authUser;
      try {
        localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
      } catch {
        // ignore
      }
      notifyListeners(authUser);
      return authUser;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
        throw new Error('Email/Password provider is not enabled in Firebase Console. Please use "Instant Demo Login" or "Sign in with Google".');
      }
      throw err;
    }
  },

  // Register
  async register(email: string, pass: string): Promise<AuthUser> {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const authUser: AuthUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || email.split('@')[0],
        role: 'Sr. Divisional Operations Manager (Sr. DOM)'
      };
      currentActiveUser = authUser;
      try {
        localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
      } catch {
        // ignore
      }
      notifyListeners(authUser);
      return authUser;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
        throw new Error('Email/Password provider is not enabled in Firebase Console. Please use "Instant Demo Login" or "Sign in with Google".');
      }
      throw err;
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
    } catch {
      // ignore
    }
    currentActiveUser = null;
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out note:', e);
    }
    notifyListeners(null);
  },

  getCurrentUser(): AuthUser | null {
    return currentActiveUser;
  }
};

