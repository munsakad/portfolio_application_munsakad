'use client'
// Static GitHub Pages build: client-side version of app/dashboard/projects/page.js
import { useEffect, useState } from 'react'
import ProjectsClient from './ProjectsClient'

export default function ProjectsPage() {
  const [projects, setProjects] = useState(null)
  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects)
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Projects</h1>
        <p className="text-slate-400 text-sm">Add and manage your projects. They appear on your public portfolio.</p>
      </div>
      {projects ? <ProjectsClient initialProjects={projects} /> : <p className="text-slate-400 text-sm">Loading…</p>}
    </div>
  )
}
