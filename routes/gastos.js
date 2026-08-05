const router = require('express').Router();
const Gasto = require('../models/Gasto');
const Cuota = require('../models/Cuota');
const TipoGasto = require('../models/TipoGasto');
const db = require('../models/db');

// Middleware de autenticación
function auth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Página principal de gastos
router.get('/', auth, (req, res) => {
  const tipos = TipoGasto.findAllByUser(req.session.user.id);
  const gastos = Gasto.findAllByUser(req.session.user.id);
  gastos.forEach(g => {
    g.cuotas = Cuota.findAllByGasto(g.id);
  });
  res.render('gastos/index', { title: 'Gastos', tipos, gastos });
});

// Crear nuevo tipo de gasto (AJAX)
router.post('/tipos', auth, (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const info = TipoGasto.create(req.session.user.id, nombre);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agregar gasto
router.post('/agregar', auth, (req, res) => {
  const { tipo_gasto_id, nombre, fecha, valor_total } = req.body;
  if (!tipo_gasto_id || !nombre || !fecha || !valor_total) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  try {
    const id = Gasto.create(req.session.user.id, tipo_gasto_id, nombre, fecha, parseFloat(valor_total));
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar gasto
router.put('/editar/:id', auth, (req, res) => {
  const { tipo_gasto_id, nombre, fecha, valor_total } = req.body;
  try {
    Gasto.update(req.params.id, req.session.user.id, { tipo_gasto_id, nombre, fecha, valor_total });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Borrar gasto
router.delete('/borrar/:id', auth, (req, res) => {
  try {
    Gasto.delete(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Archivar gasto
router.put('/archivar/:id', auth, (req, res) => {
  try {
    Gasto.archive(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dividir gasto (reemplazar cuotas)
router.post('/dividir/:id', auth, (req, res) => {
  const { cuotas } = req.body; // array de {nombre, valor}
  if (!cuotas || !cuotas.length) {
    return res.status(400).json({ error: 'Debe enviar al menos una cuota' });
  }
  try {
    const gasto = Gasto.findById(req.params.id, req.session.user.id);
    if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });
    // Eliminar cuotas existentes
    Cuota.deleteAllByGasto(req.params.id);
    // Insertar nuevas
    cuotas.forEach(c => {
      Cuota.create(req.params.id, c.nombre, parseFloat(c.valor));
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marcar/desmarcar pago de cuota
router.put('/cuota/:id/pago', auth, (req, res) => {
  const { pagado, fecha_pago } = req.body;
  try {
    Cuota.updatePago(req.params.id, pagado ? 1 : 0, fecha_pago || null);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vista detalle de un gasto
router.get('/detalle/:id', auth, (req, res) => {
  const gasto = Gasto.findById(req.params.id, req.session.user.id);
  if (!gasto) return res.status(404).send('Gasto no encontrado');
  gasto.cuotas = Cuota.findAllByGasto(gasto.id);
  res.render('gastos/detalle', { title: 'Detalle del gasto', gasto });
});

// Obtener datos de un gasto en formato JSON (para editar)
router.get('/api/:id', auth, (req, res) => {
  const gasto = Gasto.findById(req.params.id, req.session.user.id);
  if (!gasto) return res.status(404).json({ error: 'No encontrado' });
  res.json(gasto);
});

module.exports = router;