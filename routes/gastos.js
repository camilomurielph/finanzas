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

// ===== Página principal (con filtro) =====
router.get('/', auth, (req, res) => {
  const { cuenta } = req.query;
  const tipos = TipoGasto.findAllByUser(req.session.user.id);
  const gastos = Gasto.findAllByUser(req.session.user.id, cuenta || null);
  gastos.forEach(g => {
    g.cuotas = Cuota.findAllByGasto(g.id);
  });
  const archivados = Gasto.findArchivedByUser(req.session.user.id, cuenta || null);
  archivados.forEach(g => {
    g.cuotas = Cuota.findAllByGasto(g.id);
  });
  res.render('gastos/index', { 
    title: 'Gastos', 
    tipos, 
    gastos, 
    archivados,
    cuentaSeleccionada: cuenta || null
  });
});

// ===== API para obtener un gasto en JSON =====
router.get('/api/:id', auth, (req, res) => {
  const gasto = Gasto.findById(req.params.id, req.session.user.id);
  if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });
  res.json(gasto);
});

// ===== Obtener todas las cuentas del usuario (API) =====
router.get('/api/cuentas', auth, (req, res) => {
  const tipos = TipoGasto.findAllByUser(req.session.user.id);
  res.json(tipos);
});

// ===== Crear nueva cuenta =====
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

// ===== Editar cuenta =====
router.put('/tipos/:id', auth, (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const stmt = db.prepare('UPDATE tipos_gasto SET nombre = ? WHERE id = ? AND usuario_id = ?');
    stmt.run(nombre, req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Borrar cuenta =====
router.delete('/tipos/:id', auth, (req, res) => {
  try {
    TipoGasto.delete(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Agregar gasto =====
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

// ===== Editar gasto =====
router.put('/editar/:id', auth, (req, res) => {
  const { tipo_gasto_id, nombre, fecha, valor_total } = req.body;
  try {
    Gasto.update(req.params.id, req.session.user.id, { tipo_gasto_id, nombre, fecha, valor_total });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Borrar gasto =====
router.delete('/borrar/:id', auth, (req, res) => {
  try {
    Gasto.delete(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Archivar gasto =====
router.put('/archivar/:id', auth, (req, res) => {
  try {
    Gasto.archive(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Desarchivar gasto =====
router.put('/desarchivar/:id', auth, (req, res) => {
  try {
    const stmt = db.prepare('UPDATE gastos SET archivado = 0 WHERE id = ? AND usuario_id = ?');
    stmt.run(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Dividir gasto =====
router.post('/dividir/:id', auth, (req, res) => {
  const { cuotas } = req.body;
  if (!cuotas || !cuotas.length) {
    return res.status(400).json({ error: 'Debe enviar al menos una cuota' });
  }
  try {
    const gasto = Gasto.findById(req.params.id, req.session.user.id);
    if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });
    Cuota.deleteAllByGasto(req.params.id);
    cuotas.forEach(c => {
      Cuota.create(req.params.id, c.nombre, parseFloat(c.valor));
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Marcar/desmarcar pago de cuota =====
router.put('/cuota/:id/pago', auth, (req, res) => {
  const { pagado, fecha_pago } = req.body;
  try {
    Cuota.updatePago(req.params.id, pagado ? 1 : 0, fecha_pago || null);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Marcar/desmarcar pago de gasto =====
router.put('/gasto/:id/pago', auth, (req, res) => {
  const { pagado } = req.body;
  try {
    Gasto.togglePagado(req.params.id, req.session.user.id, pagado);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Vista detalle =====
router.get('/detalle/:id', auth, (req, res) => {
  const gasto = Gasto.findById(req.params.id, req.session.user.id);
  if (!gasto) return res.status(404).send('Gasto no encontrado');
  gasto.cuotas = Cuota.findAllByGasto(gasto.id);
  res.render('gastos/detalle', { title: 'Detalle del gasto', gasto });
});

module.exports = router;
