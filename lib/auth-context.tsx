"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"
import { cookies } from "next/headers"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: { name: string; role: string } | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Configure axios defaults
axios.defaults.withCredentials = true
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await axios.post("/api/v1/user/auth-check")
      const userData = response.data.user
      if (userData) {
        setUser({ name: userData.name, role: userData.role })
        localStorage.setItem("user", JSON.stringify({ name: userData.name, role: userData.role }))
      } else {
        setUser(null)
        localStorage.removeItem("user")
      }
    } catch (error) {
      setUser(null)
      localStorage.removeItem("user")
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post("/api/v1/user/login", { email, password })
      const userData = response.data.user
      setUser({ name: userData.name, role: userData.role })
      localStorage.setItem("user", JSON.stringify({ name: userData.name, role: userData.role }))
    } catch (error) {
      throw error
    }
  }

  const register = async (name: string, email: string, password: string, role: string) => {
    try {
      const response = await axios.post("/api/v1/user/register", { name, email, password, role })
      console.log(response.data)
      const userData = response.data.user

      setUser({ name: userData.name, role: userData.role })
      localStorage.setItem("user", JSON.stringify({ name: userData.name, role: userData.role }))
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await axios.post("/api/v1/user/logout")
   
    } catch {
      // ignore errors
    } finally {
      setUser(null)
      localStorage.removeItem("user")
    }
  }

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}