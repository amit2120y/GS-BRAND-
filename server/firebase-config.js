import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIyzHqo3FLqbqjAfmKNgWXAriq7CiuyM8",
  authDomain: "gs-brand-4be12.firebaseapp.com",
  projectId: "gs-brand-4be12",
  storageBucket: "gs-brand-4be12.firebasestorage.app",
  messagingSenderId: "677837936213",
  appId: "1:677837936213:web:686a2124a507caa99126dc",
  measurementId: "G-34FET8WF95"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firedb = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, firedb, storage, googleProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInWithPopup, sendEmailVerification, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, ref, uploadBytesResumable, getDownloadURL, deleteObject };
