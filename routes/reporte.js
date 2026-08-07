const router = require('express').Router();
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
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

// ===== Generar PDF con pdf-lib =====
router.get('/pdf', auth, async (req, res) => {
  try {
    const data = ReporteHelper.getResumen(req.session.user.id);
    const usuario = req.session.user.email;
    const fecha = new Date().toLocaleDateString('es-CO');

    // ===== Crear PDF =====
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    let y = height - 50;
    const margin = 50;
    const lineHeight = 20;
    const fontSize = 10;
    const titleSize = 18;
    const subtitleSize = 14;

    // Función auxiliar para agregar texto
    function addText(text, x, y, size = fontSize, color = rgb(1, 1, 1), fontType = font) {
      page.drawText(text, {
        x,
        y,
        size,
        font: fontType,
        color
      });
    }

    // Función para nueva página si es necesario
    function checkNewPage(neededLines) {
      if (y - (neededLines * lineHeight) < 50) {
        page = pdfDoc.addPage([595, 842]);
        y = height - 50;
        return true;
      }
      return false;
    }

    // ===== TITULO =====
    addText('REPORTE FINANCIERO', margin, y, titleSize, rgb(1, 1, 1), fontBold);
    y -= lineHeight * 1.5;
    addText(`Usuario: ${usuario}  |  Fecha: ${fecha}`, margin, y, 12, rgb(0.5, 0.5, 0.5));
    y -= lineHeight * 2;

    // ===== RESUMEN EJECUTIVO =====
    addText('RESUMEN EJECUTIVO', margin, y, subtitleSize, rgb(0.23, 0.51, 0.96), fontBold);
    y -= lineHeight * 1.5;

    const resumenItems = [
      { label: 'Total Gastos:', value: `- $${data.resumen.totalGastos.toLocaleString()}`, color: rgb(1, 0.42, 0.42) },
      { label: 'Total Suscripciones:', value: `- $${data.resumen.totalSuscripciones.toLocaleString()}`, color: rgb(1, 0.42, 0.42) },
      { label: 'Total Bolsillos:', value: `+ $${data.resumen.totalBolsillos.toLocaleString()}`, color: rgb(0.32, 0.81, 0.4) },
      { label: 'Total Deudas:', value: `- $${data.resumen.totalDeudas.toLocaleString()}`, color: rgb(1, 0.42, 0.42) },
      { label: 'Salario Disponible:', value: `$ ${data.resumen.salarioDisponible.toLocaleString()}`, color: rgb(0.23, 0.51, 0.96) },
      { label: 'Ahorro Simulador:', value: `+ $${data.resumen.salarioAhorro.toLocaleString()}`, color: rgb(0.32, 0.81, 0.4) }
    ];

    resumenItems.forEach(item => {
      addText(item.label, margin, y, 11, rgb(0.8, 0.8, 0.8), fontBold);
      addText(item.value, margin + 150, y, 11, item.color, fontBold);
      y -= lineHeight;
    });
    y -= lineHeight;

    // ===== GASTOS =====
    addText('GASTOS', margin, y, subtitleSize, rgb(0.23, 0.51, 0.96), fontBold);
    y -= lineHeight * 1.5;

    const gastos = data.detalles.gastos.recientes;
    if (gastos && gastos.length > 0) {
      addText('Ultimos gastos registrados:', margin, y, 11, rgb(0.7, 0.7, 0.7), fontBold);
      y -= lineHeight;

      // Encabezados de tabla
      addText('Nombre', margin, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
      addText('Categoria', margin + 180, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
      addText('Fecha', margin + 340, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
      addText('Valor', margin + 440, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
      y -= lineHeight;

      gastos.slice(0, 10).forEach(g => {
        if (checkNewPage(1)) {
          addText('Nombre', margin, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
          addText('Categoria', margin + 180, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
          addText('Fecha', margin + 340, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
          addText('Valor', margin + 440, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
          y -= lineHeight;
        }
        addText(g.nombre.substring(0, 20), margin, y, 9, rgb(0.9, 0.9, 0.9));
        addText(g.tipo_nombre || 'Sin categoria', margin + 180, y, 9, rgb(0.9, 0.9, 0.9));
        addText(new Date(g.fecha).toLocaleDateString(), margin + 340, y, 9, rgb(0.9, 0.9, 0.9));
        addText(`$${g.valor_total.toLocaleString()}`, margin + 440, y, 9, rgb(1, 0.42, 0.42));
        y -= lineHeight;
      });
      y -= lineHeight;

      // Gastos por categoria
      const categorias = data.detalles.gastos.porCategoria;
      if (categorias && categorias.length > 0) {
        addText('Gastos por Categoria:', margin, y, 11, rgb(0.7, 0.7, 0.7), fontBold);
        y -= lineHeight;
        addText('Categoria', margin, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
        addText('Total', margin + 180, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
        y -= lineHeight;
        categorias.forEach(c => {
          if (checkNewPage(1)) {
            addText('Categoria', margin, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
            addText('Total', margin + 180, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
            y -= lineHeight;
          }
          addText(c.nombre, margin, y, 9, rgb(0.9, 0.9, 0.9));
          addText(`$${c.total.toLocaleString()}`, margin + 180, y, 9, rgb(0.9, 0.9, 0.9));
          y -= lineHeight;
        });
        y -= lineHeight;
      }
    } else {
      addText('No hay gastos registrados.', margin, y, 10, rgb(0.6, 0.6, 0.6));
      y -= lineHeight * 2;
    }

    // ===== SUSCRIPCIONES =====
    addText('SUSCRIPCIONES', margin, y, subtitleSize, rgb(0.23, 0.51, 0.96), fontBold);
    y -= lineHeight * 1.5;

    const suscripciones = data.detalles.suscripciones;
    if (suscripciones && suscripciones.length > 0) {
      addText('Nombre', margin, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
      addText('Dia de pago', margin + 200, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
      addText('Valor', margin + 340, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
      y -= lineHeight;
      suscripciones.forEach(s => {
        if (checkNewPage(1)) {
          addText('Nombre', margin, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
          addText('Dia de pago', margin + 200, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
          addText('Valor', margin + 340, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
          y -= lineHeight;
        }
        addText(s.nombre, margin, y, 9, rgb(0.9, 0.9, 0.9));
        addText(s.dia_pago.toString(), margin + 200, y, 9, rgb(0.9, 0.9, 0.9));
        addText(`$${s.valor.toLocaleString()}`, margin + 340, y, 9, rgb(0.9, 0.9, 0.9));
        y -= lineHeight;
      });
      y -= lineHeight;
      addText(`Total mensual: $${data.resumen.totalSuscripciones.toLocaleString()}`, margin, y, 11, rgb(0.23, 0.51, 0.96), fontBold);
      y -= lineHeight * 2;
    } else {
      addText('No hay suscripciones registradas.', margin, y, 10, rgb(0.6, 0.6, 0.6));
      y -= lineHeight * 2;
    }

    // ===== BOLSILLOS =====
    addText('BOLSILLOS', margin, y, subtitleSize, rgb(0.23, 0.51, 0.96), fontBold);
    y -= lineHeight * 1.5;

    const bolsillos = data.detalles.bolsillos;
    if (bolsillos && bolsillos.length > 0) {
      addText('Bolsillo', margin, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
      addText('Saldo', margin + 280, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
      y -= lineHeight;
      bolsillos.forEach(b => {
        if (checkNewPage(1)) {
          addText('Bolsillo', margin, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
          addText('Saldo', margin + 280, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
          y -= lineHeight;
        }
        addText(b.nombre, margin, y, 9, rgb(0.9, 0.9, 0.9));
        addText(`$${b.saldo.toLocaleString()}`, margin + 280, y, 9, rgb(0.32, 0.81, 0.4));
        y -= lineHeight;
      });
      y -= lineHeight;
      addText(`Total en bolsillos: $${data.resumen.totalBolsillos.toLocaleString()}`, margin, y, 11, rgb(0.32, 0.81, 0.4), fontBold);
      y -= lineHeight * 2;
    } else {
      addText('No hay bolsillos creados.', margin, y, 10, rgb(0.6, 0.6, 0.6));
      y -= lineHeight * 2;
    }

    // ===== DEUDAS =====
    addText('DEUDAS ACTIVAS', margin, y, subtitleSize, rgb(0.23, 0.51, 0.96), fontBold);
    y -= lineHeight * 1.5;

    const deudas = data.detalles.deudas;
    if (deudas && deudas.length > 0) {
      addText('Nombre', margin, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
      addText('Cuota', margin + 200, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
      addText('Dia', margin + 290, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
      addText('Total', margin + 360, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
      addText('Restante', margin + 460, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
      y -= lineHeight;
      deudas.forEach(d => {
        if (checkNewPage(1)) {
          addText('Nombre', margin, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
          addText('Cuota', margin + 200, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
          addText('Dia', margin + 290, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
          addText('Total', margin + 360, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
          addText('Restante', margin + 460, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
          y -= lineHeight;
        }
        addText(d.nombre, margin, y, 9, rgb(0.9, 0.9, 0.9));
        addText(`${d.cuota_actual}/${d.numero_cuotas}`, margin + 200, y, 9, rgb(0.9, 0.9, 0.9));
        addText(d.dia_pago.toString(), margin + 290, y, 9, rgb(0.9, 0.9, 0.9));
        addText(`$${d.valor_total.toLocaleString()}`, margin + 360, y, 9, rgb(0.9, 0.9, 0.9));
        addText(`$${(d.valor_total - d.pagado_total).toLocaleString()}`, margin + 460, y, 9, rgb(1, 0.42, 0.42));
        y -= lineHeight;
      });
      y -= lineHeight;
      addText(`Total adeudado: $${data.resumen.totalDeudas.toLocaleString()}`, margin, y, 11, rgb(1, 0.42, 0.42), fontBold);
      y -= lineHeight * 2;
    } else {
      addText('No hay deudas activas.', margin, y, 10, rgb(0.6, 0.6, 0.6));
      y -= lineHeight * 2;
    }

    // ===== SALARIO =====
    addText('SIMULADOR DE SALARIO', margin, y, subtitleSize, rgb(0.23, 0.51, 0.96), fontBold);
    y -= lineHeight * 1.5;

    const simulacro = data.detalles.salario.simulacro;
    if (simulacro) {
      addText(`Salario inicial: $${simulacro.salario_inicial.toLocaleString()}`, margin, y, 10, rgb(0.9, 0.9, 0.9));
      y -= lineHeight;
      addText(`Disponible: $${simulacro.saldo_disponible.toLocaleString()}`, margin, y, 10, rgb(0.23, 0.51, 0.96));
      y -= lineHeight;
      addText(`Ahorro acumulado: $${simulacro.ahorro.toLocaleString()}`, margin, y, 10, rgb(0.32, 0.81, 0.4));
      y -= lineHeight * 1.5;

      const gastosSalario = data.detalles.salario.gastos;
      if (gastosSalario && gastosSalario.length > 0) {
        addText('Gastos del simulacro:', margin, y, 11, rgb(0.7, 0.7, 0.7), fontBold);
        y -= lineHeight;
        addText('Nombre', margin, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
        addText('Valor', margin + 280, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
        y -= lineHeight;
        gastosSalario.forEach(g => {
          if (checkNewPage(1)) {
            addText('Nombre', margin, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
            addText('Valor', margin + 280, y, 10, rgb(0.23, 0.51, 0.96), fontBold);
            y -= lineHeight;
          }
          addText(g.nombre, margin, y, 9, rgb(0.9, 0.9, 0.9));
          addText(`-$${g.valor.toLocaleString()}`, margin + 280, y, 9, rgb(1, 0.42, 0.42));
          y -= lineHeight;
        });
      }
    } else {
      addText('No hay simulacro de salario activo.', margin, y, 10, rgb(0.6, 0.6, 0.6));
      y -= lineHeight;
    }

    // ===== PIE DE PAGINA =====
    y -= lineHeight;
    addText('Reporte generado automaticamente - Finanzas App', margin, 40, 9, rgb(0.4, 0.4, 0.4));
    addText(`Fecha: ${new Date().toLocaleString('es-CO')}`, margin, 25, 9, rgb(0.4, 0.4, 0.4));

    // ===== Guardar PDF =====
    const pdfBytes = await pdfDoc.save();

    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-financiero-${Date.now()}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).send('Error generando el reporte: ' + err.message);
  }
});

module.exports = router;
