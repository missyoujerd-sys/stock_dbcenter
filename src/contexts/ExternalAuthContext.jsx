import React, { createContext, useContext, useState, useEffect } from 'react';

const ExternalAuthContext = createContext(null);

export function useExternalAuth() {
  return useContext(ExternalAuthContext);
}

export function ExternalAuthProvider({ children }) {
  const [externalUser, setExternalUser] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('external_user');
    if (stored) {
      try {
        setExternalUser(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem('external_user');
      }
    }
  }, []);

  function loginExternal(firstName, lastName, company = '') {
    const user = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company.trim(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      loginAt: new Date().toISOString(),
    };
    sessionStorage.setItem('external_user', JSON.stringify(user));
    setExternalUser(user);
  }

  function logoutExternal() {
    sessionStorage.removeItem('external_user');
    setExternalUser(null);
  }

  const value = {
    externalUser,
    loginExternal,
    logoutExternal,
    isExternalLoggedIn: !!externalUser,
  };

  return (
    <ExternalAuthContext.Provider value={value}>
      {children}
    </ExternalAuthContext.Provider>
  );
}
