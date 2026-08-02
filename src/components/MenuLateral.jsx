import React from 'react'
import { useApp } from '../context/AppContext'

const opciones = [
  { id: 'bolsillos', label: '💰 Bolsillos' },
  { id: 'gastos', label: '💳 Gastos' },
  { id: 'suscripciones', label: '📅 Suscripciones' },
  { id: 'inversiones', label: '📈 Inversiones' },
  { id: 'deudas', label: '💸 Deudas' },
  { id: 'sueldo', label: '💵 Sueldo' },
  { id: 'reporte', label: '📊 Reporte' }
]

function MenuLateral() {
  const { vistaActual, setVistaActual } = useApp()

  return (
    <div className="menu-lateral">
      <div className="titulo">Mis Finanzas</div>
      {opciones.map(op => (
        <div
          key={op.id}
          className={`opcion ${vistaActual === op.id ? 'activa' : ''}`}
          onClick={() => setVistaActual(op.id)}
        >
          {op.label}
        </div>
      ))}
    </div>
  )
}

export default MenuLateral
