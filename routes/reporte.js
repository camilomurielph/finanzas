const router = require('express').Router();
const PdfMake = require('pdfmake');
const ReporteHelper = require('../models/ReporteHelper');

function auth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// ===== Página principal del reporte =====
router.get('/', auth, (req, res) => {
  res.render('reporte/index', {
    title: 'Reporte Financiero',
    active: 'reporte'
  });
});

// ===== Generar PDF con pdfmake =====
router.get('/pdf', auth, async (req, res) => {
  try {
    const data = ReporteHelper.getResumen(req.session.user.id);
    const usuario = req.session.user.email;
    const fecha = new Date().toLocaleDateString('es-CO');

    // ===== Construir el documento =====
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        color: '#e0e0e0'
      },
      background: {
        color: '#0d0d0d'
      },
      content: [
        // Título
        { text: '📊 Reporte Financiero', style: 'header' },
        { text: `👤 ${usuario}  |  📅 ${fecha}`, style: 'subheader' },

        // ===== RESUMEN EJECUTIVO =====
        { text: 'Resumen Ejecutivo', style: 'sectionTitle' },
        {
          columns: [
            { text: `Total Gastos: - $${data.resumen.totalGastos.toLocaleString()}`, style: 'resumenItem' },
            { text: `Total Suscripciones: - $${data.resumen.totalSuscripciones.toLocaleString()}`, style: 'resumenItem' },
            { text: `Total Bolsillos: $${data.resumen.totalBolsillos.toLocaleString()}`, style: 'resumenItem' }
          ],
          columnGap: 10
        },
        {
          columns: [
            { text: `Total Deudas: - $${data.resumen.totalDeudas.toLocaleString()}`, style: 'resumenItem' },
            { text: `Salario Disponible: $${data.resumen.salarioDisponible.toLocaleString()}`, style: 'resumenItem' },
            { text: `Ahorro Simulador: $${data.resumen.salarioAhorro.toLocaleString()}`, style: 'resumenItem' }
          ],
          columnGap: 10
        },

        // ===== GASTOS =====
        { text: 'Gastos', style: 'sectionTitle' },
        buildTablaGastos(data.detalles.gastos.recientes), // <-- CORREGIDO (sin this)

        { text: 'Gastos por Categoría', style: 'subSectionTitle' },
        buildTablaCategorias(data.detalles.gastos.porCategoria), // <-- CORREGIDO

        // ===== SUSCRIPCIONES =====
        { text: 'Suscripciones', style: 'sectionTitle' },
        buildTablaSuscripciones(data.detalles.suscripciones), // <-- CORREGIDO

        // ===== BOLSILLOS =====
        { text: 'Bolsillos', style: 'sectionTitle' },
        buildTablaBolsillos(data.detalles.bolsillos), // <-- CORREGIDO

        // ===== DEUDAS =====
        { text: 'Deudas Activas', style: 'sectionTitle' },
        buildTablaDeudas(data.detalles.deudas), // <-- CORREGIDO

        // ===== SALARIO =====
        { text: 'Simulador de Salario', style: 'sectionTitle' },
        buildSeccionSalario(data.detalles.salario.simulacro, data.detalles.salario.gastos), // <-- CORREGIDO

        // Pie de página
        { text: `📊 Reporte generado automáticamente - Finanzas App`, style: 'footer' },
        { text: `Fecha: ${new Date().toLocaleString('es-CO')}`, style: 'footer' }
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          color: '#ffffff',
          marginBottom: 10
        },
        subheader: {
          fontSize: 12,
          color: '#888888',
          marginBottom: 20
        },
        sectionTitle: {
          fontSize: 16,
          bold: true,
          color: '#3b82f6',
          marginTop: 15,
          marginBottom: 8
        },
        subSectionTitle: {
          fontSize: 13,
          bold: true,
          color: '#b0b0b0',
          marginTop: 10,
          marginBottom: 6
        },
        resumenItem: {
          fontSize: 11,
          color: '#e0e0e0',
          background: '#1a1a1a',
          padding: 8,
          margin: [0, 4, 0, 4]
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: '#3b82f6',
          fillColor: '#121212',
          alignment: 'left',
          padding: 5
        },
        tableCell: {
          fontSize: 9,
          color: '#e0e0e0',
          padding: 4
        },
        footer: {
          fontSize: 8,
          color: '#666666',
          alignment: 'center',
          marginTop: 20
        }
      }
    };

    // Generar PDF
    const pdfDoc = PdfMake.createPdf(docDefinition);
    const pdfBuffer = await new Promise((resolve, reject) => {
      pdfDoc.getBuffer((err, buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });

    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-financiero-${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).send('Error generando el reporte: ' + err.message);
  }
});

// ================================================
// FUNCIONES AYUDA PARA CONSTRUIR TABLAS (SIN this)
// ================================================

function buildTablaGastos(gastos) {
  if (!gastos || gastos.length === 0) {
    return { text: 'No hay gastos registrados.', style: 'footer' };
  }
  const body = [
    [
      { text: 'Nombre', style: 'tableHeader' },
      { text: 'Categoría', style: 'tableHeader' },
      { text: 'Fecha', style: 'tableHeader' },
      { text: 'Valor', style: 'tableHeader', alignment: 'right' }
    ]
  ];
  gastos.forEach(g => {
    body.push([
      { text: g.nombre, style: 'tableCell' },
      { text: g.tipo_nombre, style: 'tableCell' },
      { text: new Date(g.fecha).toLocaleDateString(), style: 'tableCell' },
      { text: `$${g.valor_total.toLocaleString()}`, style: 'tableCell', alignment: 'right' }
    ]);
  });
  return {
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', 'auto'],
      body: body
    },
    layout: {
      fillColor: function(rowIndex) {
        return (rowIndex % 2 === 0) ? '#1a1a1a' : '#0d0d0d';
      }
    }
  };
}

function buildTablaCategorias(categorias) {
  if (!categorias || categorias.length === 0) {
    return { text: 'No hay categorías con gastos.', style: 'footer' };
  }
  const body = [
    [
      { text: 'Categoría', style: 'tableHeader' },
      { text: 'Total', style: 'tableHeader', alignment: 'right' }
    ]
  ];
  categorias.forEach(c => {
    body.push([
      { text: c.nombre, style: 'tableCell' },
      { text: `$${c.total.toLocaleString()}`, style: 'tableCell', alignment: 'right' }
    ]);
  });
  return {
    table: {
      headerRows: 1,
      widths: ['*', 'auto'],
      body: body
    },
    layout: {
      fillColor: function(rowIndex) {
        return (rowIndex % 2 === 0) ? '#1a1a1a' : '#0d0d0d';
      }
    }
  };
}

function buildTablaSuscripciones(suscripciones) {
  if (!suscripciones || suscripciones.length === 0) {
    return { text: 'No hay suscripciones registradas.', style: 'footer' };
  }
  const body = [
    [
      { text: 'Nombre', style: 'tableHeader' },
      { text: 'Día de pago', style: 'tableHeader', alignment: 'center' },
      { text: 'Valor', style: 'tableHeader', alignment: 'right' }
    ]
  ];
  suscripciones.forEach(s => {
    body.push([
      { text: s.nombre, style: 'tableCell' },
      { text: s.dia_pago.toString(), style: 'tableCell', alignment: 'center' },
      { text: `$${s.valor.toLocaleString()}`, style: 'tableCell', alignment: 'right' }
    ]);
  });
  return {
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto'],
      body: body
    },
    layout: {
      fillColor: function(rowIndex) {
        return (rowIndex % 2 === 0) ? '#1a1a1a' : '#0d0d0d';
      }
    }
  };
}

function buildTablaBolsillos(bolsillos) {
  if (!bolsillos || bolsillos.length === 0) {
    return { text: 'No hay bolsillos creados.', style: 'footer' };
  }
  const body = [
    [
      { text: 'Bolsillo', style: 'tableHeader' },
      { text: 'Saldo', style: 'tableHeader', alignment: 'right' }
    ]
  ];
  bolsillos.forEach(b => {
    body.push([
      { text: b.nombre, style: 'tableCell' },
      { text: `$${b.saldo.toLocaleString()}`, style: 'tableCell', alignment: 'right' }
    ]);
  });
  return {
    table: {
      headerRows: 1,
      widths: ['*', 'auto'],
      body: body
    },
    layout: {
      fillColor: function(rowIndex) {
        return (rowIndex % 2 === 0) ? '#1a1a1a' : '#0d0d0d';
      }
    }
  };
}

function buildTablaDeudas(deudas) {
  if (!deudas || deudas.length === 0) {
    return { text: 'No hay deudas activas.', style: 'footer' };
  }
  const body = [
    [
      { text: 'Nombre', style: 'tableHeader' },
      { text: 'Cuota', style: 'tableHeader', alignment: 'center' },
      { text: 'Día de pago', style: 'tableHeader', alignment: 'center' },
      { text: 'Total', style: 'tableHeader', alignment: 'right' },
      { text: 'Pagado', style: 'tableHeader', alignment: 'right' },
      { text: 'Restante', style: 'tableHeader', alignment: 'right' }
    ]
  ];
  deudas.forEach(d => {
    body.push([
      { text: d.nombre, style: 'tableCell' },
      { text: `${d.cuota_actual}/${d.numero_cuotas}`, style: 'tableCell', alignment: 'center' },
      { text: d.dia_pago.toString(), style: 'tableCell', alignment: 'center' },
      { text: `$${d.valor_total.toLocaleString()}`, style: 'tableCell', alignment: 'right' },
      { text: `$${d.pagado_total.toLocaleString()}`, style: 'tableCell', alignment: 'right' },
      { text: `$${(d.valor_total - d.pagado_total).toLocaleString()}`, style: 'tableCell', alignment: 'right' }
    ]);
  });
  return {
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
      body: body
    },
    layout: {
      fillColor: function(rowIndex) {
        return (rowIndex % 2 === 0) ? '#1a1a1a' : '#0d0d0d';
      }
    }
  };
}

function buildSeccionSalario(simulacro, gastos) {
  if (!simulacro) {
    return { text: 'No hay simulacro de salario activo.', style: 'footer' };
  }
  const content = [];
  content.push({
    columns: [
      { text: `Salario inicial: $${simulacro.salario_inicial.toLocaleString()}`, style: 'resumenItem' },
      { text: `Disponible: $${simulacro.saldo_disponible.toLocaleString()}`, style: 'resumenItem' },
      { text: `Ahorro: $${simulacro.ahorro.toLocaleString()}`, style: 'resumenItem' }
    ],
    columnGap: 10
  });

  if (gastos && gastos.length > 0) {
    content.push({ text: 'Gastos del simulacro:', style: 'subSectionTitle' });
    const body = [
      [
        { text: 'Nombre', style: 'tableHeader' },
        { text: 'Valor', style: 'tableHeader', alignment: 'right' }
      ]
    ];
    gastos.forEach(g => {
      body.push([
        { text: g.nombre, style: 'tableCell' },
        { text: `-$${g.valor.toLocaleString()}`, style: 'tableCell', alignment: 'right' }
      ]);
    });
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', 'auto'],
        body: body
      },
      layout: {
        fillColor: function(rowIndex) {
          return (rowIndex % 2 === 0) ? '#1a1a1a' : '#0d0d0d';
        }
      }
    });
  }
  return content;
}

module.exports = router;
