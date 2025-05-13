"use client";

import React, { createContext, useEffect, useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from "firebase/auth";
import { User } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { createUserProfile } from '../firebase/firebaseUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  clearError: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          await createUserProfile(user);
        }
        setUser(user);
      } catch (err) {
        setError('Error setting up user profile');
        console.error('Error in auth state change:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      await createUserProfile(result.user);
    } catch (err: any) {
      let errorMessage = 'Failed to sign in with Google';
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in was cancelled';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up was blocked by the browser';
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign in was cancelled';
      }
      
      setError(errorMessage);
      console.error('Error signing in with Google:', err);
    }
  };

  const signOutUser = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      setError('Failed to sign out');
      console.error('Error signing out:', err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        error, 
        signInWithGoogle, 
        signOut: signOutUser,
        clearError 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
