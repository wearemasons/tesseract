import './assets/main.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Apply theme before render to avoid flash
const savedTheme = (localStorage.getItem('theme') ?? '"dark"').replace(/"/g, '')
const html = document.documentElement
html.classList.remove('light', 'dark')
if (savedTheme === 'system') {
  html.classList.add(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )
} else {
  html.classList.add(savedTheme)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)