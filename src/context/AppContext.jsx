import React, { createContext, useState, useContext, useEffect } from 'react'
import { client, initDatabase } from '../db'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [vistaActual, setVistaActual] = useState('bolsillos')
  const [cargando, setCargando] = useState(true)
  
  // Datos globales (se actualizarán según necesidades)
  const [data, setData] = useState({
    bolsillos: [],
    movimientosBolsillo: [],
    categorias: [],
    gastos: [],
    subgastos: [],
    suscripciones: [],
    inversiones: [],
    movimientosInversion: [],
    deudas: [],
    abonos: [],
    sueldos: [],
    gastosSueldo: [],
    ahorrosSueldo: []
  })

  // Función para recargar todos los datos (o por módulo)
  const refreshData = async (modulo) => {
    try {
      // Cargar todas las tablas según necesidad
      // Por simplicidad, cargaremos todo cada vez, pero se puede optimizar
      const [
        bolsillosRes,
        movBolsilloRes,
        categoriasRes,
        gastosRes,
        subgastosRes,
        suscripcionesRes,
        inversionesRes,
        movInvRes,
        deudasRes,
        abonosRes,
        sueldosRes,
        gastosSueldoRes,
        ahorrosSueldoRes
      ] = await Promise.all([
        client.execute('SELECT * FROM bolsillos ORDER BY id DESC'),
        client.execute('SELECT * FROM movimientos_bolsillo ORDER BY fecha DESC'),
        client.execute('SELECT * FROM categorias_gasto ORDER BY id'),
        client.execute('SELECT * FROM gastos WHERE archivado = 0 ORDER BY fecha ASC'),
        client.execute('SELECT * FROM subgastos'),
        client.execute('SELECT * FROM suscripciones WHERE archivada = 0 ORDER BY id DESC'),
        client.execute('SELECT * FROM inversiones ORDER BY id DESC'),
        client.execute('SELECT * FROM movimientos_inversion ORDER BY fecha DESC'),
        client.execute('SELECT * FROM deudas ORDER BY id DESC'),
        client.execute('SELECT * FROM abonos_deuda ORDER BY fecha DESC'),
        client.execute('SELECT * FROM sueldos ORDER BY anio DESC, mes DESC'),
        client.execute('SELECT * FROM gastos_sueldo ORDER BY fecha DESC'),
        client.execute('SELECT * FROM ahorros_sueldo ORDER BY fecha DESC')
      ])

      setData({
        bolsillos: bolsillosRes.rows,
        movimientosBolsillo: movBolsilloRes.rows,
        categorias: categoriasRes.rows,
        gastos: gastosRes.rows,
        subgastos: subgastosRes.rows,
        suscripciones: suscripcionesRes.rows,
        inversiones: inversionesRes.rows,
        movimientosInversion: movInvRes.rows,
        deudas: deudasRes.rows,
        abonos: abonosRes.rows,
        sueldos: sueldosRes.rows,
        gastosSueldo: gastosSueldoRes.rows,
        ahorrosSueldo: ahorrosSueldoRes.rows
      })
    } catch (error) {
      console.error('Error refrescando datos:', error)
    }
  }

  // Inicializar base de datos y cargar datos
  useEffect(() => {
    const init = async () => {
      await initDatabase()
      await refreshData()
      setCargando(false)
    }
    init()
  }, [])

  const value = {
    vistaActual,
    setVistaActual,
    data,
    refreshData,
    cargando
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
