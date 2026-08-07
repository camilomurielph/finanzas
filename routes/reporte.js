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
    
    // Obtener nombre del query parameter, si no, usar "Usuario"
    const nombreUsuario = req.query.nombre || 'Usuario';
    const fecha = new Date().toLocaleDateString('es-CO');

    // ===== Crear PDF =====
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // ===== PALETA DE COLORES =====
    const white = rgb(1, 1, 1);
    const black = rgb(0, 0, 0);
    const darkBlue = rgb(0.07, 0.13, 0.26); // Azul oscuro para header
    const lightBlue = rgb(0.93, 0.95, 0.97); // Azul muy claro para fondo
    const mediumGray = rgb(0.85, 0.87, 0.89); // Gris para bordes de tablas
    const darkGray = rgb(0.3, 0.3, 0.3);
    const red = rgb(0.8, 0.1, 0.1); // Rojo para bordes de deudas
    const blueAccent = rgb(0.1, 0.3, 0.6);

    let page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    let y = height - 50;
    const margin = 50;
    const lineHeight = 20;
    const titleSize = 22;
    const sectionSize = 16;
    const headerHeight = 80;

    // ===== FUNCIONES AUXILIARES =====
    function addText(text, x, y, size = 10, color = black, fontType = font) {
      page.drawText(text, {
        x,
        y,
        size,
        font: fontType,
        color
      });
    }

    function drawHeader(title, y) {
      // Fondo azul oscuro para el header
      page.drawRectangle({
        x: 0,
        y: y - 20,
        width: width,
        height: headerHeight + 20,
        color: darkBlue
      });
      
      // Título en blanco
      addText(title, margin, y + headerHeight - 30, titleSize, white, fontBold);
      
      // Línea decorativa debajo del título
      page.drawRectangle({
        x: margin,
        y: y + headerHeight - 55,
        width: 100,
        height: 3,
        color: white
      });

      return y - headerHeight + 10;
    }

    function drawSectionTitle(text, y) {
      // Título de sección en azul
      addText(text, margin, y, sectionSize, blueAccent, fontBold);
      
      // Línea decorativa
      page.drawRectangle({
        x: margin,
        y: y - 5,
        width: 60,
        height: 2,
        color: blueAccent
      });
      
      return y - lineHeight * 1.5;
    }

    function drawTable(columns, rows, y, options = {}) {
      const { 
        headerBg = lightBlue,
        rowBg1 = white,
        rowBg2 = rgb(0.96, 0.97, 0.98),
        borderColor = mediumGray,
        headerColor = darkGray
      } = options;

      // Calcular ancho total
      const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
      let startX = margin;

      // Dibujar encabezado
      page.drawRectangle({
        x: startX,
        y: y - 14,
        width: totalWidth,
        height: 18,
        color: headerBg
      });

      // Bordes de la tabla (rectángulo completo)
      page.drawRectangle({
        x: startX,
        y: y - 14 - (rows.length * 16 + 4),
        width: totalWidth,
        height: 18 + rows.length * 16 + 4,
        borderColor: borderColor,
        borderWidth: 1
      });

      // Encabezados
      let x = startX;
      columns.forEach(col => {
        addText(col.label, x + 4, y - 9, 9, headerColor, fontBold);
        x += col.width;
      });
      y -= 18;

      // Filas
      rows.forEach((row, index) => {
        const bgColor = index % 2 === 0 ? rowBg1 : rowBg2;
        // Fondo de la fila
        page.drawRectangle({
          x: startX,
          y: y - 14,
          width: totalWidth,
          height: 16,
          color: bgColor
        });

        x = startX;
        columns.forEach((col, i) => {
          const color = row.colors && row.colors[i] ? row.colors[i] : black;
          const text = row.values[i] || '';
          addText(text, x + 4, y - 9, 8.5, color);
          x += col.width;
        });
        y -= 16;
      });

      return y - 4;
    }

    function drawDebtCard(deuda, y, pagos) {
      // Contenedor de la deuda (fondo blanco con borde izquierdo rojo)
      const cardWidth = 495;
      const cardX = margin;
      const cardHeight = 140 + (pagos.length > 0 ? 60 : 0);
      
      // Fondo blanco
      page.drawRectangle({
        x: cardX,
        y: y - cardHeight - 10,
        width: cardWidth,
        height: cardHeight,
        color: white,
        borderColor: mediumGray,
        borderWidth: 1
      });

      // Borde izquierdo rojo
      page.drawRectangle({
        x: cardX,
        y: y - cardHeight - 10,
        width: 4,
        height: cardHeight,
        color: red
      });

      // Título de la deuda (dentro del contenedor)
      addText(deuda.nombre, cardX + 14, y - 22, 13, black, fontBold);
      y -= 40;

      // Estadísticas (fila 1)
      const stats1 = [
        { label: 'Total de la deuda', value: `$${deuda.valor_total.toLocaleString()}` },
        { label: 'Valor pagado', value: `$${deuda.pagado_total.toLocaleString()}` },
        { label: 'Falta por pagar', value: `$${(deuda.valor_total - deuda.pagado_total).toLocaleString()}` }
      ];

      let x = cardX + 14;
      stats1.forEach((stat, i) => {
        addText(`${stat.label}:`, x, y - 18, 8.5, darkGray);
        const color = i === 2 ? red : black;
        addText(stat.value, x + (i === 0 ? 90 : 85), y - 18, 8.5, color, fontBold);
        x += i === 0 ? 180 : 160;
      });
      y -= 22;

      // Estadísticas (fila 2)
      const stats2 = [
        { label: 'Cuota mínima', value: `$${deuda.cuota_minima.toLocaleString()}` },
        { label: 'Día de pago', value: deuda.dia_pago.toString() },
        { label: 'Cuotas', value: `${deuda.cuota_actual}/${deuda.numero_cuotas}` }
      ];

      x = cardX + 14;
      stats2.forEach((stat, i) => {
        addText(`${stat.label}:`, x, y - 18, 8.5, darkGray);
        addText(stat.value, x + (i === 0 ? 80 : 70), y - 18, 8.5, black, fontBold);
        x += i === 0 ? 170 : 155;
      });
      y -= 24;

      // Historial de pagos (si hay)
      if (pagos && pagos.length > 0) {
        addText('Historial de Pagos:', cardX + 14, y - 16, 9.5, darkGray, fontBold);
        y -= 22;

        // Tabla de pagos (dentro del contenedor)
        const columns = [
          { label: 'Fecha', width: 120 },
          { label: 'Valor Pagado', width: 150 }
        ];

        const rows = pagos.slice(0, 5).map(p => ({
          values: [
            new Date(p.fecha_pago).toLocaleDateString(),
            `$${p.monto.toLocaleString()}`
          ],
          colors: [black, blueAccent]
        }));

        // Dibujar tabla pequeña dentro del contenedor
        const tableX = cardX + 14;
        // Encabezados
        page.drawRectangle({
          x: tableX,
          y: y - 12,
          width: 270,
          height: 14,
          color: lightBlue
        });
        addText('Fecha', tableX + 4, y - 8, 8, darkGray, fontBold);
        addText('Valor Pagado', tableX + 124, y - 8, 8, darkGray, fontBold);
        y -= 16;

        rows.forEach(row => {
          page.drawRectangle({
            x: tableX,
            y: y - 12,
            width: 270,
            height: 14,
            color: white
          });
          addText(row.values[0], tableX + 4, y - 8, 8, black);
          addText(row.values[1], tableX + 124, y - 8, 8, blueAccent, fontBold);
          y -= 14;
        });
        y -= 6;
      } else {
        y -= 8;
        addText('No hay pagos registrados.', cardX + 24, y - 16, 8.5, darkGray);
        y -= 20;
      }

      return y - 20;
    }

    // ============================================================
    // ===== PÁGINA 1: HEADER Y RESUMEN =====
    // ============================================================
    y = drawHeader('Reporte Financiero', y);
    
    // Nombre del usuario (en lugar del correo)
    addText(`Preparado para: ${nombreUsuario}`, margin, y + 10, 12, darkGray);
    addText(`Fecha de generación: ${fecha}`, margin, y - 10, 10, darkGray);
    y -= 40;

    // ============================================================
    // ===== SECCION 1: RESUMEN EJECUTIVO =====
    // ============================================================
    y = drawSectionTitle('Resumen Ejecutivo', y);

    // Cuadrícula de resumen (4 columnas)
    const resumenItems = [
      { label: 'Total Gastos', value: `$${data.resumen.totalGastos.toLocaleString()}`, color: rgb(0.8, 0.1, 0.1) },
      { label: 'Total Suscripciones', value: `$${data.resumen.totalSuscripciones.toLocaleString()}`, color: rgb(0.8, 0.1, 0.1) },
      { label: 'Total Bolsillos', value: `$${data.resumen.totalBolsillos.toLocaleString()}`, color: rgb(0, 0.6, 0) },
      { label: 'Total Deudas', value: `$${data.resumen.totalDeudas.toLocaleString()}`, color: rgb(0.8, 0.1, 0.1) },
      { label: 'Salario Disponible', value: `$${data.resumen.salarioDisponible.toLocaleString()}`, color: blueAccent },
      { label: 'Ahorro Simulador', value: `$${data.resumen.salarioAhorro.toLocaleString()}`, color: rgb(0, 0.6, 0) }
    ];

    // Dividir en dos filas de 3
    resumenItems.forEach((item, index) => {
      const colIndex = index % 3;
      const rowIndex = Math.floor(index / 3);
      const x = margin + (colIndex * 165);
      const yPos = y - (rowIndex * 30);
      
      // Fondo blanco con borde suave
      page.drawRectangle({
        x: x,
        y: yPos - 20,
        width: 155,
        height: 30,
        color: white,
        borderColor: mediumGray,
        borderWidth: 0.5
      });
      
      addText(item.label, x + 8, yPos - 13, 8, darkGray);
      addText(item.value, x + 8, yPos - 2, 10, item.color, fontBold);
    });

    y -= 80;

    // ============================================================
    // ===== SECCION 2: GASTOS POR TARJETA/CUENTA =====
    // ============================================================
    y = drawSectionTitle('1. Registro de Gastos', y);
    y -= 8;

    const gastosPorTarjeta = data.detalles.gastosPorTarjeta;
    if (gastosPorTarjeta && gastosPorTarjeta.length > 0) {
      let first = true;
      gastosPorTarjeta.forEach(item => {
        if (!first) y -= 8;
        first = false;
        
        // Mostrar el nombre de la tarjeta/cuenta
        addText(`Tarjeta/Cuenta: ${item.tarjeta}`, margin, y, 11, blueAccent, fontBold);
        y -= 16;

        // Tabla de gastos de esta tarjeta
        const columns = [
          { label: 'Nombre del Gasto', width: 200 },
          { label: 'Valor', width: 120 },
          { label: 'Fecha', width: 120 }
        ];

        const rows = item.gastos.map(g => ({
          values: [
            g.nombre,
            `$${g.valor_total.toLocaleString()}`,
            new Date(g.fecha).toLocaleDateString()
          ],
          colors: [black, black, darkGray]
        }));

        y = drawTable(columns, rows, y, {
          headerBg: lightBlue,
          rowBg1: white,
          rowBg2: rgb(0.98, 0.99, 1),
          borderColor: mediumGray,
          headerColor: darkGray
        });
      });
    } else {
      addText('No hay gastos registrados.', margin, y, 10, darkGray);
      y -= lineHeight;
    }
    y -= 8;

    // ============================================================
    // ===== SECCION 3: SUSCRIPCIONES =====
    // ============================================================
    y = drawSectionTitle('2. Suscripciones', y);
    y -= 8;

    const suscripciones = data.detalles.suscripciones;
    if (suscripciones && suscripciones.length > 0) {
      const columns = [
        { label: 'Suscripción', width: 180 },
        { label: 'Día de Pago', width: 100 },
        { label: 'Valor', width: 120 }
      ];

      const rows = suscripciones.map(s => ({
        values: [s.nombre, s.dia_pago.toString(), `$${s.valor.toLocaleString()}`],
        colors: [black, darkGray, black]
      }));

      y = drawTable(columns, rows, y, {
        headerBg: lightBlue,
        rowBg1: white,
        rowBg2: rgb(0.98, 0.99, 1),
        borderColor: mediumGray,
        headerColor: darkGray
      });

      y -= 6;
      addText(`Total mensual en suscripciones: $${data.resumen.totalSuscripciones.toLocaleString()}`, margin, y, 10.5, blueAccent, fontBold);
      y -= 24;
    } else {
      addText('No hay suscripciones registradas.', margin, y, 10, darkGray);
      y -= lineHeight;
    }

    // ============================================================
    // ===== SECCION 4: BOLSILLOS =====
    // ============================================================
    y = drawSectionTitle('3. Bolsillos (Organización de Dinero)', y);
    y -= 8;

    const bolsillos = data.detalles.bolsillos;
    if (bolsillos && bolsillos.length > 0) {
      const columns = [
        { label: 'Nombre del Bolsillo', width: 200 },
        { label: 'Monto Asignado', width: 150 }
      ];

      const rows = bolsillos.map(b => ({
        values: [b.nombre, `$${b.saldo.toLocaleString()}`],
        colors: [black, rgb(0, 0.6, 0)]
      }));

      y = drawTable(columns, rows, y, {
        headerBg: lightBlue,
        rowBg1: white,
        rowBg2: rgb(0.98, 0.99, 1),
        borderColor: mediumGray,
        headerColor: darkGray
      });

      y -= 6;
      addText(`Total en bolsillos: $${data.resumen.totalBolsillos.toLocaleString()}`, margin, y, 10.5, rgb(0, 0.6, 0), fontBold);
      y -= 24;
    } else {
      addText('No hay bolsillos creados.', margin, y, 10, darkGray);
      y -= lineHeight;
    }

    // ============================================================
    // ===== SECCION 5: DEUDAS =====
    // ============================================================
    y = drawSectionTitle('4. Registro de Deudas', y);
    y -= 8;

    const deudas = data.detalles.deudas;
    if (deudas && deudas.length > 0) {
      deudas.forEach(deuda => {
        // Obtener pagos de esta deuda
        const pagosDeuda = data.detalles.pagos.filter(p => p.deuda_id === deuda.id);
        y = drawDebtCard(deuda, y, pagosDeuda);
        y -= 12;
      });
    } else {
      addText('No hay deudas activas.', margin, y, 10, darkGray);
      y -= lineHeight;
    }

    // ============================================================
    // ===== SECCION 6: SALARIO =====
    // ============================================================
    y = drawSectionTitle('5. Simulador de Salario', y);
    y -= 8;

    const simulacro = data.detalles.salario.simulacro;
    if (simulacro) {
      // Fondo blanco con borde
      page.drawRectangle({
        x: margin,
        y: y - 80,
        width: 495,
        height: 80,
        color: white,
        borderColor: mediumGray,
        borderWidth: 1
      });

      const salarioItems = [
        { label: 'Salario inicial', value: `$${simulacro.salario_inicial.toLocaleString()}` },
        { label: 'Disponible', value: `$${simulacro.saldo_disponible.toLocaleString()}`, color: blueAccent },
        { label: 'Ahorro acumulado', value: `$${simulacro.ahorro.toLocaleString()}`, color: rgb(0, 0.6, 0) }
      ];

      let xPos = margin + 20;
      salarioItems.forEach((item, i) => {
        addText(`${item.label}:`, xPos, y - 18, 9, darkGray);
        const color = item.color || black;
        addText(item.value, xPos, y - 4, 11, color, fontBold);
        xPos += 165;
      });
      y -= 70;

      // Gastos del simulacro
      const gastosSimulacro = data.detalles.salario.gastos;
      if (gastosSimulacro && gastosSimulacro.length > 0) {
        y -= 10;
        addText('Gastos del simulacro:', margin + 10, y, 9.5, darkGray, fontBold);
        y -= 16;

        const columns = [
          { label: 'Nombre', width: 250 },
          { label: 'Valor', width: 150 }
        ];

        const rows = gastosSimulacro.map(g => ({
          values: [g.nombre, `-$${g.valor.toLocaleString()}`],
          colors: [black, rgb(0.8, 0.1, 0.1)]
        }));

        y = drawTable(columns, rows, y, {
          headerBg: lightBlue,
          rowBg1: white,
          rowBg2: rgb(0.98, 0.99, 1),
          borderColor: mediumGray,
          headerColor: darkGray
        });
        y -= 16;
      } else {
        y -= 16;
        addText('No hay gastos registrados en el simulacro.', margin + 10, y, 9, darkGray);
        y -= 16;
      }
    } else {
      addText('No hay simulacro de salario activo.', margin, y, 10, darkGray);
      y -= lineHeight;
    }

    // ============================================================
    // ===== PIE DE PAGINA =====
    // ============================================================
    y -= 10;
    addText('Reporte generado automáticamente - Finanzas App', margin, 40, 8, darkGray);
    addText(`Fecha de generación: ${new Date().toLocaleString('es-CO')}`, margin, 28, 8, darkGray);

    // ===== Guardar PDF =====
    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-financiero-${Date.now()}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).send('Error generando el reporte: ' + err.message);
  }
});

module.exports = router;
