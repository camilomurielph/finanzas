import React from 'react'
import { useApp } from '../../context/AppContext'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import Boton from '../comunes/Boton'

function Reporte() {
  const { data } = useApp()
  const { bolsillos, movimientosBolsillo, categorias, gastos, subgastos, suscripciones, inversiones, deudas, sueldos } = data

  const generarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Reporte Financiero Personal', 14, 22)
    doc.setFontSize(12)
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30)

    let y = 38

    // Bolsillos
    doc.setFontSize(14)
    doc.text('Bolsillos', 14, y)
    y += 6
    bolsillos.forEach(b => {
      doc.text(`- ${b.nombre}: $${b.monto_actual.toFixed(2)}`, 14, y)
      y += 6
    })
    y += 4

    // Gastos por categoría
    doc.setFontSize(14)
    doc.text('Gastos', 14, y)
    y += 6
    for (const cat of categorias) {
      const gastosCat = gastos.filter(g => g.categoria_id === cat.id)
      if (gastosCat.length === 0) continue
      doc.setFontSize(12)
      doc.text(`Categoría: ${cat.nombre}`, 14, y)
      y += 5
      const rows = gastosCat.map(g => [g.fecha, g.descripcion, `$${g.valor.toFixed(2)}`, g.pagado ? 'Pagado' : 'Pendiente'])
      doc.autoTable({
        startY: y,
        head: [['Fecha', 'Descripción', 'Valor', 'Estado']],
        body: rows,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [58, 166, 255] }
      })
      y = doc.lastAutoTable.finalY + 4
    }
    y += 4

    // Suscripciones
    doc.setFontSize(14)
    doc.text('Suscripciones', 14, y)
    y += 6
    suscripciones.forEach(s => {
      doc.text(`- ${s.descripcion}: $${s.valor.toFixed(2)} (${s.periodicidad})`, 14, y)
      y += 6
    })
    y += 4

    // Inversiones
    doc.setFontSize(14)
    doc.text('Inversiones', 14, y)
    y += 6
    inversiones.forEach(inv => {
      const rend = ((inv.valor_actual - inv.monto_invertido) / inv.monto_invertido * 100).toFixed(2)
      doc.text(`- ${inv.nombre}: $${inv.valor_actual.toFixed(2)} (rend: ${rend}%)`, 14, y)
      y += 6
    })
    y += 4

    // Deudas
    doc.setFontSize(14)
    doc.text('Deudas', 14, y)
    y += 6
    deudas.forEach(d => {
      doc.text(`- ${d.nombre}: $${d.monto_restante.toFixed(2)} de $${d.monto_total.toFixed(2)}`, 14, y)
      y += 6
    })
    const totalDeuda = deudas.reduce((sum, d) => sum + d.monto_restante, 0)
    doc.text(`Total adeudado: $${totalDeuda.toFixed(2)}`, 14, y+4)
    y += 12

    // Sueldo (último registro)
    if (sueldos.length > 0) {
      const ultimo = sueldos[0]
      doc.setFontSize(14)
      doc.text(`Sueldo (${ultimo.mes}/${ultimo.anio})`, 14, y)
      y += 6
      doc.text(`Valor: $${ultimo.valor.toFixed(2)}, Disponible: $${ultimo.disponible.toFixed(2)}`, 14, y)
      y += 12
    }

    // Guardar PDF
    doc.save('reporte_finanzas.pdf')
  }

  return (
    <div>
      <h2>Reporte</h2>
      <p>Este reporte incluye un resumen de todos tus módulos financieros.</p>
      <Boton onClick={generarPDF} style={{ marginTop: '20px' }}>Generar PDF</Boton>
    </div>
  )
}

export default Reporte
