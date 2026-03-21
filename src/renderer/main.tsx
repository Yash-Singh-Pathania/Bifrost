import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

/* Styles — Modular CSS Architecture */
import './styles/variables.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/glass.css'
import './styles/panels.css'
import './styles/toolbar.css'
import './styles/search.css'
import './styles/library.css'
import './styles/components.css'
import './styles/settings.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
