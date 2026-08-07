const router = require('express').Router();
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const ReporteHelper = require('../models/ReporteHelper');

function auth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// ===== Página principal =====
router.get('/', auth, (req, res) => {
  res.render('reporte/index', {
    title: 'Reporte Financiero',
    active: 'reporte'
  });
});

// ===== Generar PDF =====
router.get('/pdf', auth, async (req, res) => {
  try {
    const data = ReporteHelper.getResumen(req.session.user.id);
    const nombreUsuario = req.query.nombre || 'Usuario';
    const fecha = new Date().toLocaleDateString('es-CO');

    // ===== Crear documento =====
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // ===== PALETA DE COLORES =====
    const white = rgb(1, 1, 1);
    const black = rgb(0, 0, 0);
    const darkBlue = rgb(0.05, 0.1, 0.25);        // Azul oscuro elegante
    const mediumBlue = rgb(0.1, 0.25, 0.55);      // Azul medio
    const lightBg = rgb(0.96, 0.97, 0.99);        // Fondo azul muy claro
    const tableHeaderBg = rgb(0.92, 0.94, 0.96);  // Fondo de encabezados de tabla
    const rowEvenBg = white;
    const rowOddBg = rgb(0.98, 0.985, 0.99);
    const borderGray = rgb(0.85, 0.87, 0.89);
    const textDark = rgb(0.15, 0.15, 0.15);
    const textMedium = rgb(0.4, 0.4, 0.4);
    const redAccent = rgb(0.7, 0.1, 0.1);
    const greenAccent = rgb(0, 0.5, 0.1);
    const blueAccent = rgb(0.1, 0.3, 0.6);

    // ===== CONFIGURACIÓN DE PÁGINA =====
    const pageWidth = 595;  // A4
    const pageHeight = 842;
    const marginX = 55;
    const marginY = 55;
    const lineHeight = 18;
    const headerHeight = 90;
    const sectionSpacing = 22;
    const titleSize = 20;
    const sectionTitleSize = 15;
    const subsectionSize = 12;
    const bodySize = 9.5;
    const smallSize = 8.5;

    // ===== FUNCIONES DE DIBUJO =====
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - marginY;

    // Dibujar fondo de página (azul muy claro)
    function drawPageBackground() {
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: lightBg
      });
    }
    drawPageBackground();

    // Función para nueva página
    function newPage() {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - marginY;
      drawPageBackground();
      // Dibujar el header en la nueva página
      drawHeader();
      y -= headerHeight + 10;
    }

    // Función para dibujar el header (fondo azul oscuro + título)
    function drawHeader() {
      // Fondo azul oscuro
      page.drawRectangle({
        x: 0,
        y: pageHeight - marginY - 10,
        width: pageWidth,
        height: headerHeight + 20,
        color: darkBlue
      });
      // Título principal
      page.drawText('REPORTE FINANCIERO', {
        x: marginX,
        y: pageHeight - marginY + 35,
        size: titleSize,
        font: fontBold,
        color: white
      });
      // Línea decorativa debajo del título
      page.drawRectangle({
        x: marginX,
        y: pageHeight - marginY + 12,
        width: 80,
        height: 3,
        color: rgb(0.6, 0.8, 1)
      });
      // Nombre del usuario y fecha (en la parte inferior del header)
      page.drawText(`Preparado para: ${nombreUsuario}`, {
        x: marginX,
        y: pageHeight - marginY - 38,
        size: 11,
        font: font,
        color: rgb(0.85, 0.9, 0.95)
      });
      page.drawText(`Fecha: ${fecha}`, {
        x: marginX,
        y: pageHeight - marginY - 55,
        size: 10,
        font: font,
        color: rgb(0.7, 0.75, 0.85)
      });
    }

    // Dibujar el header en la primera página
    drawHeader();
    y -= headerHeight + 15;

    // Función para dibujar un título de sección
    function drawSectionTitle(text, yPos) {
      // Espacio antes del título
      yPos -= 8;
      page.drawText(text, {
        x: marginX,
        y: yPos,
        size: sectionTitleSize,
        font: fontBold,
        color: mediumBlue
      });
      // Línea decorativa debajo del título
      page.drawRectangle({
        x: marginX,
        y: yPos - 6,
        width: 50,
        height: 2.5,
        color: mediumBlue
      });
      return yPos - sectionSpacing - 4;
    }

    // Función para dibujar tabla
    function drawTable(columns, rows, yPos, options = {}) {
      const {
        headerBgColor = tableHeaderBg,
        rowEvenColor = rowEvenBg,
        rowOddColor = rowOddBg,
        borderColor = borderGray,
        headerTextColor = textDark,
        rowTextColor = textDark,
        headerFont = fontBold,
        rowFont = font,
        fontSize = bodySize
      } = options;

      // Calcular ancho total
      const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
      let x = marginX;

      // Dibujar borde de la tabla (rectángulo completo)
      const tableHeight = 18 + (rows.length * 16) + 2;
      page.drawRectangle({
        x: x,
        y: yPos - tableHeight,
        width: totalWidth,
        height: tableHeight,
        color: white,
        borderColor: borderColor,
        borderWidth: 0.8
      });

      // Encabezados
      page.drawRectangle({
        x: x,
        y: yPos - 18,
        width: totalWidth,
        height: 18,
        color: headerBgColor
      });
      let currentX = x;
      columns.forEach(col => {
        page.drawText(col.label, {
          x: currentX + 6,
          y: yPos - 13,
          size: 9,
          font: headerFont,
          color: headerTextColor
        });
        currentX += col.width;
      });
      yPos -= 20;

      // Filas
      rows.forEach((row, index) => {
        const bgColor = index % 2 === 0 ? rowEvenColor : rowOddColor;
        page.drawRectangle({
          x: x,
          y: yPos - 16,
          width: totalWidth,
          height: 16,
          color: bgColor
        });
        currentX = x;
        columns.forEach((col, i) => {
          const textColor = row.colors && row.colors[i] ? row.colors[i] : rowTextColor;
          const text = row.values[i] || '';
          page.drawText(text, {
            x: currentX + 6,
            y: yPos - 12,
            size: fontSize,
            font: rowFont,
            color: textColor
          });
          currentX += col.width;
        });
        yPos -= 16;
      });

      return yPos - 4;
    }

    // Función para dibujar tarjeta de deuda
    function drawDebtCard(deuda, pagos, yPos) {
      const cardWidth = pageWidth - 2 * marginX;
      const cardX = marginX;
      const padding = 14;
      const gap = 12;

      // Calcular altura de la tarjeta
      let cardHeight = 100 + (pagos.length > 0 ? 45 : 0);
      if (pagos.length > 5) cardHeight += (pagos.length - 5) * 14;

      // Fondo blanco con sombra suave (simulada con borde)
      page.drawRectangle({
        x: cardX,
        y: yPos - cardHeight,
        width: cardWidth,
        height: cardHeight,
        color: white,
        borderColor: borderGray,
        borderWidth: 0.8
      });
      // Borde izquierdo de color (rojo)
      page.drawRectangle({
        x: cardX,
        y: yPos - cardHeight,
        width: 4,
        height: cardHeight,
        color: redAccent
      });

      // Título de la deuda
      page.drawText(deuda.nombre, {
        x: cardX + padding + 6,
        y: yPos - 22,
        size: 13,
        font: fontBold,
        color: textDark
      });
      let currentY = yPos - 38;

      // Estadísticas (fila 1)
      const stats1 = [
        { label: 'Total deuda', value: `$${deuda.valor_total.toLocaleString()}` },
        { label: 'Pagado', value: `$${deuda.pagado_total.toLocaleString()}` },
        { label: 'Falta por pagar', value: `$${(deuda.valor_total - deuda.pagado_total).toLocaleString()}` }
      ];
      let xPos = cardX + padding + 10;
      stats1.forEach((stat, i) => {
        page.drawText(`${stat.label}:`, {
          x: xPos,
          y: currentY,
          size: 8.5,
          font: font,
          color: textMedium
        });
        const color = i === 2 ? redAccent : textDark;
        page.drawText(stat.value, {
          x: xPos + (i === 0 ? 70 : 65),
          y: currentY,
          size: 9,
          font: fontBold,
          color: color
        });
        xPos += i === 0 ? 150 : 140;
      });
      currentY -= 18;

      // Estadísticas (fila 2)
      const stats2 = [
        { label: 'Cuota mínima', value: `$${deuda.cuota_minima.toLocaleString()}` },
        { label: 'Día de pago', value: deuda.dia_pago.toString() },
        { label: 'Cuotas', value: `${deuda.cuota_actual}/${deuda.numero_cuotas}` }
      ];
      xPos = cardX + padding + 10;
      stats2.forEach((stat, i) => {
        page.drawText(`${stat.label}:`, {
          x: xPos,
          y: currentY,
          size: 8.5,
          font: font,
          color: textMedium
        });
        page.drawText(stat.value, {
          x: xPos + (i === 0 ? 70 : 65),
          y: currentY,
          size: 9,
          font: fontBold,
          color: textDark
        });
        xPos += i === 0 ? 150 : 140;
      });
      currentY -= 20;

      // Historial de pagos
      if (pagos && pagos.length > 0) {
        page.drawText('Historial de Pagos', {
          x: cardX + padding + 6,
          y: currentY,
          size: 9.5,
          font: fontBold,
          color: textDark
        });
        currentY -= 16;

        // Tabla pequeña de pagos
        const cols = [
          { label: 'Fecha', width: 110 },
          { label: 'Valor Pagado', width: 140 }
        ];
        const rows = pagos.slice(0, 8).map(p => ({
          values: [
            new Date(p.fecha_pago).toLocaleDateString(),
            `$${p.monto.toLocaleString()}`
          ],
          colors: [textDark, blueAccent]
        }));

        // Dibujar mini tabla sin bordes externos, solo líneas internas
        const tableX = cardX + padding + 6;
        const tableW = 250;
        // Encabezados
        page.drawRectangle({
          x: tableX,
          y: currentY - 14,
          width: tableW,
          height: 14,
          color: tableHeaderBg
        });
        page.drawText('Fecha', { x: tableX + 4, y: currentY - 10, size: 8, font: fontBold, color: textDark });
        page.drawText('Valor Pagado', { x: tableX + 114, y: currentY - 10, size: 8, font: fontBold, color: textDark });
        currentY -= 16;

        rows.forEach((row, idx) => {
          const bg = idx % 2 === 0 ? white : rowOddBg;
          page.drawRectangle({
            x: tableX,
            y: currentY - 14,
            width: tableW,
            height: 14,
            color: bg
          });
          page.drawText(row.values[0], { x: tableX + 4, y: currentY - 10, size: 8, font: font, color: row.colors[0] });
          page.drawText(row.values[1], { x: tableX + 114, y: currentY - 10, size: 8, font: fontBold, color: row.colors[1] });
          currentY -= 14;
        });
        currentY -= 2;
      } else {
        page.drawText('No hay pagos registrados.', {
          x: cardX + padding + 10,
          y: currentY,
          size: 8.5,
          font: font,
          color: textMedium
        });
        currentY -= 18;
      }

      return currentY - 10;
    }

    // ============================================================
    // ===== SECCIÓN 1: RESUMEN EJECUTIVO =====
    // ============================================================
    y = drawSectionTitle('Resumen Ejecutivo', y);

    // Cuadrícula de resumen (3 columnas, 2 filas)
    const resumenItems = [
      { label: 'Total Gastos', value: `$${data.resumen.totalGastos.toLocaleString()}`, color: redAccent },
      { label: 'Total Suscripciones', value: `$${data.resumen.totalSuscripciones.toLocaleString()}`, color: redAccent },
      { label: 'Total Bolsillos', value: `$${data.resumen.totalBolsillos.toLocaleString()}`, color: greenAccent },
      { label: 'Total Deudas', value: `$${data.resumen.totalDeudas.toLocaleString()}`, color: redAccent },
      { label: 'Salario Disponible', value: `$${data.resumen.salarioDisponible.toLocaleString()}`, color: blueAccent },
      { label: 'Ahorro Simulador', value: `$${data.resumen.salarioAhorro.toLocaleString()}`, color: greenAccent }
    ];

    // Dibujar tarjetas de resumen (cada una con fondo blanco y borde)
    const itemWidth = 155;
    const itemHeight = 34;
    const gapX = 15;
    let currentY = y;

    resumenItems.forEach((item, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const xPos = marginX + col * (itemWidth + gapX);
      const yPos = currentY - row * (itemHeight + 12);

      // Fondo blanco con borde
      page.drawRectangle({
        x: xPos,
        y: yPos - itemHeight,
        width: itemWidth,
        height: itemHeight,
        color: white,
        borderColor: borderGray,
        borderWidth: 0.5
      });
      // Etiqueta
      page.drawText(item.label, {
        x: xPos + 10,
        y: yPos - 22,
        size: 8.5,
        font: font,
        color: textMedium
      });
      // Valor
      page.drawText(item.value, {
        x: xPos + 10,
        y: yPos - 8,
        size: 11,
        font: fontBold,
        color: item.color
      });
    });

    y = currentY - 2 * (itemHeight + 12) - 12;

    // ============================================================
    // ===== SECCIÓN 2: GASTOS POR TARJETA/CUENTA =====
    // ============================================================
    y = drawSectionTitle('Registro de Gastos', y);

    const gastosPorTarjeta = data.detalles.gastosPorTarjeta;
    if (gastosPorTarjeta && gastosPorTarjeta.length > 0) {
      let first = true;
      gastosPorTarjeta.forEach(item => {
        if (!first) {
          // Espacio entre tarjetas
          y -= 10;
        }
        first = false;

        // Verificar espacio en página
        if (y < 120) {
          newPage();
        }

        // Título de la tarjeta
        page.drawText(`Tarjeta/Cuenta: ${item.tarjeta}`, {
          x: marginX,
          y: y,
          size: subsectionSize,
          font: fontBold,
          color: mediumBlue
        });
        y -= 14;

        if (y < 100) {
          newPage();
        }

        // Tabla de gastos
        const cols = [
          { label: 'Nombre del Gasto', width: 180 },
          { label: 'Valor', width: 110 },
          { label: 'Fecha', width: 110 }
        ];
        const rows = item.gastos.map(g => ({
          values: [
            g.nombre,
            `$${g.valor_total.toLocaleString()}`,
            new Date(g.fecha).toLocaleDateString()
          ],
          colors: [textDark, textDark, textMedium]
        }));

        y = drawTable(cols, rows, y, {
          fontSize: 9,
          rowTextColor: textDark,
          headerTextColor: textDark
        });

        y -= 10;
      });
    } else {
      page.drawText('No hay gastos registrados.', {
        x: marginX,
        y: y,
        size: bodySize,
        font: font,
        color: textMedium
      });
      y -= 20;
    }

    // ============================================================
    // ===== SECCIÓN 3: SUSCRIPCIONES =====
    // ============================================================
    y = drawSectionTitle('Suscripciones', y);

    const suscripciones = data.detalles.suscripciones;
    if (suscripciones && suscripciones.length > 0) {
      if (y < 100) newPage();

      const cols = [
        { label: 'Suscripción', width: 160 },
        { label: 'Día de Pago', width: 100 },
        { label: 'Valor', width: 130 }
      ];
      const rows = suscripciones.map(s => ({
        values: [s.nombre, s.dia_pago.toString(), `$${s.valor.toLocaleString()}`],
        colors: [textDark, textMedium, textDark]
      }));

      y = drawTable(cols, rows, y, {
        fontSize: 9,
        rowTextColor: textDark,
        headerTextColor: textDark
      });

      y -= 8;
      page.drawText(`Total mensual: $${data.resumen.totalSuscripciones.toLocaleString()}`, {
        x: marginX,
        y: y,
        size: 10.5,
        font: fontBold,
        color: blueAccent
      });
      y -= 22;
    } else {
      page.drawText('No hay suscripciones registradas.', {
        x: marginX,
        y: y,
        size: bodySize,
        font: font,
        color: textMedium
      });
      y -= 20;
    }

    // ============================================================
    // ===== SECCIÓN 4: BOLSILLOS =====
    // ============================================================
    y = drawSectionTitle('Bolsillos', y);

    const bolsillos = data.detalles.bolsillos;
    if (bolsillos && bolsillos.length > 0) {
      if (y < 100) newPage();

      const cols = [
        { label: 'Nombre del Bolsillo', width: 200 },
        { label: 'Monto Asignado', width: 160 }
      ];
      const rows = bolsillos.map(b => ({
        values: [b.nombre, `$${b.saldo.toLocaleString()}`],
        colors: [textDark, greenAccent]
      }));

      y = drawTable(cols, rows, y, {
        fontSize: 9,
        rowTextColor: textDark,
        headerTextColor: textDark
      });

      y -= 8;
      page.drawText(`Total en bolsillos: $${data.resumen.totalBolsillos.toLocaleString()}`, {
        x: marginX,
        y: y,
        size: 10.5,
        font: fontBold,
        color: greenAccent
      });
      y -= 22;
    } else {
      page.drawText('No hay bolsillos creados.', {
        x: marginX,
        y: y,
        size: bodySize,
        font: font,
        color: textMedium
      });
      y -= 20;
    }

    // ============================================================
    // ===== SECCIÓN 5: DEUDAS =====
    // ============================================================
    y = drawSectionTitle('Deudas', y);

    const deudas = data.detalles.deudas;
    if (deudas && deudas.length > 0) {
      deudas.forEach((deuda, index) => {
        if (y < 180) {
          newPage();
        }

        const pagosDeuda = data.detalles.pagos.filter(p => p.deuda_id === deuda.id);
        y = drawDebtCard(deuda, pagosDeuda, y);
        y -= 14; // Espacio entre tarjetas
      });
    } else {
      page.drawText('No hay deudas activas.', {
        x: marginX,
        y: y,
        size: bodySize,
        font: font,
        color: textMedium
      });
      y -= 20;
    }

    // ============================================================
    // ===== SECCIÓN 6: SIMULADOR DE SALARIO =====
    // ============================================================
    y = drawSectionTitle('Simulador de Salario', y);

    const simulacro = data.detalles.salario.simulacro;
    if (simulacro) {
      if (y < 120) newPage();

      // Contenedor blanco
      const cardW = pageWidth - 2 * marginX;
      const cardH = 70;
      page.drawRectangle({
        x: marginX,
        y: y - cardH,
        width: cardW,
        height: cardH,
        color: white,
        borderColor: borderGray,
        borderWidth: 0.8
      });

      // Estadísticas del simulacro
      const simItems = [
        { label: 'Salario inicial', value: `$${simulacro.salario_inicial.toLocaleString()}` },
        { label: 'Disponible', value: `$${simulacro.saldo_disponible.toLocaleString()}`, color: blueAccent },
        { label: 'Ahorro acumulado', value: `$${simulacro.ahorro.toLocaleString()}`, color: greenAccent }
      ];
      let xPos = marginX + 20;
      simItems.forEach((item, i) => {
        page.drawText(`${item.label}:`, {
          x: xPos,
          y: y - 18,
          size: 9,
          font: font,
          color: textMedium
        });
        const color = item.color || textDark;
        page.drawText(item.value, {
          x: xPos,
          y: y - 4,
          size: 10.5,
          font: fontBold,
          color: color
        });
        xPos += 165;
      });
      y -= cardH + 10;

      // Gastos del simulacro
      const gastosSim = data.detalles.salario.gastos;
      if (gastosSim && gastosSim.length > 0) {
        if (y < 80) newPage();

        page.drawText('Gastos del simulacro:', {
          x: marginX,
          y: y,
          size: 10,
          font: fontBold,
          color: textDark
        });
        y -= 14;

        const cols = [
          { label: 'Nombre', width: 250 },
          { label: 'Valor', width: 150 }
        ];
        const rows = gastosSim.map(g => ({
          values: [g.nombre, `-$${g.valor.toLocaleString()}`],
          colors: [textDark, redAccent]
        }));

        y = drawTable(cols, rows, y, {
          fontSize: 9,
          rowTextColor: textDark,
          headerTextColor: textDark
        });
        y -= 12;
      } else {
        page.drawText('No hay gastos registrados en el simulacro.', {
          x: marginX + 10,
          y: y,
          size: 9,
          font: font,
          color: textMedium
        });
        y -= 18;
      }
    } else {
      page.drawText('No hay simulacro de salario activo.', {
        x: marginX,
        y: y,
        size: bodySize,
        font: font,
        color: textMedium
      });
      y -= 20;
    }

    // ============================================================
    // ===== PIE DE PÁGINA =====
    // ============================================================
    // Espacio hasta el final
    y -= 10;
    page.drawText('Reporte generado automáticamente - Finanzas App', {
      x: marginX,
      y: 32,
      size: 8,
      font: font,
      color: textMedium
    });
    page.drawText(`Generado: ${new Date().toLocaleString('es-CO')}`, {
      x: marginX,
      y: 20,
      size: 8,
      font: font,
      color: textMedium
    });

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
