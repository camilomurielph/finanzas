const router = require('express').Router();
const puppeteer = require('puppeteer');
const path = require('path');
const ejs = require('ejs');
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

// ===== Generar PDF =====
router.get('/pdf', auth, async (req, res) => {
  try {
    // 1. Obtener datos
    const data = ReporteHelper.getResumen(req.session.user.id);
    data.usuario = req.session.user.email;
    data.fechaGeneracion = new Date().toLocaleDateString('es-CO');

    // 2. Renderizar HTML con EJS
    const templatePath = path.join(__dirname, '../views/reporte/template.ejs');
    const html = await ejs.renderFile(templatePath, data);

    // 3. Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new'
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    });

    await browser.close();

    // 4. Descargar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-financiero-${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).send('Error generando el reporte: ' + err.message);
  }
});

module.exports = router;
