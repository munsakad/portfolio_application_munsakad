'use client'
// Static GitHub Pages build: client-side version of app/dashboard/page.js
// (same markup; data from the API routes instead of direct SQLite queries)
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { currentUser } from '@/demo/mockApi'

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString + 'Z').getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function DashboardPage() {
  const user = currentUser()
  const [data, setData] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/activity?limit=6').then(r => r.json()),
    ]).then(([stats, projects, activity]) => setData({ stats, recentProjects: projects.slice(0, 4), recentActivity: activity }))
  }, [])

  if (!user || !data) return <p className="text-slate-400 text-sm">Loading…</p>
  const { totalProjects, totalSkills, categories: categoryRows } = data.stats
  const { recentProjects, recentActivity } = data
  const isEmpty = totalProjects === 0 && totalSkills === 0

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="text-slate-400 text-sm mt-1">Here&apos;s an overview of your portfolio.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Link href="/dashboard/projects"
          className="bg-slate-800 border border-slate-700 hover:border-cyan-500/40 rounded-2xl p-6 transition-colors group">
          <p className="text-slate-400 text-sm mb-2">Total Projects</p>
          <p className="text-4xl font-bold text-cyan-400">{totalProjects}</p>
          <p className="text-xs text-slate-500 mt-2 group-hover:text-slate-400 transition-colors">Manage projects →</p>
        </Link>

        <Link href="/dashboard/skills"
          className="bg-slate-800 border border-slate-700 hover:border-violet-500/40 rounded-2xl p-6 transition-colors group">
          <p className="text-slate-400 text-sm mb-2">Total Skills</p>
          <p className="text-4xl font-bold text-violet-400">{totalSkills}</p>
          <p className="text-xs text-slate-500 mt-2 group-hover:text-slate-400 transition-colors">Manage skills →</p>
        </Link>

        <Link href="/dashboard/projects"
          className="bg-slate-800 border border-slate-700 hover:border-emerald-500/40 rounded-2xl p-6 transition-colors group">
          <p className="text-slate-400 text-sm mb-2">Categories</p>
          <p className="text-4xl font-bold text-emerald-400">{categoryRows.length}</p>
          <p className="text-xs text-slate-500 mt-2 group-hover:text-slate-400 transition-colors">View breakdown →</p>
        </Link>
      </div>

      {categoryRows.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="font-semibold mb-5">Project Categories</h2>
          <div className="space-y-3">
            {categoryRows.map(row => (
              <div key={row.category} className="flex items-center gap-3">
                <span className="text-sm text-slate-300 w-44 truncate shrink-0">{row.category || 'Uncategorized'}</span>
                <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-cyan-500 h-2 rounded-full transition-all" style={{ width: `${Math.round((row.count / totalProjects) * 100)}%` }} />
                </div>
                <span className="text-xs text-slate-400 w-6 text-right shrink-0">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentProjects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Projects</h2>
            <Link href="/dashboard/projects" className="text-sm text-cyan-400 hover:text-cyan-300 transition">View all →</Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {recentProjects.map(p => (
              <div key={p.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium truncate">{p.title}</h3>
                  {p.category && <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded shrink-0">{p.category}</span>}
                </div>
                {p.description && <p className="text-xs text-slate-500 line-clamp-2 mb-2">{p.description}</p>}
                {p.tech_stack && <p className="text-xs text-slate-600 truncate">{p.tech_stack}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {recentActivity.length > 0 && (
        <div>
          <h2 className="font-semibold mb-4">Recent Activity</h2>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl divide-y divide-slate-700">
            {recentActivity.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <p className="text-sm text-slate-300">{a.description}</p>
                <span className="text-xs text-slate-500 shrink-0">{timeAgo(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isEmpty && (
        <div className="text-center py-16 bg-slate-800 border border-slate-700 rounded-2xl">
          <p className="text-slate-400 text-lg mb-2">Your portfolio is empty</p>
          <p className="text-slate-500 text-sm mb-6">Start by filling in your profile, then add projects and skills.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/profile" className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-5 py-2 rounded-lg text-sm transition">Edit Profile</Link>
            <Link href="/dashboard/projects" className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg text-sm transition">Add Projects</Link>
          </div>
        </div>
      )}
    </div>
  )
}
