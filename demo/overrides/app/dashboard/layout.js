'use client'
// Static GitHub Pages build: client-side version of app/dashboard/layout.js
// (replaces middleware.js + the server-side JWT check)
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardShell from './DashboardShell'
import { currentUser } from '@/demo/mockApi'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const u = currentUser()
    if (!u) router.replace('/auth/login')
    else setUser(u)
  }, [router])

  if (!user) return <div className="min-h-screen bg-slate-900" />
  return <DashboardShell user={user}>{children}</DashboardShell>
}
