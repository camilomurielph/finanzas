import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { client } from '../../db'
import Boton from '../comunes/Boton'
import Input from '../comunes/Input'

function Suscripciones() {
  const { data, refreshData } = useApp()
  const { suscripciones } = data
  const [editandoId, setEditandoId] = useState(null)
  const [nueva, setNueva] = useState({ descripcion: '', valor: '', periodicidad: 'mensual', fecha_cobro: '' })

  const total = suscripciones.reduce((sum, s) => sum + s.valor, 0)

  const agregar = async () => {
    if (!nueva.descripcion || !nueva.valor || !nueva.fecha_cobro) return alert('Completa todos los campos')
    await client.execute({
      sql: `INSERT INTO suscripciones (descripcion, valor, periodicidad, fecha_cobro) VALUES (?, ?, ?, ?)`,
      args: [nueva.descripcion, parseFloat(nueva.valor), nueva.periodicidad, nueva.fecha_cobro]
    })
    setNueva({ descripcion: '', valor: '', periodicidad: 'mensual', fecha_cobro: '' })
    refreshData()
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta suscripción?')) return
    await client.execute({ sql: 'DELETE FROM suscripciones WHERE id = ?', args: [id] })
    refreshData()
  }

  const archivar = async (id) => {
    await client.execute({ sql: 'UPDATE suscripciones SET archivada = 1 WHERE id = ?', args: [id] })
    refreshData()
  }

  const editar = async (id, campo, valor) => {
    await client.execute({
      sql: `UPDATE suscripciones SET ${campo} = ? WHERE id = ?`,
      args: [valor, id]
    })
    refreshData()
  }

  return (
    <div>
      <h2>Suscripciones</h2>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <Input placeholder="Descripción" value={nueva.descripcion} onChange={e => setNueva({...nueva, descripcion: e.target.value})} />
        <Input type="number" placeholder="Valor" value={nueva.valor} onChange={e => setNueva({...nueva, valor: e.target.value})} style={{ width: '120px' }} />
        <select value={nueva.periodicidad} onChange={e => setNueva({...nueva, periodicidad: e.target.value})} className="input" style={{ width: 'auto' }}>
          <option value="semanal">Semanal</option>
          <option value="mensual">Mensual</option>
          <option value="trimestral">Trimestral</option>
          <option value="semestral">Semestral</option>
          <option value="anual">Anual</option>
        </select>
        <Input type="date" value={nueva.fecha_cobro} onChange={e => setNueva({...nueva, fecha_cobro: e.target.value})} style={{ width: '150px' }} />
        <Boton onClick={agregar}>Agregar</Boton>
      </div>

      {suscripciones.map(s => (
        <div key={s.id} className="lista-item" style={{ flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setEditandoId(s.id === editandoId ? null : s.id)}>
            {s.descripcion}
          </span>
          <span style={{ marginLeft: 'auto', marginRight: '20px' }}>${s.valor.toFixed(2)}</span>
          <span className="texto-secundario" style={{ marginRight: '20px' }}>{s.periodicidad}</span>
          <span className="texto-secundario">{new Date(s.fecha_cobro).toLocaleDateString()}</span>
          {editandoId === s.id && (
            <div style={{ width: '100%', display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              <Boton className="boton-secundario" onClick={() => { /* editar inline con prompts */ 
                const nuevaDesc = prompt('Nueva descripción:', s.descripcion)
                if (nuevaDesc) editar(s.id, 'descripcion', nuevaDesc)
              }}>Editar</Boton>
              <Boton className="boton-peligro" onClick={() => eliminar(s.id)}>Eliminar</Boton>
              <Boton className="boton-secundario" onClick={() => archivar(s.id)}>Archivar</Boton>
              <Boton className="boton-secundario" onClick={() => {
                const anot = prompt('Anotación:', s.anotacion || '')
                if (anot !== null) editar(s.id, 'anotacion', anot)
              }}>Anotación</Boton>
              <Boton onClick={() => setEditandoId(null)}>Cerrar</Boton>
            </div>
          )}
          {s.anotacion && <div style={{ width: '100%', color: 'var(--text-secondary)', fontSize: '14px' }}>📝 {s.anotacion}</div>}
        </div>
      ))}
      <div style={{ marginTop: '20px', fontWeight: 'bold', fontSize: '18px' }}>Total: ${total.toFixed(2)}</div>
    </div>
  )
}

export default Suscripciones
