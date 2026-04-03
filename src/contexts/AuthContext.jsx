import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    const [isAdmin, setIsAdmin] = useState(false);
    const [isAdmin_2, setIsAdmin_2] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            
            if (user) {
                const env = import.meta.env;
                const email = user.email;
                const admin1 = env.VITE_ADMIN_EMAIL1;
                const admin2 = env.VITE_ADMIN_EMAIL2;
                const admin3 = env.VITE_ADMIN_EMAIL3;
                const admin4 = env.VITE_ADMIN_EMAIL4;
                const admin5 = env.VITE_ADMIN_EMAIL5;
                const admin6 = env.VITE_ADMIN_EMAIL6;
                const admin7 = env.VITE_ADMIN_EMAIL7;
                const admin8 = env.VITE_ADMIN_EMAIL8;
                const admin9 = env.VITE_ADMIN_EMAIL9;
                const admin10 = env.VITE_ADMIN_EMAIL10;

                const isAdm2 = email === admin1 || email === admin2;
                const adminEmails = [admin1, admin2, admin3, admin4, admin5, admin6, admin7, admin8, admin9, admin10];
                const isAdm = adminEmails.some(adm => adm && email === adm);

                setIsAdmin(isAdm);
                setIsAdmin_2(isAdm2);
            } else {
                setIsAdmin(false);
                setIsAdmin_2(false);
            }
            
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        let timeoutId;

        const handleActivity = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                if (currentUser && !isAdmin_2) {
                    logout();
                }
            }, 15 * 60 * 1000); // 15 minutes
        };

        if (currentUser && !isAdmin_2) {
            handleActivity(); // Start timer initially

            const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
            events.forEach(event => window.addEventListener(event, handleActivity));

            return () => {
                if (timeoutId) clearTimeout(timeoutId);
                events.forEach(event => window.removeEventListener(event, handleActivity));
            };
        }
    }, [currentUser, isAdmin_2]);

    const value = {
        currentUser,
        isAdmin,
        isAdmin_2,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
