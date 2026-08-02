import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { client } from '../../db'
import Boton from '../comunes/Boton'
import Input from '../comunes/Input'

function Gastos() {
  const { data, refreshData } = useApp()
  const { categorias, gastos, subgastos } = data
  const [categoriaActiva, setCategoriaActiva] = useState(categorias.length > 0 ? categorias[0].id : null)
  const [mostrarArchivados, setMostrarArchivados] = useState(false)
  const [gastoEditando, setGastoEditando] = useState(null) // id del gasto que se está editando
  const [nuevoGasto, setNuevoGasto] = useState({ fecha: '', descripcion: '', valor: '' })
  const [subgastoEditando, setSubgastoEditando] = useState(null)

  const gastosFiltrados = gastos.filter(g => g.categoria_id === categoriaActiva && !g.archivado)
  const gastosArchivados = gastos.filter(g => g.categoria_id === categoriaActiva && g.archivado)
  const subgastosPorGasto = (gastoId) => subgastos.filter(s => s.gasto_id === gastoId)

  const agregarGasto = async () => {
    if (!nuevoGasto.fecha || !nuevoGasto.descripcion || !nuevoGasto.valor) return alert('Completa todos los campos')
    await client.execute({
      sql: 'INSERT INTO gastos (categoria_id, fecha, descripcion, valor) VALUES (?, ?, ?, ?)',
      args: [categoriaActiva, nuevoGasto.fecha, nuevoGasto.descripcion, parseFloat(nuevoGasto.valor)]
    })
    setNuevoGasto({ fecha: '', descripcion: '', valor: '' })
    refreshData()
  }

  const eliminarGasto = async (id) => {
    if (!confirm('¿Eliminar este gasto?')) return
    await client.execute({ sql: 'DELETE FROM gastos WHERE id = ?', args: [id] })
    refreshData()
  }

  const togglePagado = async (id, pagado) => {
    await client.execute({
      sql: 'UPDATE gastos SET pagado = ? WHERE id = ?',
      args: [pagado ? 0 : 1, id]
    })
    refreshData()
  }

  const archivarGasto = async (id) => {
    await client.execute({
      sql: 'UPDATE gastos SET archivado = 1 WHERE id = ?',
      args: [id]
    })
    refreshData()
  }

  const duplicarGasto = async (gasto) => {
    const { fecha, descripcion, valor, categoria_id } = gasto
    await client.execute({
      sql: 'INSERT INTO gastos (categoria_id, fecha, descripcion, valor) VALUES (?, ?, ?, ?)',
      args: [categoria_id, fecha, descripcion, valor]
    })
    refreshData()
  }

  const editarGasto = async (id, campo, valor) => {
    await client.execute({
      sql: `UPDATE gastos SET ${campo} = ? WHERE id = ?`,
      args: [valor, id]
    })
    refreshData()
  }

  // Dividir: crear subgastos
  const dividirGasto = async (gastoId, cuotas) => {
    // cuotas es un array de {nombre, valor, anotacion}
    for (const c of cuotas) {
      await client.execute({
        sql: 'INSERT INTO subgastos (gasto_id, nombre, valor, anotacion) VALUES (?, ?, ?, ?)',
        args: [gastoId, c.nombre, parseFloat(c.valor), c.anotacion || '']
      })
    }
    refreshData()
  }

  const toggleSubgastoCompletado = async (id, completado) => {
    await client.execute({
      sql: 'UPDATE subgastos SET completado = ? WHERE id = ?',
      args: [completado ? 0 : 1, id]
    })
    refreshData()
  }

  const editarSubgasto = async (id, campo, valor) => {
    await client.execute({
      sql: `UPDATE subgastos SET ${campo} = ? WHERE id = ?`,
      args: [valor, id]
    })
    refreshData()
  }

  const eliminarSubgasto = async (id) => {
    if (!confirm('¿Eliminar este subgasto?')) return
    await client.execute({ sql: 'DELETE FROM subgastos WHERE id = ?', args: [id] })
    refreshData()
  }

  // Renombrar categoría
  const renombrarCategoria = async (id, nuevoNombre) => {
    await client.execute({
      sql: 'UPDATE categorias_gasto SET nombre = ? WHERE id = ?',
      args: [nuevoNombre, id]
    })
    refreshData()
  }

  return (
    <div>
      <h2>Gastos</h2>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {categorias.map(cat => (
          <Boton
            key={cat.id}
            onClick={() => setCategoriaActiva(cat.id)}
            className={categoriaActiva === cat.id ? '' : 'boton-secundario'}
          >
            <Input
              value={cat.nombre}
              onChange={(e) => renombrarCategoria(cat.id, e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: 'bold', width: 'auto', padding: 0 }}
              onBlur={() => refreshData()}
            />
          </Boton>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Input
          type="date"
          value={nuevoGasto.fecha}
          onChange={(e) => setNuevoGasto({ ...nuevoGasto, fecha: e.target.value })}
          style={{ width: '150px' }}
        />
        <Input
          placeholder="Descripción"
          value={nuevoGasto.descripcion}
          onChange={(e) => setNuevoGasto({ ...nuevoGasto, descripcion: e.target.value })}
          style={{ flex: 1 }}
        />
        <Input
          type="number"
          placeholder="Valor"
          value={nuevoGasto.valor}
          onChange={(e) => setNuevoGasto({ ...nuevoGasto, valor: e.target.value })}
          style={{ width: '120px' }}
        />
        <Boton onClick={agregarGasto}>Agregar</Boton>
      </div>

      <div>
        {gastosFiltrados.map(g => (
          <div key={g.id} className="lista-item" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>{new Date(g.fecha).toLocaleDateString()}</span>
              <span style={{ flex: 1 }}>{g.descripcion}</span>
              <span style={{ fontWeight: 'bold' }}>${g.valor.toFixed(2)}</span>
              <input
                type="checkbox"
                checked={!!g.pagado}
                onChange={() => togglePagado(g.id, g.pagado)}
              />
              <Boton className="boton-secundario" onClick={() => setGastoEditando(g.id)}>⋮</Boton>
            </div>
            {gastoEditando === g.id && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                <Boton className="boton-secundario" onClick={() => { /* Editar en línea */ setGastoEditando(null) }}>Editar</Boton>
                <Boton className="boton-secundario" onClick={() => duplicarGasto(g)}>Duplicar</Boton>
                <Boton className="boton-peligro" onClick={() => eliminarGasto(g.id)}>Eliminar</Boton>
                <Boton className="boton-secundario" onClick={() => {
                  const cuotas = prompt('Ingresa cuotas separadas por coma (ej: Cuota1:10000, Cuota2:10000)')
                  if (cuotas) {
                    const items = cuotas.split(',').map(c => {
                      const [nombre, valor] = c.split(':').map(s => s.trim())
                      return { nombre, valor }
                    })
                    dividirGasto(g.id, items)
                  }
                }}>Dividir</Boton>
                <Boton className="boton-secundario" onClick={() => archivarGasto(g.id)}>Archivar</Boton>
                <Boton onClick={() => setGastoEditando(null)}>Cerrar</Boton>
              </div>
            )}
            {/* Subgastos */}
            {subgastosPorGasto(g.id).map(sg => (
              <div key={sg.id} style={{ marginLeft: '30px', display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--border-color)', padding: '4px 0' }}>
                <Input
                  value={sg.nombre}
                  onChange={(e) => editarSubgasto(sg.id, 'nombre', e.target.value)}
                  style={{ width: '120px', background: 'transparent', border: 'none' }}
                />
                <span>${sg.valor.toFixed(2)}</span>
                <input
                  type="checkbox"
                  checked={!!sg.completado}
                  onChange={() => toggleSubgastoCompletado(sg.id, sg.completado)}
                />
                <Input
                  placeholder="Anotación"
                  value={sg.anotacion || ''}
                  onChange={(e) => editarSubgasto(sg.id, 'anotacion', e.target.value)}
                  style={{ width: '150px', background: 'transparent', border: 'none' }}
                />
                <Boton className="boton-peligro" onClick={() => eliminarSubgasto(sg.id)}>✕</Boton>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
        <Boton className="boton-secundario" onClick={() => setMostrarArchivados(!mostrarArchivados)}>
          {mostrarArchivados ? 'Ocultar archivados' : 'Mostrar archivados'}
        </Boton>
        {mostrarArchivados && gastosArchivados.map(g => (
          <div key={g.id} className="lista-item" style={{ opacity: 0.6 }}>
            <span>{new Date(g.fecha).toLocaleDateString()}</span>
            <span style={{ flex: 1 }}>{g.descripcion}</span>
            <span>${g.valor.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Gastos
