import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { Playlist, Track } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyB2ZM2xV-HEbij2XpQPYDiDLFhI6TtS1k0",
  authDomain: "pirutv-5bd4f.firebaseapp.com",
  projectId: "pirutv-5bd4f",
  storageBucket: "pirutv-5bd4f.firebasestorage.app",
  messagingSenderId: "608570564038",
  appId: "1:608570564038:web:206b00670609470209e6c7",
  measurementId: "G-VN5D1C2VB9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Error translation helper
export const getFriendlyAuthErrorMessage = (err: any): string => {
  const code = err?.code || '';
  switch (code) {
    case 'auth/configuration-not-found':
      return 'Debes activar Authentication en Firebase Console (pirutv-5bd4f) > Authentication > Sign-in method > Habilitar Email/Password y Google.';
    case 'auth/operation-not-allowed':
      return 'El método de inicio de sesión no está habilitado en Firebase Console.';
    case 'auth/email-already-in-use':
      return 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
    case 'auth/invalid-email':
      return 'El correo electrónico no es válido.';
    case 'auth/weak-password':
      return 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Correo o contraseña incorrectos.';
    case 'auth/popup-closed-by-user':
      return 'Ventana de inicio de sesión con Google cerrada antes de completar.';
    default:
      return err?.message || 'Ocurrió un error en la autenticación.';
  }
};

// Auth Helpers
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await initUserProfileDoc(result.user);
    return result.user;
  } catch (error: any) {
    console.error('Error logging in with Google:', error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
};

export const signupWithEmail = async (email: string, pass: string, displayName: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await updateProfile(result.user, { displayName });
      await initUserProfileDoc(result.user);
    }
    return result.user;
  } catch (error: any) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

// Init User Profile document in Cloud Firestore
export const initUserProfileDoc = async (user: FirebaseUser) => {
  if (!user) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || 'Usuario Glassify',
        email: user.email,
        photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
        likedTrackIds: [],
        likedTracks: [],
        recentlyPlayed: [],
        isPremium: true,
      });
    }
  } catch (err) {
    console.warn('Firestore doc init notice:', err);
  }
};

// Sync Liked Tracks (Full objects + IDs) to Cloud Firestore under users/{uid}
export const syncLikedSongsToFirestore = async (uid: string, likedTracks: Track[]) => {
  try {
    const userRef = doc(db, 'users', uid);
    const likedTrackIds = likedTracks.map((t) => t.id);
    await setDoc(userRef, { likedTracks, likedTrackIds }, { merge: true });
  } catch (err) {
    console.error('Error syncing liked songs to Firestore:', err);
  }
};

// Sync Recently Played Songs (Top 5) to Cloud Firestore under users/{uid}
export const syncRecentlyPlayedToFirestore = async (uid: string, recentlyPlayed: Track[]) => {
  try {
    const userRef = doc(db, 'users', uid);
    const top5 = recentlyPlayed.slice(0, 5);
    await setDoc(userRef, { recentlyPlayed: top5 }, { merge: true });
  } catch (err) {
    console.error('Error syncing recently played to Firestore:', err);
  }
};

// Save a Playlist to Cloud Firestore under users/{uid}/playlists/{playlistId}
export const savePlaylistToFirestore = async (uid: string, playlist: Playlist) => {
  try {
    const playlistRef = doc(db, 'users', uid, 'playlists', playlist.id);
    await setDoc(playlistRef, playlist, { merge: true });
  } catch (err) {
    console.error('Error saving playlist to Firestore:', err);
  }
};

// Delete a Playlist from Cloud Firestore under users/{uid}/playlists/{playlistId}
export const deletePlaylistFromFirestore = async (uid: string, playlistId: string) => {
  try {
    const playlistRef = doc(db, 'users', uid, 'playlists', playlistId);
    await deleteDoc(playlistRef);
  } catch (err) {
    console.error('Error deleting playlist from Firestore:', err);
  }
};

// Real-time listener for User Playlists in Cloud Firestore
export const listenToUserPlaylists = (uid: string, callback: (playlists: Playlist[]) => void) => {
  try {
    const playlistsCol = collection(db, 'users', uid, 'playlists');
    const q = query(playlistsCol);
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const playlists: Playlist[] = [];
      snapshot.forEach((docSnap) => {
        playlists.push(docSnap.data() as Playlist);
      });
      callback(playlists);
    });
  } catch (err) {
    console.error('Error setting up playlists listener:', err);
    return () => {};
  }
};

// Real-time listener for User Profile Data (Liked Songs & Recently Played) in Cloud Firestore
export const listenToUserData = (uid: string, callback: (data: DocumentData) => void) => {
  try {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data());
      }
    });
  } catch (err) {
    console.error('Error listening to user data:', err);
    return () => {};
  }
};
