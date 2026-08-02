import React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import MenuLateral from './components/MenuLateral'
import Bolsillos from './components/vistas/Bolsillos'
import Gastos from './components/vistas/Gastos'
import Suscripciones from './components/vistas/Suscripciones'
import Inversiones from './components/vistas/Inversiones'
import Deudas from './components/vistas/Deudas'
import Sueldo from './components/vistas/Sueldo'
import Reporte from './components/vistas/Reporte'

function AppContent() {
  const { vistaActual, cargando } = useApp()

  if (cargando) {
    return <div className="loading">Cargando...</div>
  }

  const renderVista = () => {
    switch (vistaActual) {
      case 'bolsillos': return <Bolsillos />
      case 'gastos': return <Gastos />
      case 'suscripciones': return <Suscripciones />
      case 'inversiones': return <Inversiones />
      case 'deudas': return <Deudas />
      case 'sueldo': return <Sueldo />
      case 'reporte': return <Reporte />
      default: return <Bolsillos />
    }
  }

  return (
    <div className="app-layout">
      <MenuLateral />
      <div className="panel-principal">
        {renderVista()}
      </div>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
