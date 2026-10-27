import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { preventPageZoom } from './lib/preventPageZoom'
import './index.css'
preventPageZoom()
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
