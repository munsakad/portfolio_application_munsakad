'use client'
// Static GitHub Pages build: client-side version of app/dashboard/skills/page.js
import { useEffect, useState } from 'react'
import SkillsClient from './SkillsClient'

export default function SkillsPage() {
  const [skills, setSkills] = useState(null)
  useEffect(() => {
    fetch('/api/skills').then(r => r.json()).then(setSkills)
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Skills</h1>
        <p className="text-slate-400 text-sm">Add your technical and professional skills.</p>
      </div>
      {skills ? <SkillsClient initialSkills={skills} /> : <p className="text-slate-400 text-sm">Loading…</p>}
    </div>
  )
}
