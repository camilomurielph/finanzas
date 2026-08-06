const router = require('express').Router();
const puppeteer = require('puppeteer');
const path = require('path');
const ejs = require('ejs');
const ReporteHelper = require('../models/ReporteHelper');

function auth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

router.get('/', auth, (req, res) => {
  res.render('reporte/index', {
    title: 'Reporte Financiero',
    active: 'reporte'
  });
});

router.get('/pdf', auth, async (req, res) => {
  try {
    const data = ReporteHelper.getResumen(req.session.user.id);
    data.usuario = req.session.user.email;
    data.fechaGeneracion = new Date().toLocaleDateString('es-CO');

    const templatePath = path.join(__dirname, '../views/reporte/template.ejs');
    const html = await ejs.renderFile(templatePath, data);

    // Lanzar Puppeteer usando el Chrome del sistema
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ],
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

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-financiero-${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).send('Error generando el reporte: ' + err.message);
  }
});

module.exports = router;
