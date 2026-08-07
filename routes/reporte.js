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
    const darkBlue = rgb(0.05, 0.1, 0.25);
    const mediumBlue = rgb(0.1, 0.25, 0.55);
    const lightBg = rgb(0.96, 0.97, 0.99);
    const tableHeaderBg = rgb(0.92, 0.94, 0.96);
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
    const marginY = 70;  // Aumentado para dar más margen superior
    const lineHeight = 20;
    const headerHeight = 100; // Aumentado para dar más espacio al título
    const sectionSpacing = 28; // Más separación entre secciones
    const titleSize = 22;
    const sectionTitleSize = 16;
    const subsectionSize = 12;
    const bodySize = 10;
    const smallSize = 9;

    // ===== FUNCIONES DE DIBUJO =====
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - marginY;

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
      drawHeader();
      y -= headerHeight + 20;
    }

    // Función para dibujar el header
    function drawHeader() {
      // Fondo azul oscuro
      page.drawRectangle({
        x: 0,
        y: pageHeight - marginY - 10,
        width: pageWidth,
        height: headerHeight + 20,
        color: darkBlue
      });
      // Título principal (más abajo, con margen)
      page.drawText('REPORTE FINANCIERO', {
        x: marginX,
        y: pageHeight - marginY + 40,
        size: titleSize,
        font: fontBold,
        color: white
      });
      // Línea decorativa
      page.drawRectangle({
        x: marginX,
        y: pageHeight - marginY + 18,
        width: 90,
        height: 3,
        color: rgb(0.6, 0.8, 1)
      });
      // Nombre y fecha
      page.drawText(`Preparado para: ${nombreUsuario}`, {
        x: marginX,
        y: pageHeight - marginY - 32,
        size: 11,
        font: font,
        color: rgb(0.85, 0.9, 0.95)
      });
      page.drawText(`Fecha: ${fecha}`, {
        x: marginX,
        y: pageHeight - marginY - 50,
        size: 10,
        font: font,
        color: rgb(0.7, 0.75, 0.85)
      });
    }

    // Dibujar header en primera página
    drawHeader();
    y -= headerHeight + 25;

    // Función para dibujar título de sección (con más separación)
    function drawSectionTitle(text, yPos) {
      // Verificar que haya espacio suficiente para el título y al menos 3 líneas de contenido
      if (yPos < 120) {
        newPage();
        yPos = y;
      }
      // Espacio antes del título
      yPos -= 10;
      page.drawText(text, {
        x: marginX,
        y: yPos,
        size: sectionTitleSize,
        font: fontBold,
        color: mediumBlue
      });
      // Línea decorativa
      page.drawRectangle({
        x: marginX,
        y: yPos - 7,
        width: 60,
        height: 2.5,
        color: mediumBlue
      });
      return yPos - sectionSpacing - 6;
    }

    // Función para dibujar tabla (ancho completo hasta el margen)
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

      // Calcular ancho total (ocupa todo el espacio entre márgenes)
      const totalWidth = pageWidth - 2 * marginX;
      let x = marginX;

      // Dibujar borde de la tabla (rectángulo completo)
      const rowHeight = 18;
      const headerHeight = 20;
      const tableHeight = headerHeight + (rows.length * rowHeight) + 2;
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
        y: yPos - headerHeight,
        width: totalWidth,
        height: headerHeight,
        color: headerBgColor
      });
      let currentX = x;
      const colWidths = columns.map(col => (col.width / 100) * totalWidth);
      columns.forEach((col, i) => {
        const colWidth = colWidths[i] || totalWidth / columns.length;
        page.drawText(col.label, {
          x: currentX + 8,
          y: yPos - headerHeight + 5,
          size: 9.5,
          font: headerFont,
          color: headerTextColor
        });
        currentX += colWidth;
      });
      yPos -= headerHeight + 1;

      // Filas
      rows.forEach((row, index) => {
        const bgColor = index % 2 === 0 ? rowEvenColor : rowOddColor;
        page.drawRectangle({
          x: x,
          y: yPos - rowHeight,
          width: totalWidth,
          height: rowHeight,
          color: bgColor
        });
        currentX = x;
        columns.forEach((col, i) => {
          const colWidth = colWidths[i] || totalWidth / columns.length;
          const textColor = row.colors && row.colors[i] ? row.colors[i] : rowTextColor;
          const text = row.values[i] || '';
          page.drawText(text, {
            x: currentX + 8,
            y: yPos - rowHeight + 4,
            size: fontSize,
            font: rowFont,
            color: textColor
          });
          currentX += colWidth;
        });
        yPos -= rowHeight;
      });

      return yPos - 4;
    }

    // Función para dibujar tarjeta de deuda (con más espacio)
    function drawDebtCard(deuda, pagos, yPos) {
      const cardWidth = pageWidth - 2 * marginX;
      const cardX = marginX;
      const padding = 16;
      const gap = 14;

      // Calcular altura de la tarjeta
      let cardHeight = 120 + (pagos.length > 0 ? 50 : 0);
      if (pagos.length > 5) cardHeight += (pagos.length - 5) * 16;

      // Verificar espacio en página
      if (yPos - cardHeight < 60) {
        newPage();
        yPos = y;
        // Dibujar el título de sección nuevamente en la nueva página
        page.drawText('Deudas (continuación)', {
          x: marginX,
          y: yPos,
          size: sectionTitleSize - 2,
          font: fontBold,
          color: mediumBlue
        });
        yPos -= sectionSpacing + 4;
      }

      // Fondo blanco con borde
      page.drawRectangle({
        x: cardX,
        y: yPos - cardHeight,
        width: cardWidth,
        height: cardHeight,
        color: white,
        borderColor: borderGray,
        borderWidth: 0.8
      });
      // Borde izquierdo rojo
      page.drawRectangle({
        x: cardX,
        y: yPos - cardHeight,
        width: 5,
        height: cardHeight,
        color: redAccent
      });

      // Título de la deuda
      page.drawText(deuda.nombre, {
        x: cardX + padding + 8,
        y: yPos - 26,
        size: 14,
        font: fontBold,
        color: textDark
      });
      let currentY = yPos - 44;

      // Estadísticas (fila 1) - con más espacio
      const stats1 = [
        { label: 'Total deuda', value: `$${deuda.valor_total.toLocaleString()}` },
        { label: 'Pagado', value: `$${deuda.pagado_total.toLocaleString()}` },
        { label: 'Falta por pagar', value: `$${(deuda.valor_total - deuda.pagado_total).toLocaleString()}` }
      ];
      let xPos = cardX + padding + 12;
      stats1.forEach((stat, i) => {
        page.drawText(`${stat.label}:`, {
          x: xPos,
          y: currentY,
          size: 9,
          font: font,
          color: textMedium
        });
        const color = i === 2 ? redAccent : textDark;
        page.drawText(stat.value, {
          x: xPos + (i === 0 ? 75 : 70),
          y: currentY,
          size: 10,
          font: fontBold,
          color: color
        });
        xPos += i === 0 ? 165 : 155;
      });
      currentY -= 22;

      // Estadísticas (fila 2)
      const stats2 = [
        { label: 'Cuota mínima', value: `$${deuda.cuota_minima.toLocaleString()}` },
        { label: 'Día de pago', value: deuda.dia_pago.toString() },
        { label: 'Cuotas', value: `${deuda.cuota_actual}/${deuda.numero_cuotas}` }
      ];
      xPos = cardX + padding + 12;
      stats2.forEach((stat, i) => {
        page.drawText(`${stat.label}:`, {
          x: xPos,
          y: currentY,
          size: 9,
          font: font,
          color: textMedium
        });
        page.drawText(stat.value, {
          x: xPos + (i === 0 ? 75 : 70),
          y: currentY,
          size: 10,
          font: fontBold,
          color: textDark
        });
        xPos += i === 0 ? 165 : 155;
      });
      currentY -= 24;

      // Historial de pagos
      if (pagos && pagos.length > 0) {
        page.drawText('Historial de Pagos', {
          x: cardX + padding + 8,
          y: currentY,
          size: 10,
          font: fontBold,
          color: textDark
        });
        currentY -= 18;

        // Tabla de pagos (ancho fijo dentro de la tarjeta)
        const cols = [
          { label: 'Fecha', width: 40 },
          { label: 'Valor Pagado', width: 40 }
        ];
        const rows = pagos.slice(0, 8).map(p => ({
          values: [
            new Date(p.fecha_pago).toLocaleDateString(),
            `$${p.monto.toLocaleString()}`
          ],
          colors: [textDark, blueAccent]
        }));

        const tableX = cardX + padding + 8;
        const tableW = 260;
        // Encabezados
        page.drawRectangle({
          x: tableX,
          y: currentY - 16,
          width: tableW,
          height: 16,
          color: tableHeaderBg
        });
        page.drawText('Fecha', { x: tableX + 6, y: currentY - 11, size: 8.5, font: fontBold, color: textDark });
        page.drawText('Valor Pagado', { x: tableX + 120, y: currentY - 11, size: 8.5, font: fontBold, color: textDark });
        currentY -= 18;

        rows.forEach((row, idx) => {
          const bg = idx % 2 === 0 ? white : rowOddBg;
          page.drawRectangle({
            x: tableX,
            y: currentY - 16,
            width: tableW,
            height: 16,
            color: bg
          });
          page.drawText(row.values[0], { x: tableX + 6, y: currentY - 11, size: 8.5, font: font, color: row.colors[0] });
          page.drawText(row.values[1], { x: tableX + 120, y: currentY - 11, size: 8.5, font: fontBold, color: row.colors[1] });
          currentY -= 16;
        });
        currentY -= 4;
      } else {
        page.drawText('No hay pagos registrados.', {
          x: cardX + padding + 12,
          y: currentY,
          size: 9,
          font: font,
          color: textMedium
        });
        currentY -= 20;
      }

      return currentY - 10;
    }

    // ============================================================
    // ===== SECCIÓN 1: RESUMEN EJECUTIVO =====
    // ============================================================
    y = drawSectionTitle('Resumen Ejecutivo', y);

    // Cuadros de resumen (más altos y centrados)
    const resumenItems = [
      { label: 'Total Gastos', value: `$${data.resumen.totalGastos.toLocaleString()}`, color: redAccent },
      { label: 'Total Suscripciones', value: `$${data.resumen.totalSuscripciones.toLocaleString()}`, color: redAccent },
      { label: 'Total Bolsillos', value: `$${data.resumen.totalBolsillos.toLocaleString()}`, color: greenAccent },
      { label: 'Total Deudas', value: `$${data.resumen.totalDeudas.toLocaleString()}`, color: redAccent }
    ];

    const itemWidth = (pageWidth - 2 * marginX - 3 * 14) / 4;
    const itemHeight = 48;
    let currentY = y;

    resumenItems.forEach((item, index) => {
      const xPos = marginX + index * (itemWidth + 14);
      const yPos = currentY - itemHeight;

      // Fondo blanco con borde
      page.drawRectangle({
        x: xPos,
        y: yPos,
        width: itemWidth,
        height: itemHeight,
        color: white,
        borderColor: borderGray,
        borderWidth: 0.5
      });
      // Etiqueta (centrada horizontalmente)
      page.drawText(item.label, {
        x: xPos + itemWidth / 2 - 30,
        y: yPos + 14,
        size: 8.5,
        font: font,
        color: textMedium
      });
      // Valor (centrado)
      page.drawText(item.value, {
        x: xPos + itemWidth / 2 - 35,
        y: yPos + 30,
        size: 12,
        font: fontBold,
        color: item.color
      });
    });

    y = currentY - itemHeight - 22;

    // ============================================================
    // ===== SECCIÓN 2: GASTOS =====
    // ============================================================
    y = drawSectionTitle('Registro de Gastos', y);

    const gastosPorTarjeta = data.detalles.gastosPorTarjeta;
    if (gastosPorTarjeta && gastosPorTarjeta.length > 0) {
      let first = true;
      gastosPorTarjeta.forEach(item => {
        if (!first) {
          y -= 14;
        }
        first = false;

        // Verificar espacio
        if (y < 100) {
          newPage();
          y = drawSectionTitle('Registro de Gastos (cont.)', y);
        }

        // Título de la tarjeta
        page.drawText(`Tarjeta/Cuenta: ${item.tarjeta}`, {
          x: marginX,
          y: y,
          size: subsectionSize,
          font: fontBold,
          color: mediumBlue
        });
        y -= 18;

        // Tabla de gastos (ancho completo)
        const cols = [
          { label: 'Nombre del Gasto', width: 45 },
          { label: 'Valor', width: 25 },
          { label: 'Fecha', width: 30 }
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
          fontSize: bodySize,
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
      y -= 22;
    }

    // ============================================================
    // ===== SECCIÓN 3: SUSCRIPCIONES =====
    // ============================================================
    y = drawSectionTitle('Suscripciones', y);

    const suscripciones = data.detalles.suscripciones;
    if (suscripciones && suscripciones.length > 0) {
      if (y < 100) newPage();

      const cols = [
        { label: 'Suscripción', width: 35 },
        { label: 'Día de Pago', width: 25 },
        { label: 'Valor', width: 25 }
      ];
      const rows = suscripciones.map(s => ({
        values: [s.nombre, s.dia_pago.toString(), `$${s.valor.toLocaleString()}`],
        colors: [textDark, textMedium, textDark]
      }));

      y = drawTable(cols, rows, y, {
        fontSize: bodySize,
        rowTextColor: textDark,
        headerTextColor: textDark
      });

      y -= 10;
      page.drawText(`Total mensual: $${data.resumen.totalSuscripciones.toLocaleString()}`, {
        x: marginX,
        y: y,
        size: 10.5,
        font: fontBold,
        color: blueAccent
      });
      y -= 24;
    } else {
      page.drawText('No hay suscripciones registradas.', {
        x: marginX,
        y: y,
        size: bodySize,
        font: font,
        color: textMedium
      });
      y -= 22;
    }

    // ============================================================
    // ===== SECCIÓN 4: BOLSILLOS =====
    // ============================================================
    y = drawSectionTitle('Bolsillos', y);

    const bolsillos = data.detalles.bolsillos;
    if (bolsillos && bolsillos.length > 0) {
      if (y < 100) newPage();

      const cols = [
        { label: 'Nombre del Bolsillo', width: 50 },
        { label: 'Monto Asignado', width: 30 }
      ];
      const rows = bolsillos.map(b => ({
        values: [b.nombre, `$${b.saldo.toLocaleString()}`],
        colors: [textDark, greenAccent]
      }));

      y = drawTable(cols, rows, y, {
        fontSize: bodySize,
        rowTextColor: textDark,
        headerTextColor: textDark
      });

      y -= 10;
      page.drawText(`Total en bolsillos: $${data.resumen.totalBolsillos.toLocaleString()}`, {
        x: marginX,
        y: y,
        size: 10.5,
        font: fontBold,
        color: greenAccent
      });
      y -= 24;
    } else {
      page.drawText('No hay bolsillos creados.', {
        x: marginX,
        y: y,
        size: bodySize,
        font: font,
        color: textMedium
      });
      y -= 22;
    }

    // ============================================================
    // ===== SECCIÓN 5: DEUDAS =====
    // ============================================================
    y = drawSectionTitle('Deudas', y);

    const deudas = data.detalles.deudas;
    if (deudas && deudas.length > 0) {
      deudas.forEach((deuda, index) => {
        const pagosDeuda = data.detalles.pagos.filter(p => p.deuda_id === deuda.id);
        y = drawDebtCard(deuda, pagosDeuda, y);
        y -= 16; // Espacio entre tarjetas
      });
    } else {
      page.drawText('No hay deudas activas.', {
        x: marginX,
        y: y,
        size: bodySize,
        font: font,
        color: textMedium
      });
      y -= 22;
    }

    // ============================================================
    // ===== PIE DE PÁGINA =====
    // ============================================================
    // Siempre en la última página
    const lastPage = page;
    lastPage.drawText('Reporte generado automáticamente - Finanzas App', {
      x: marginX,
      y: 35,
      size: 8.5,
      font: font,
      color: textMedium
    });
    lastPage.drawText(`Generado: ${new Date().toLocaleString('es-CO')}`, {
      x: marginX,
      y: 22,
      size: 8.5,
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
