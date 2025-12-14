"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from "react";
import {
	User as FirebaseUser,
	onAuthStateChanged,
	signInWithPopup,
	GoogleAuthProvider,
	signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@/types/user";

interface AuthContextType {
	user: User | null;
	firebaseUser: FirebaseUser | null;
	loading: boolean;
	signIn: () => Promise<void>;
	signOut: () => Promise<void>;
	refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchUserData = async (uid: string): Promise<User | null> => {
		try {
			const userDoc = await getDoc(doc(db, "users", uid));
			if (userDoc.exists()) {
				return { id: uid, ...userDoc.data() } as User;
			}
			return null;
		} catch (error) {
			console.error("Error fetching user data:", error);
			return null;
		}
	};

	const createUserDocument = async (
		uid: string,
		firebaseUser: FirebaseUser
	): Promise<User> => {
		const now = Timestamp.now();
		const newUser: Omit<User, "id"> = {
			displayName: firebaseUser.displayName || `ユーザー${uid.substring(0, 6)}`,
			email: firebaseUser.email || undefined,
			photoURL: firebaseUser.photoURL || undefined,
			points: 0,
			lastLoginAt: now,
			createdAt: now,
			updatedAt: now,
			hasReceivedDailyBonus: false,
			isPresent: false,
		};

		await setDoc(doc(db, "users", uid), newUser);
		return { id: uid, ...newUser };
	};

	const refreshUser = async () => {
		if (firebaseUser) {
			const userData = await fetchUserData(firebaseUser.uid);
			setUser(userData);
		}
	};

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			setFirebaseUser(firebaseUser);

			if (firebaseUser) {
				let userData = await fetchUserData(firebaseUser.uid);

				if (!userData) {
					userData = await createUserDocument(firebaseUser.uid, firebaseUser);
				}

				setUser(userData);
			} else {
				setUser(null);
			}

			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

	const signIn = async () => {
		try {
			const provider = new GoogleAuthProvider();
			provider.setCustomParameters({
				prompt: "select_account",
			});
			await signInWithPopup(auth, provider);
		} catch (error) {
			console.error("Error signing in:", error);
			throw error;
		}
	};

	const signOut = async () => {
		try {
			await firebaseSignOut(auth);
			setUser(null);
			setFirebaseUser(null);
		} catch (error) {
			console.error("Error signing out:", error);
			throw error;
		}
	};

	return (
		<AuthContext.Provider
			value={{ user, firebaseUser, loading, signIn, signOut, refreshUser }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}



