// In-browser stand-in for the portfolio app's API routes (app/api/*), used
// only by the static GitHub Pages build. Same validation, messages and side
// effects (activity log + notifications); the SQLite tables become arrays in
// this visitor's localStorage and the JWT cookie becomes a local session.
import { HttpError, checkPassword, createAuth, createDb, hashPassword, installFetch, json } from './runtime.js'
import { mountDemoPanel } from './demoPanel.js'

const REPO_URL = 'https://github.com/munsakad/portfolio_application_munsakad'
const PAGES = 'https://munsakad.github.io/'

// SQLite CURRENT_TIMESTAMP format (UTC, no "Z"); the UI appends "Z" when parsing
const sqlNow = () => new Date().toISOString().replace('T', ' ').slice(0, 19)
const SEEDED_AT = '2026-10-01 12:00:00'

// Demo account pre-filled with my real portfolio content
const project = (id, title, description, tech_stack, category, repo, live) => ({
  id, user_id: 1, title, description, tech_stack, category,
  github_url: 'https://github.com/munsakad/' + repo,
  live_url: live ? PAGES + repo + '/' : '',
  image_url: '', created_at: SEEDED_AT, updated_at: SEEDED_AT,
})
const SEED = {
  users: [{
    id: 1,
    name: 'Dingani Munsaka',
    email: 'demo@portfolio.dev',
    seedPassword: 'demo1234',
    title: 'Software & Hardware Engineer',
    bio: 'CS + Engineering Technologies student at Berea College building full-stack web apps, AI-assisted tools and distributed systems.',
    github: 'https://github.com/munsakad',
    linkedin: 'https://linkedin.com/in/dingani-munsaka',
    website: 'https://munsakad.github.io',
    location: 'Berea, KY',
    avatar_url: '',
    created_at: SEEDED_AT,
  }],
  projects: [
    project(1, 'Sentry: Real-Time Fraud Detection', 'Random Forest, XGBoost and a PyTorch MLP scoring a live transaction stream, compared on precision, recall and PR-AUC.', 'Python, FastAPI, PyTorch, XGBoost, React', 'AI / ML', 'Fraud-Detection-System', true),
    project(2, 'Cortex: AI Business Intelligence', 'Upload a CSV; Gemini designs dashboards and writes SQL that runs read-only against the real data, plus forecasting.', 'Python, FastAPI, SQLite, Gemini API, React', 'AI / ML', 'Business-Intelligence-Platform', true),
    project(3, 'CodeMentor AI', 'Gemini code review side by side with a trained PyTorch structural risk model.', 'Next.js, FastAPI, Gemini API, PyTorch, Zod', 'AI / ML', 'AI-Coding-Assistant', true),
    project(4, 'ATS Resume Builder', 'ATS match scoring, tailored cover letters and client-side PDF export.', 'Next.js, FastAPI, Gemini API, Pydantic, Zod', 'Full Stack', 'ATS-Resume-Builder-and-Cover-letter-Generation', true),
    project(5, 'AI Study Companion', 'Notes to flashcards and quizzes, SM-2 spaced repetition and mastery analytics.', 'Next.js, Prisma, NextAuth, Gemini API', 'Full Stack', 'AI-Study-Companion', true),
    project(6, 'Distributed Cloud File Storage', 'gRPC storage service with 1 MiB chunking, AES-256-GCM, versioning and replica failover.', 'TypeScript, gRPC, Kubernetes, Terraform, AWS S3', 'Systems', 'Distributed-Cloud-File-Storage', true),
    project(7, 'DMHardware AI Chatbot', 'Gemini chatbot grounded with TF-IDF retrieval over a curated hardware knowledge base.', 'Python, Gemini API, Scikit-Learn, Pandas', 'AI / ML', 'DMHardware-Chat-Bot', true),
    project(8, 'Trailmark', 'Responsive React travel site built from reusable, accessible components.', 'React, Vite, CSS Modules', 'Frontend', 'Travel-Trail-Mark-APP', true),
  ],
  skills: [
    ['JavaScript', 'Languages', 'Advanced'], ['TypeScript', 'Languages', 'Advanced'], ['Python', 'Languages', 'Advanced'], ['SQL', 'Languages', 'Intermediate'],
    ['React', 'Frontend', 'Advanced'], ['Next.js', 'Frontend', 'Advanced'], ['Tailwind CSS', 'Frontend', 'Advanced'],
    ['FastAPI', 'Backend', 'Advanced'], ['MySQL', 'Backend', 'Intermediate'], ['Docker', 'Infrastructure', 'Intermediate'],
    ['PyTorch', 'AI / ML', 'Intermediate'], ['Gemini API', 'AI / ML', 'Advanced'],
  ].map(([name, category, level], i) => ({ id: i + 1, user_id: 1, name, category, level, created_at: SEEDED_AT })),
  activity_log: [{ id: 1, user_id: 1, action: 'account_created', entity_type: 'user', description: 'Account created', created_at: SEEDED_AT }],
  notifications: [{ id: 1, user_id: 1, title: 'Welcome!', message: 'Welcome to your portfolio dashboard, Dingani Munsaka.', is_read: 0, created_at: SEEDED_AT }],
}

const db = createDb('portfolio', SEED)
const auth = createAuth('portfolio')
const nextId = (rows) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1
// ORDER BY created_at DESC, newest insert first on ties
const newest = (a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id

// lib/activity.js
function logActivity(data, userId, action, entityType, description) {
  data.activity_log.push({ id: nextId(data.activity_log), user_id: userId, action, entity_type: entityType || '', description, created_at: sqlNow() })
}
function notify(data, userId, title, message) {
  data.notifications.push({ id: nextId(data.notifications), user_id: userId, title, message: message || '', is_read: 0, created_at: sqlNow() })
}

const publicProfile = ({ id, name, email, title, bio, github, linkedin, website, location, avatar_url }) => ({ id, name, email, title, bio, github, linkedin, website, location, avatar_url })

export function currentUser() {
  return auth.getSession()?.user ?? null
}

function requireUser() {
  const user = currentUser()
  if (!user) throw new HttpError(401, 'Unauthorized')
  return user
}

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

async function handle(path, init, url) {
  const method = (init.method || 'GET').toUpperCase()
  const body = () => JSON.parse(init.body || '{}')
  let m

  if (path === '/api/auth/login' && method === 'POST') {
    const { email, password } = body()
    if (!email || !password) return json({ error: 'Email and password required' }, 400)
    const user = db.read().users.find((u) => u.email === email)
    if (!user || !(await checkPassword(user, password))) return json({ error: 'Invalid credentials' }, 401)
    auth.setSession({ id: user.id, email: user.email, name: user.name })
    return json({ message: 'Logged in', name: user.name })
  }

  if (path === '/api/auth/register' && method === 'POST') {
    const { name, email, password } = body()
    if (!name || !email || !password) return json({ error: 'All fields are required' }, 400)
    if (password.length < 6) return json({ error: 'Password must be at least 6 characters' }, 400)
    if (db.read().users.some((u) => u.email === email)) return json({ error: 'Email already registered' }, 409)
    const passwordHash = await hashPassword(password)
    const id = db.write((data) => {
      const id = nextId(data.users)
      data.users.push({ id, name, email, passwordHash, title: '', bio: '', github: '', linkedin: '', website: '', location: '', avatar_url: '', created_at: sqlNow() })
      logActivity(data, id, 'account_created', 'user', 'Account created')
      notify(data, id, 'Welcome!', 'Welcome to your portfolio dashboard, ' + name + '.')
      return id
    })
    auth.setSession({ id, email, name })
    return json({ message: 'Registered successfully' }, 201)
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    auth.setSession(null)
    return json({ message: 'Logged out' })
  }

  const user = requireUser()
  const mine = (rows) => rows.filter((r) => r.user_id === user.id)

  if (path === '/api/portfolio') {
    if (method === 'GET') return json(publicProfile(db.read().users.find((u) => u.id === user.id)))
    if (method === 'PUT') {
      const { name, title, bio, github, linkedin, website, location, avatar_url } = body()
      db.write((data) => {
        Object.assign(data.users.find((u) => u.id === user.id), { name, title, bio, github, linkedin, website, location, avatar_url: avatar_url || '' })
        logActivity(data, user.id, 'profile_updated', 'user', 'Updated profile information')
        notify(data, user.id, 'Profile updated', 'Your profile information was saved.')
      })
      return json({ message: 'Profile updated' })
    }
  }

  if (path === '/api/portfolio/password' && method === 'PATCH') {
    const { currentPassword, newPassword } = body()
    if (!currentPassword || !newPassword) return json({ error: 'Current and new password are required' }, 400)
    if (newPassword.length < 6) return json({ error: 'New password must be at least 6 characters' }, 400)
    const record = db.read().users.find((u) => u.id === user.id)
    if (!(await checkPassword(record, currentPassword))) return json({ error: 'Current password is incorrect' }, 401)
    const passwordHash = await hashPassword(newPassword)
    db.write((data) => {
      const u = data.users.find((x) => x.id === user.id)
      u.passwordHash = passwordHash
      delete u.seedPassword
      logActivity(data, user.id, 'password_changed', 'user', 'Changed account password')
      notify(data, user.id, 'Password changed', 'Your account password was updated successfully.')
    })
    return json({ message: 'Password updated' })
  }

  if (path === '/api/projects') {
    if (method === 'GET') return json(mine(db.read().projects).sort(newest))
    if (method === 'POST') {
      const { title, description, tech_stack, live_url, github_url, image_url, category } = body()
      if (!title) return json({ error: 'Title is required' }, 400)
      const created = db.write((data) => {
        const now = sqlNow()
        const p = {
          id: nextId(data.projects), user_id: user.id, title, description: description || '', tech_stack: tech_stack || '',
          live_url: live_url || '', github_url: github_url || '', image_url: image_url || '', category: category || 'Other',
          created_at: now, updated_at: now,
        }
        data.projects.push(p)
        logActivity(data, user.id, 'project_created', 'project', 'Created project "' + p.title + '"')
        notify(data, user.id, 'Project created', '"' + p.title + '" was added to your portfolio.')
        return p
      })
      return json(created, 201)
    }
  }

  if ((m = path.match(/^\/api\/projects\/(\d+)$/))) {
    const id = Number(m[1])
    const existing = mine(db.read().projects).find((p) => p.id === id)
    if (!existing) return json({ error: 'Not found' }, 404)
    if (method === 'PUT') {
      const { title, description, tech_stack, live_url, github_url, image_url, category } = body()
      const updated = db.write((data) => {
        const p = data.projects.find((x) => x.id === id)
        Object.assign(p, { title, description, tech_stack, live_url, github_url, image_url: image_url ?? p.image_url, category: category ?? p.category, updated_at: sqlNow() })
        logActivity(data, user.id, 'project_updated', 'project', 'Updated project "' + p.title + '"')
        notify(data, user.id, 'Project updated', '"' + p.title + '" was updated.')
        return p
      })
      return json(updated)
    }
    if (method === 'DELETE') {
      db.write((data) => {
        data.projects = data.projects.filter((p) => p.id !== id)
        logActivity(data, user.id, 'project_deleted', 'project', 'Deleted project "' + existing.title + '"')
        notify(data, user.id, 'Project deleted', '"' + existing.title + '" was removed from your portfolio.')
      })
      return json({ message: 'Deleted' })
    }
  }

  if (path === '/api/skills') {
    const sorted = () => mine(db.read().skills).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
    if (method === 'GET') return json(sorted())
    if (method === 'POST') {
      const { name, category, level } = body()
      if (!name) return json({ error: 'Name is required' }, 400)
      const skill = db.write((data) => {
        const s = { id: nextId(data.skills), user_id: user.id, name, category: category || 'General', level: level || 'Intermediate', created_at: sqlNow() }
        data.skills.push(s)
        logActivity(data, user.id, 'skill_created', 'skill', 'Added skill "' + s.name + '"')
        return s
      })
      return json(skill, 201)
    }
  }

  if ((m = path.match(/^\/api\/skills\/(\d+)$/))) {
    const id = Number(m[1])
    const existing = mine(db.read().skills).find((s) => s.id === id)
    if (!existing) return json({ error: 'Not found' }, 404)
    if (method === 'PUT') {
      const { name, category, level } = body()
      return json(db.write((data) => {
        const s = data.skills.find((x) => x.id === id)
        Object.assign(s, { name, category, level })
        logActivity(data, user.id, 'skill_updated', 'skill', 'Updated skill "' + s.name + '"')
        return s
      }))
    }
    if (method === 'DELETE') {
      db.write((data) => {
        data.skills = data.skills.filter((s) => s.id !== id)
        logActivity(data, user.id, 'skill_deleted', 'skill', 'Deleted skill "' + existing.name + '"')
      })
      return json({ message: 'Deleted' })
    }
  }

  if (path === '/api/notifications') {
    if (method === 'GET') {
      const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 50)
      const all = mine(db.read().notifications)
      return json({ notifications: all.sort(newest).slice(0, limit), unreadCount: all.filter((n) => !n.is_read).length })
    }
    if (method === 'PATCH') {
      db.write((data) => data.notifications.forEach((n) => n.user_id === user.id && (n.is_read = 1)))
      return json({ message: 'All notifications marked as read' })
    }
  }

  if ((m = path.match(/^\/api\/notifications\/(\d+)$/))) {
    const id = Number(m[1])
    if (!mine(db.read().notifications).some((n) => n.id === id)) return json({ error: 'Not found' }, 404)
    if (method === 'PATCH') {
      db.write((data) => (data.notifications.find((n) => n.id === id).is_read = 1))
      return json({ message: 'Marked as read' })
    }
    if (method === 'DELETE') {
      db.write((data) => (data.notifications = data.notifications.filter((n) => n.id !== id)))
      return json({ message: 'Deleted' })
    }
  }

  if (path === '/api/activity') {
    const limit = Math.min(Number(url.searchParams.get('limit')) || 10, 50)
    return json(mine(db.read().activity_log).sort(newest).slice(0, limit))
  }

  if (path === '/api/dashboard/stats') {
    const projects = mine(db.read().projects)
    const counts = new Map()
    projects.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1))
    return json({
      totalProjects: projects.length,
      totalSkills: mine(db.read().skills).length,
      categories: [...counts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
    })
  }

  if (path === '/api/upload' && method === 'POST') {
    const file = init.body.get('file')
    if (!file) return json({ error: 'No file provided' }, 400)
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type))
      return json({ error: 'Only image files are allowed (jpg, png, webp, gif)' }, 400)
    // browser storage is much smaller than a disk, so the demo caps uploads lower than the 5MB server limit
    if (file.size > 1024 * 1024) return json({ error: 'In this static demo, images must be under 1MB' }, 400)
    return json({ url: await readFileAsDataUrl(file) })
  }

  return json({ error: 'Not found' }, 404)
}

let installed = false
export function installDemo() {
  if (installed) return
  installed = true
  installFetch(handle)
}

let panelMounted = false
export function mountPanel() {
  if (panelMounted) return
  panelMounted = true
  mountDemoPanel({
    repoUrl: REPO_URL,
    gemini: false,
    note:
      'Static build: the Next.js API routes run in your browser and the SQLite tables live in localStorage. ' +
      'Sign in with <b>demo@portfolio.dev / demo1234</b> to see a filled-in portfolio, or register your own.',
  })
}
