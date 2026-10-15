'use client'
// Static GitHub Pages build: client-side version of app/page.js. Same markup;
// the signed-in user's profile, projects and skills come from the API routes
// instead of direct SQLite queries.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { currentUser } from '@/demo/mockApi'

export default function Home() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [projects, setProjects] = useState([])
  const [skills, setSkills] = useState([])

  useEffect(() => {
    const u = currentUser()
    setUser(u)
    if (!u) return
    Promise.all([
      fetch('/api/portfolio').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/skills').then(r => r.json()),
    ]).then(([p, pr, sk]) => {
      setProfile(p)
      setProjects(pr)
      setSkills(sk)
    })
  }, [])

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur border-b border-slate-700 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-cyan-400">
            {profile?.name || 'Portfolio'}
          </span>
          <div className="flex items-center gap-6">
            {profile && (
              <>
                <a href="#about" className="text-sm text-slate-300 hover:text-white transition">About</a>
                <a href="#skills" className="text-sm text-slate-300 hover:text-white transition">Skills</a>
                <a href="#projects" className="text-sm text-slate-300 hover:text-white transition">Projects</a>
                <a href="#contact" className="text-sm text-slate-300 hover:text-white transition">Contact</a>
              </>
            )}
            {user ? (
              <Link
                href="/dashboard"
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg transition"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="text-sm text-slate-300 hover:text-white transition">Login</Link>
                <Link href="/auth/register" className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg transition">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero / Home Section */}
      <section id="home" className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {profile ? (
            <>
              <div className="w-24 h-24 bg-cyan-500 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl font-bold text-slate-900">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <h1 className="text-5xl font-bold mb-4">{profile.name}</h1>
              {profile.title && (
                <p className="text-xl text-cyan-400 mb-6">{profile.title}</p>
              )}
              {profile.bio && (
                <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
                  {profile.bio}
                </p>
              )}
              <div className="flex justify-center gap-4 flex-wrap">
                {profile.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-5 py-2.5 rounded-lg transition text-sm font-medium">
                    GitHub
                  </a>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 px-5 py-2.5 rounded-lg transition text-sm font-medium">
                    LinkedIn
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-5 py-2.5 rounded-lg transition text-sm font-medium">
                    Website
                  </a>
                )}
              </div>
            </>
          ) : (
            <>
              <h1 className="text-6xl font-bold mb-6">
                Build Your <span className="text-cyan-400">Portfolio</span>
              </h1>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                Create a professional portfolio to showcase your skills and projects. Register to get started.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/auth/register"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-8 py-3 rounded-xl text-lg transition">
                  Create Your Portfolio
                </Link>
                <Link href="/auth/login"
                  className="border border-slate-600 hover:border-slate-400 px-8 py-3 rounded-xl text-lg transition">
                  Login
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {profile && (
        <>
          {/* About Section */}
          <section id="about" className="py-20 px-6 bg-slate-800/40">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">About Me</h2>
              <div className="bg-slate-800 rounded-2xl p-8 grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-cyan-400 font-semibold mb-3">Who I Am</h3>
                  <p className="text-slate-300 leading-relaxed">
                    {profile.bio || 'No bio added yet.'}
                  </p>
                </div>
                <div>
                  <h3 className="text-cyan-400 font-semibold mb-3">Details</h3>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    {profile.location && <li>📍 {profile.location}</li>}
                    {profile.title && <li>💼 {profile.title}</li>}
                    {profile.github && <li>🐙 <a href={profile.github} className="hover:text-cyan-400 underline" target="_blank">{profile.github}</a></li>}
                    {profile.linkedin && <li>🔗 <a href={profile.linkedin} className="hover:text-cyan-400 underline" target="_blank">{profile.linkedin}</a></li>}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Skills Section */}
          {skills.length > 0 && (
            <section id="skills" className="py-20 px-6">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-8 text-center">Skills</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(skillsByCategory).map(([category, catSkills]) => (
                    <div key={category} className="bg-slate-800 rounded-2xl p-6">
                      <h3 className="text-cyan-400 font-semibold mb-4">{category}</h3>
                      <div className="flex flex-wrap gap-2">
                        {catSkills.map(skill => (
                          <span key={skill.id}
                            className="bg-slate-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5">
                            {skill.name}
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              skill.level === 'Expert' ? 'bg-green-600' :
                              skill.level === 'Advanced' ? 'bg-blue-600' :
                              skill.level === 'Intermediate' ? 'bg-yellow-600' : 'bg-slate-600'
                            }`}>{skill.level}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Projects Section */}
          {projects.length > 0 && (
            <section id="projects" className="py-20 px-6 bg-slate-800/40">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-8 text-center">Projects</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {projects.map(project => (
                    <div key={project.id} className="bg-slate-800 rounded-2xl overflow-hidden flex flex-col">
                      {project.image_url && (
                        <img src={project.image_url} alt={project.title} className="w-full h-44 object-cover" />
                      )}
                      <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                      {project.description && (
                        <p className="text-slate-400 text-sm mb-4 flex-1">{project.description}</p>
                      )}
                      {project.tech_stack && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {project.tech_stack.split(',').map(t => t.trim()).filter(Boolean).map(tech => (
                            <span key={tech} className="bg-slate-700 text-xs px-2 py-1 rounded">{tech}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-3 mt-auto">
                        {project.live_url && (
                          <a href={project.live_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 rounded-lg transition">
                            Live Demo
                          </a>
                        )}
                        {project.github_url && (
                          <a href={project.github_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition">
                            GitHub
                          </a>
                        )}
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Contact Section */}
          <section id="contact" className="py-20 px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Get In Touch</h2>
              <p className="text-slate-400 mb-8">
                Interested in working together? Reach out through any of the links below.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                {profile.github && (
                  <a href={profile.github} target="_blank" className="bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl transition font-medium">
                    GitHub
                  </a>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" className="bg-blue-700 hover:bg-blue-600 px-6 py-3 rounded-xl transition font-medium">
                    LinkedIn
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" className="bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl transition font-medium">
                    Website
                  </a>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      <footer className="border-t border-slate-700 py-6 text-center text-slate-500 text-sm">
        {profile ? `© ${new Date().getFullYear()} ${profile.name}` : 'Portfolio Platform'}
      </footer>
    </div>
  )
}
