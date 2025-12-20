"use client"

import * as React from "react"

export const AuthContext = React.createContext({})

export function AuthProvider({ children }) {
    return (
        <AuthContext.Provider value={{}}>
            {children}
        </AuthContext.Provider>
    )
}
