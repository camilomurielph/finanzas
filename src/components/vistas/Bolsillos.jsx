import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { client } from '../../db'
import Tarjeta from '../comunes/Tarjeta'
import Boton from '../comunes/Boton'
import Input from '../comunes/Input'

function Bolsillos() {
  const { data, refreshData } = useApp()
  const { bolsillos, movimientosBolsillo } = data
  const [mostrarDetalle, setMostrarDetalle] = useState(null) // id del bolsillo seleccionado
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')
  const [tipoMov, setTipoMov] = useState('ingreso') // 'ingreso' o 'egreso'

  const bolsilloSeleccionado = bolsillos.find(b => b.id === mostrarDetalle)
  const movs = movimientosBolsillo.filter(m => m.bolsillo_id === mostrarDetalle)

  const crearBolsillo = async () => {
    if (!nombre.trim()) return alert('Ingresa un nombre')
    await client.execute({
      sql: 'INSERT INTO bolsillos (nombre, monto_actual) VALUES (?, ?)',
      args: [nombre, 0]
    })
    setNombre('')
    refreshData()
  }

  const eliminarBolsillo = async (id) => {
    if (!confirm('¿Eliminar este bolsillo?')) return
    await client.execute({
      sql: 'DELETE FROM bolsillos WHERE id = ?',
      args: [id]
    })
    if (mostrarDetalle === id) setMostrarDetalle(null)
    refreshData()
  }

  const editarNombre = async (id, nuevoNombre) => {
    await client.execute({
      sql: 'UPDATE bolsillos SET nombre = ? WHERE id = ?',
      args: [nuevoNombre, id]
    })
    refreshData()
  }

  const registrarMovimiento = async (bolsilloId, tipo, montoVal) => {
    if (montoVal <= 0) return alert('El monto debe ser mayor a 0')
    // Insertar movimiento
    await client.execute({
      sql: 'INSERT INTO movimientos_bolsillo (bolsillo_id, tipo, monto) VALUES (?, ?, ?)',
      args: [bolsilloId, tipo, montoVal]
    })
    // Actualizar monto actual del bolsillo
    const bolsillo = bolsillos.find(b => b.id === bolsilloId)
    const nuevoMonto = tipo === 'ingreso'
      ? bolsillo.monto_actual + montoVal
      : bolsillo.monto_actual - montoVal
    await client.execute({
      sql: 'UPDATE bolsillos SET monto_actual = ? WHERE id = ?',
      args: [nuevoMonto, bolsilloId]
    })
    setMonto('')
    refreshData()
  }

  return (
    <div>
      <h2>Bolsillos</h2>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del nuevo bolsillo"
          style={{ flex: 1 }}
        />
        <Boton onClick={crearBolsillo}>Crear</Boton>
      </div>

      {mostrarDetalle ? (
        <div>
          <Boton onClick={() => setMostrarDetalle(null)} style={{ marginBottom: '16px' }}>← Volver</Boton>
          {bolsilloSeleccionado && (
            <div className="tarjeta">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>
                  <Input
                    value={bolsilloSeleccionado.nombre}
                    onChange={(e) => editarNombre(bolsilloSeleccionado.id, e.target.value)}
                    style={{ fontSize: '20px', fontWeight: 'bold', width: 'auto', background: 'transparent', border: '1px solid transparent' }}
                    onBlur={() => refreshData()}
                  />
                </h3>
                <Boton onClick={() => eliminarBolsillo(bolsilloSeleccionado.id)} className="boton-peligro">Eliminar</Boton>
              </div>
              <p>Monto actual: <strong>${bolsilloSeleccionado.monto_actual.toFixed(2)}</strong></p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                <Input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Monto"
                  style={{ width: '150px' }}
                />
                <Boton onClick={() => registrarMovimiento(bolsilloSeleccionado.id, 'ingreso', parseFloat(monto))}>Añadir</Boton>
                <Boton onClick={() => registrarMovimiento(bolsilloSeleccionado.id, 'egreso', parseFloat(monto))} className="boton-peligro">Retirar</Boton>
              </div>
              <div style={{ marginTop: '20px' }}>
                <h4>Movimientos</h4>
                {movs.length === 0 && <p className="texto-secundario">Sin movimientos</p>}
                {movs.map(m => (
                  <div key={m.id} className="lista-item">
                    <span>{new Date(m.fecha).toLocaleDateString()}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: m.tipo === 'ingreso' ? 'var(--green)' : 'var(--red)' }}>
                      {m.tipo === 'ingreso' ? '+' : '-'} ${m.monto.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid-tarjetas">
          {bolsillos.map(b => (
            <Tarjeta
              key={b.id}
              onClick={() => setMostrarDetalle(b.id)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{b.nombre}</div>
              <div style={{ fontSize: '24px', marginTop: '8px' }}>${b.monto_actual.toFixed(2)}</div>
            </Tarjeta>
          ))}
        </div>
      )}
    </div>
  )
}

export default Bolsillos
