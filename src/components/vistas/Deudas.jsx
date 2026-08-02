import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { client } from '../../db'
import Tarjeta from '../comunes/Tarjeta'
import Boton from '../comunes/Boton'
import Input from '../comunes/Input'

function Deudas() {
  const { data, refreshData } = useApp()
  const { deudas, abonos } = data
  const [detalleId, setDetalleId] = useState(null)
  const [nuevaDeuda, setNuevaDeuda] = useState({ nombre: '', monto_total: '' })
  const [montoAbono, setMontoAbono] = useState('')

  const totalDeudas = deudas.reduce((sum, d) => sum + d.monto_restante, 0)

  const crear = async () => {
    if (!nuevaDeuda.nombre || !nuevaDeuda.monto_total) return alert('Completa todos los campos')
    const monto = parseFloat(nuevaDeuda.monto_total)
    await client.execute({
      sql: 'INSERT INTO deudas (nombre, monto_total, monto_restante) VALUES (?, ?, ?)',
      args: [nuevaDeuda.nombre, monto, monto]
    })
    setNuevaDeuda({ nombre: '', monto_total: '' })
    refreshData()
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta deuda?')) return
    await client.execute({ sql: 'DELETE FROM deudas WHERE id = ?', args: [id] })
    if (detalleId === id) setDetalleId(null)
    refreshData()
  }

  const abonar = async (deudaId, monto) => {
    if (monto <= 0) return alert('Monto debe ser mayor a 0')
    const deuda = deudas.find(d => d.id === deudaId)
    if (monto > deuda.monto_restante) return alert('El abono no puede superar el saldo restante')
    await client.execute({
      sql: 'INSERT INTO abonos_deuda (deuda_id, monto) VALUES (?, ?)',
      args: [deudaId, monto]
    })
    const nuevoRestante = deuda.monto_restante - monto
    await client.execute({
      sql: 'UPDATE deudas SET monto_restante = ? WHERE id = ?',
      args: [nuevoRestante, deudaId]
    })
    setMontoAbono('')
    refreshData()
  }

  const deudaDetalle = deudas.find(d => d.id === detalleId)
  const abonosDeuda = abonos.filter(a => a.deuda_id === detalleId)

  return (
    <div>
      <h2>Deudas</h2>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <Input placeholder="Nombre" value={nuevaDeuda.nombre} onChange={e => setNuevaDeuda({...nuevaDeuda, nombre: e.target.value})} />
        <Input type="number" placeholder="Monto total" value={nuevaDeuda.monto_total} onChange={e => setNuevaDeuda({...nuevaDeuda, monto_total: e.target.value})} style={{ width: '150px' }} />
        <Boton onClick={crear}>Agregar</Boton>
      </div>

      {detalleId ? (
        <div>
          <Boton onClick={() => setDetalleId(null)}>← Volver</Boton>
          {deudaDetalle && (
            <div className="tarjeta">
              <h3>{deudaDetalle.nombre}</h3>
              <p>Total: ${deudaDetalle.monto_total.toFixed(2)}</p>
              <p>Restante: ${deudaDetalle.monto_restante.toFixed(2)}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Input type="number" placeholder="Monto abono" value={montoAbono} onChange={e => setMontoAbono(e.target.value)} style={{ width: '150px' }} />
                <Boton onClick={() => abonar(deudaDetalle.id, parseFloat(montoAbono))}>Abonar</Boton>
                <Boton className="boton-peligro" onClick={() => eliminar(deudaDetalle.id)}>Eliminar</Boton>
              </div>
              <div style={{ marginTop: '20px' }}>
                <h4>Abonos</h4>
                {abonosDeuda.map(a => (
                  <div key={a.id} className="lista-item">
                    <span>{new Date(a.fecha).toLocaleDateString()}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--green)' }}>-${a.monto.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid-tarjetas">
            {deudas.map(d => (
              <Tarjeta key={d.id} onClick={() => setDetalleId(d.id)} style={{ cursor: 'pointer' }}>
                <div style={{ fontWeight: 'bold' }}>{d.nombre}</div>
                <div style={{ fontSize: '20px' }}>${d.monto_restante.toFixed(2)}</div>
                <div className="texto-secundario">Total: ${d.monto_total.toFixed(2)}</div>
              </Tarjeta>
            ))}
          </div>
          <div style={{ marginTop: '20px', fontWeight: 'bold', fontSize: '18px' }}>Total adeudado: ${totalDeudas.toFixed(2)}</div>
        </>
      )}
    </div>
  )
}

export default Deudas
