'use client'
// Static GitHub Pages build: client-side version of app/dashboard/profile/page.js
import { useEffect, useState } from 'react'
import ProfileForm from '../ProfileForm'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    fetch('/api/portfolio').then(r => r.json()).then(setProfile)
  }, [])

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Profile</h1>
        <p className="text-slate-400 text-sm">This information shows on your public portfolio page.</p>
      </div>
      {profile ? <ProfileForm profile={profile} /> : <p className="text-slate-400 text-sm">Loading…</p>}
    </div>
  )
}
