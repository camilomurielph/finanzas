import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { client } from '../../db'
import Boton from '../comunes/Boton'
import Input from '../comunes/Input'

function Sueldo() {
  const { data, refreshData } = useApp()
  const { sueldos, gastosSueldo, ahorrosSueldo } = data
  const [mesAnio, setMesAnio] = useState({ mes: new Date().getMonth()+1, anio: new Date().getFullYear() })
  const [nuevoSueldo, setNuevoSueldo] = useState({ valor: '', disponible: '' })
  const [gastoDesc, setGastoDesc] = useState('')
  const [gastoMonto, setGastoMonto] = useState('')
  const [ahorroMonto, setAhorroMonto] = useState('')

  const sueldoActual = sueldos.find(s => s.mes === mesAnio.mes && s.anio === mesAnio.anio)
  const gastosDelMes = gastosSueldo.filter(g => g.sueldo_id === sueldoActual?.id)
  const ahorrosDelMes = ahorrosSueldo.filter(a => a.sueldo_id === sueldoActual?.id)

  const registrarSueldo = async () => {
    if (!nuevoSueldo.valor) return alert('Ingresa el valor del sueldo')
    const val = parseFloat(nuevoSueldo.valor)
    const disp = nuevoSueldo.disponible ? parseFloat(nuevoSueldo.disponible) : val
    await client.execute({
      sql: 'INSERT INTO sueldos (mes, anio, valor, disponible) VALUES (?, ?, ?, ?)',
      args: [mesAnio.mes, mesAnio.anio, val, disp]
    })
    setNuevoSueldo({ valor: '', disponible: '' })
    refreshData()
  }

  const agregarGasto = async () => {
    if (!gastoDesc || !gastoMonto) return alert('Completa descripción y monto')
    if (!sueldoActual) return alert('Primero registra el sueldo del mes')
    const monto = parseFloat(gastoMonto)
    if (monto > sueldoActual.disponible) return alert('No hay suficiente disponible')
    await client.execute({
      sql: 'INSERT INTO gastos_sueldo (sueldo_id, descripcion, monto) VALUES (?, ?, ?)',
      args: [sueldoActual.id, gastoDesc, monto]
    })
    const nuevoDisponible = sueldoActual.disponible - monto
    await client.execute({
      sql: 'UPDATE sueldos SET disponible = ? WHERE id = ?',
      args: [nuevoDisponible, sueldoActual.id]
    })
    setGastoDesc(''); setGastoMonto('')
    refreshData()
  }

  const ahorrar = async (monto) => {
    if (!sueldoActual) return alert('Registra el sueldo primero')
    if (monto <= 0) return alert('Monto inválido')
    if (monto > sueldoActual.disponible) return alert('No hay suficiente disponible')
    await client.execute({
      sql: 'INSERT INTO ahorros_sueldo (sueldo_id, monto) VALUES (?, ?)',
      args: [sueldoActual.id, monto]
    })
    const nuevoDisponible = sueldoActual.disponible - monto
    await client.execute({
      sql: 'UPDATE sueldos SET disponible = ? WHERE id = ?',
      args: [nuevoDisponible, sueldoActual.id]
    })
    refreshData()
  }

  return (
    <div>
      <h2>Sueldo</h2>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <select value={mesAnio.mes} onChange={e => setMesAnio({...mesAnio, mes: parseInt(e.target.value)})} className="input" style={{ width: 'auto' }}>
          {Array.from({length:12}, (_,i) => i+1).map(m => <option key={m} value={m}>{new Date(0, m-1).toLocaleString('es', {month:'long'})}</option>)}
        </select>
        <select value={mesAnio.anio} onChange={e => setMesAnio({...mesAnio, anio: parseInt(e.target.value)})} className="input" style={{ width: 'auto' }}>
          {Array.from({length:5}, (_,i) => new Date().getFullYear() - 2 + i).map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <Boton className="boton-secundario" onClick={() => { setMesAnio({mes: new Date().getMonth()+1, anio: new Date().getFullYear()}) }}>Hoy</Boton>
      </div>

      {!sueldoActual ? (
        <div className="tarjeta" style={{ marginBottom: '16px' }}>
          <h4>Registrar sueldo de este mes</h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Input type="number" placeholder="Valor del sueldo" value={nuevoSueldo.valor} onChange={e => setNuevoSueldo({...nuevoSueldo, valor: e.target.value})} style={{ width: '180px' }} />
            <Input type="number" placeholder="Disponible inicial (opcional)" value={nuevoSueldo.disponible} onChange={e => setNuevoSueldo({...nuevoSueldo, disponible: e.target.value})} style={{ width: '180px' }} />
            <Boton onClick={registrarSueldo}>Registrar</Boton>
          </div>
        </div>
      ) : (
        <div className="tarjeta" style={{ marginBottom: '16px' }}>
          <p>Sueldo: ${sueldoActual.valor.toFixed(2)}</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>Disponible: ${sueldoActual.disponible.toFixed(2)}</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
            <Input placeholder="Descripción gasto" value={gastoDesc} onChange={e => setGastoDesc(e.target.value)} />
            <Input type="number" placeholder="Monto" value={gastoMonto} onChange={e => setGastoMonto(e.target.value)} style={{ width: '120px' }} />
            <Boton onClick={agregarGasto}>Agregar gasto</Boton>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
            <span>Ahorrar:</span>
            <Input type="number" placeholder="Monto" value={ahorroMonto} onChange={e => setAhorroMonto(e.target.value)} style={{ width: '120px' }} />
            <Boton onClick={() => ahorrar(parseFloat(ahorroMonto))}>Seleccionar monto</Boton>
            <Boton className="boton-secundario" onClick={() => ahorrar(sueldoActual.disponible / 10)}>1/10</Boton>
          </div>
        </div>
      )}

      <div className="tarjeta">
        <h4>Gastos del mes</h4>
        {gastosDelMes.map(g => (
          <div key={g.id} className="lista-item">
            <span>{g.descripcion}</span>
            <span style={{ marginLeft: 'auto' }}>-${g.monto.toFixed(2)}</span>
          </div>
        ))}
        {ahorrosDelMes.map(a => (
          <div key={a.id} className="lista-item" style={{ color: 'var(--green)' }}>
            <span>Ahorro</span>
            <span style={{ marginLeft: 'auto' }}>-${a.monto.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Sueldo
