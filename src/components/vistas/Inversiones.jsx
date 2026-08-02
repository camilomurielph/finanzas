import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { client } from '../../db'
import Tarjeta from '../comunes/Tarjeta'
import Boton from '../comunes/Boton'
import Input from '../comunes/Input'

function Inversiones() {
  const { data, refreshData } = useApp()
  const { inversiones, movimientosInversion } = data
  const [detalleId, setDetalleId] = useState(null)
  const [nuevaInv, setNuevaInv] = useState({ nombre: '', tipo: 'acciones', fecha_inicio: '', monto_invertido: '', valor_actual: '' })

  const crear = async () => {
    if (!nuevaInv.nombre || !nuevaInv.fecha_inicio || !nuevaInv.monto_invertido) return alert('Completa campos obligatorios')
    const montoInv = parseFloat(nuevaInv.monto_invertido)
    const valorAct = nuevaInv.valor_actual ? parseFloat(nuevaInv.valor_actual) : montoInv
    await client.execute({
      sql: `INSERT INTO inversiones (nombre, tipo, fecha_inicio, monto_invertido, valor_actual) VALUES (?, ?, ?, ?, ?)`,
      args: [nuevaInv.nombre, nuevaInv.tipo, nuevaInv.fecha_inicio, montoInv, valorAct]
    })
    setNuevaInv({ nombre: '', tipo: 'acciones', fecha_inicio: '', monto_invertido: '', valor_actual: '' })
    refreshData()
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta inversión?')) return
    await client.execute({ sql: 'DELETE FROM inversiones WHERE id = ?', args: [id] })
    if (detalleId === id) setDetalleId(null)
    refreshData()
  }

  const actualizarValorActual = async (id, nuevoValor) => {
    await client.execute({
      sql: 'UPDATE inversiones SET valor_actual = ? WHERE id = ?',
      args: [parseFloat(nuevoValor), id]
    })
    refreshData()
  }

  const agregarMovimiento = async (invId, tipo, monto) => {
    if (monto <= 0) return alert('Monto debe ser mayor a 0')
    await client.execute({
      sql: 'INSERT INTO movimientos_inversion (inversion_id, tipo, monto) VALUES (?, ?, ?)',
      args: [invId, tipo, monto]
    })
    // Actualizar valor_actual de la inversión (sumar o restar según tipo)
    const inv = inversiones.find(i => i.id === invId)
    const nuevoValor = tipo === 'aporte' ? inv.valor_actual + monto : inv.valor_actual - monto
    await client.execute({
      sql: 'UPDATE inversiones SET valor_actual = ? WHERE id = ?',
      args: [nuevoValor, invId]
    })
    refreshData()
  }

  const invDetalle = inversiones.find(i => i.id === detalleId)
  const movsInv = movimientosInversion.filter(m => m.inversion_id === detalleId)

  return (
    <div>
      <h2>Inversiones</h2>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <Input placeholder="Nombre" value={nuevaInv.nombre} onChange={e => setNuevaInv({...nuevaInv, nombre: e.target.value})} />
        <select value={nuevaInv.tipo} onChange={e => setNuevaInv({...nuevaInv, tipo: e.target.value})} className="input" style={{ width: 'auto' }}>
          <option value="acciones">Acciones</option>
          <option value="fondos">Fondos</option>
          <option value="cripto">Cripto</option>
          <option value="inmuebles">Inmuebles</option>
          <option value="otros">Otros</option>
        </select>
        <Input type="date" value={nuevaInv.fecha_inicio} onChange={e => setNuevaInv({...nuevaInv, fecha_inicio: e.target.value})} style={{ width: '150px' }} />
        <Input type="number" placeholder="Monto invertido" value={nuevaInv.monto_invertido} onChange={e => setNuevaInv({...nuevaInv, monto_invertido: e.target.value})} style={{ width: '140px' }} />
        <Input type="number" placeholder="Valor actual (opcional)" value={nuevaInv.valor_actual} onChange={e => setNuevaInv({...nuevaInv, valor_actual: e.target.value})} style={{ width: '140px' }} />
        <Boton onClick={crear}>Crear</Boton>
      </div>

      {detalleId ? (
        <div>
          <Boton onClick={() => setDetalleId(null)} style={{ marginBottom: '16px' }}>← Volver</Boton>
          {invDetalle && (
            <div className="tarjeta">
              <h3>{invDetalle.nombre}</h3>
              <p>Tipo: {invDetalle.tipo}</p>
              <p>Fecha inicio: {new Date(invDetalle.fecha_inicio).toLocaleDateString()}</p>
              <p>Monto invertido: ${invDetalle.monto_invertido.toFixed(2)}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>Valor actual:</span>
                <Input
                  type="number"
                  value={invDetalle.valor_actual}
                  onChange={(e) => actualizarValorActual(invDetalle.id, e.target.value)}
                  style={{ width: '150px' }}
                />
                <span style={{ marginLeft: '12px', fontWeight: 'bold' }}>
                  Rendimiento: {((invDetalle.valor_actual - invDetalle.monto_invertido) / invDetalle.monto_invertido * 100).toFixed(2)}%
                </span>
              </div>
              <div style={{ marginTop: '16px' }}>
                <h4>Agregar movimiento</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Input type="number" placeholder="Monto" id="montoMov" style={{ width: '120px' }} />
                  <Boton onClick={() => {
                    const monto = parseFloat(document.getElementById('montoMov').value)
                    agregarMovimiento(invDetalle.id, 'aporte', monto)
                  }}>Aporte</Boton>
                  <Boton className="boton-peligro" onClick={() => {
                    const monto = parseFloat(document.getElementById('montoMov').value)
                    agregarMovimiento(invDetalle.id, 'retiro', monto)
                  }}>Retiro</Boton>
                </div>
              </div>
              <div style={{ marginTop: '20px' }}>
                <h4>Movimientos</h4>
                {movsInv.map(m => (
                  <div key={m.id} className="lista-item">
                    <span>{new Date(m.fecha).toLocaleDateString()}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: m.tipo === 'aporte' ? 'var(--green)' : 'var(--red)' }}>
                      {m.tipo === 'aporte' ? '+' : '-'} ${m.monto.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <Boton className="boton-peligro" onClick={() => eliminar(invDetalle.id)}>Eliminar inversión</Boton>
            </div>
          )}
        </div>
      ) : (
        <div className="grid-tarjetas">
          {inversiones.map(inv => {
            const rendimiento = ((inv.valor_actual - inv.monto_invertido) / inv.monto_invertido * 100)
            return (
              <Tarjeta key={inv.id} onClick={() => setDetalleId(inv.id)} style={{ cursor: 'pointer' }}>
                <div style={{ fontWeight: 'bold' }}>{inv.nombre}</div>
                <div style={{ fontSize: '20px' }}>${inv.valor_actual.toFixed(2)}</div>
                <div style={{ fontSize: '14px', color: rendimiento >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {rendimiento >= 0 ? '+' : ''}{rendimiento.toFixed(2)}%
                </div>
                <div className="texto-secundario" style={{ fontSize: '12px' }}>{inv.tipo}</div>
              </Tarjeta>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Inversiones
