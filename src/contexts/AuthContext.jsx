import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, setPersistence, browserSessionPersistence } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function login(email, password) {
        const env = import.meta.env;
        const adminEmails = [
            env.VITE_ADMIN_EMAIL1, env.VITE_ADMIN_EMAIL2, env.VITE_ADMIN_EMAIL3, 
            env.VITE_ADMIN_EMAIL4, env.VITE_ADMIN_EMAIL5, env.VITE_ADMIN_EMAIL6, 
            env.VITE_ADMIN_EMAIL7, env.VITE_ADMIN_EMAIL8, env.VITE_ADMIN_EMAIL9, 
            env.VITE_ADMIN_EMAIL10
        ];
        
        const lowerEmail = email.toLowerCase();
        const isAdm = adminEmails.some(adm => adm && lowerEmail === adm.toLowerCase());
        
        if (!isAdm) {
            return Promise.reject(new Error("ท่านไม่มีชื่อในระบบ"));
        }
        
        return setPersistence(auth, browserSessionPersistence)
            .then(() => signInWithEmailAndPassword(auth, email, password));
    }

    function logout() {
        return signOut(auth);
    }

    function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
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

    const value = {
        currentUser,
        isAdmin,
        isAdmin_2,
        login,
        logout,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
