'use client'
// Static GitHub Pages build only (copied in by demo/apply.mjs): routes /api/*
// to the in-browser handlers before any page fetches.
import { useEffect } from 'react'
import { installDemo, mountPanel } from '@/demo/mockApi'

if (typeof window !== 'undefined') installDemo()

export default function DemoBoot() {
  useEffect(() => {
    mountPanel()
  }, [])
  return null
}
