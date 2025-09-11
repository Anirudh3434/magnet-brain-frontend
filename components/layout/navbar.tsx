"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckSquare, LogOut, User } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

interface NavbarProps {
  onOpenAuth: () => void
}

export function Navbar({ onOpenAuth }: NavbarProps) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const getInitials = (name?: string) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <div
            onClick={() => router.push("/")}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <CheckSquare className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-foreground">TaskFlow</h1>
          </div>

          {/* Right side: Auth / Profile */}
          <div className="flex items-center space-x-4 relative">
            {user ? (
              <div className="relative" ref={menuRef}>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border rounded-md shadow-lg z-50">
                    <div className="p-2 flex flex-col gap-1 border-b">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(user as any).email || user.role}
                      </p>
                    </div>
                    <div
                      className="p-2 hover:bg-red-100 cursor-pointer flex items-center gap-2"
                      onClick={() => {
                        logout()
                        setMenuOpen(false)
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={onOpenAuth}>
                <User className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}