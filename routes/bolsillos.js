const router = require('express').Router();
const Bolsillo = require('../models/Bolsillo');
const SubBolsillo = require('../models/SubBolsillo');
const Movimiento = require('../models/Movimiento');

// Middleware de autenticación
function auth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// ===== Página principal de bolsillos =====
router.get('/', auth, (req, res) => {
  const bolsillos = Bolsillo.findAllByUser(req.session.user.id);
  const totalGeneral = Bolsillo.getTotalSaldo(req.session.user.id);
  res.render('bolsillos/index', {
    title: 'Bolsillos',
    bolsillos,
    totalGeneral,
    active: 'bolsillos'
  });
});

// ===== Obtener un bolsillo en JSON =====
router.get('/api/:id', auth, (req, res) => {
  const bolsillo = Bolsillo.findById(req.params.id, req.session.user.id);
  if (!bolsillo) return res.status(404).json({ error: 'Bolsillo no encontrado' });
  res.json(bolsillo);
});

// ===== Crear nuevo bolsillo =====
router.post('/', auth, (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

  const count = Bolsillo.countByUser(req.session.user.id);
  if (count >= 20) {
    return res.status(400).json({ error: 'Límite máximo de 20 bolsillos alcanzado' });
  }

  try {
    const id = Bolsillo.create(req.session.user.id, nombre);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Añadir dinero al bolsillo (solo si NO tiene sub-bolsillos) =====
router.post('/:id/ingreso', auth, (req, res) => {
  const { monto, descripcion } = req.body;
  if (!monto || parseFloat(monto) <= 0) {
    return res.status(400).json({ error: 'Monto debe ser mayor a 0' });
  }
  try {
    const bolsillo = Bolsillo.findById(req.params.id, req.session.user.id);
    if (!bolsillo) return res.status(404).json({ error: 'Bolsillo no encontrado' });

    if (SubBolsillo.hasSubBolsillos(bolsillo.id)) {
      return res.status(400).json({ error: 'Este bolsillo tiene categorías. Usa las categorías para gestionar el dinero.' });
    }

    const montoNum = parseFloat(monto);
    Bolsillo.updateSaldo(req.params.id, req.session.user.id, montoNum);
    Movimiento.create(bolsillo.id, null, 'ingreso', montoNum, descripcion || null);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Retirar dinero del bolsillo (solo si NO tiene sub-bolsillos) =====
router.post('/:id/egreso', auth, (req, res) => {
  const { monto, descripcion } = req.body;
  if (!monto || parseFloat(monto) <= 0) {
    return res.status(400).json({ error: 'Monto debe ser mayor a 0' });
  }
  try {
    const bolsillo = Bolsillo.findById(req.params.id, req.session.user.id);
    if (!bolsillo) return res.status(404).json({ error: 'Bolsillo no encontrado' });

    if (SubBolsillo.hasSubBolsillos(bolsillo.id)) {
      return res.status(400).json({ error: 'Este bolsillo tiene categorías. Usa las categorías para gestionar el dinero.' });
    }

    const montoNum = parseFloat(monto);
    if (bolsillo.saldo < montoNum) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }
    Bolsillo.updateSaldo(req.params.id, req.session.user.id, -montoNum);
    Movimiento.create(bolsillo.id, null, 'egreso', montoNum, descripcion || null);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Borrar bolsillo =====
router.delete('/:id', auth, (req, res) => {
  try {
    Bolsillo.delete(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Actualizar orden (drag & drop) - DEBE IR ANTES DE PUT /:id =====
router.put('/orden', auth, (req, res) => {
  const { ordenes } = req.body;
  if (!ordenes || !Array.isArray(ordenes)) {
    return res.status(400).json({ error: 'Ordenes inválidas' });
  }
  try {
    const usuario_id = req.session.user.id;
    ordenes.forEach(item => {
      Bolsillo.updateOrden(item.id, usuario_id, item.orden);
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Editar nombre del bolsillo =====
router.put('/:id', auth, (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    Bolsillo.updateNombre(req.params.id, req.session.user.id, nombre);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ===== RUTAS PARA SUB-BOLSILLOS (CATEGORÍAS) =====
// ============================================================

// ===== Obtener sub-bolsillos de un bolsillo =====
router.get('/:id/sub', auth, (req, res) => {
  try {
    const bolsillo = Bolsillo.findById(req.params.id, req.session.user.id);
    if (!bolsillo) return res.status(404).json({ error: 'Bolsillo no encontrado' });
    const subBolsillos = SubBolsillo.findAllByBolsillo(bolsillo.id);
    res.json(subBolsillos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Crear sub-bolsillo =====
router.post('/:id/sub', auth, (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const bolsillo = Bolsillo.findById(req.params.id, req.session.user.id);
    if (!bolsillo) return res.status(404).json({ error: 'Bolsillo no encontrado' });

    const subId = SubBolsillo.create(bolsillo.id, nombre);
    res.json({ success: true, id: subId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Editar nombre de sub-bolsillo =====
router.put('/sub/:id', auth, (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const sub = SubBolsillo.findByIdAndUser(req.params.id, req.session.user.id);
    if (!sub) return res.status(404).json({ error: 'Sub-bolsillo no encontrado' });
    SubBolsillo.updateNombre(sub.id, sub.bolsillo_id, nombre);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Eliminar sub-bolsillo (transferir saldo al padre) =====
router.delete('/sub/:id', auth, (req, res) => {
  try {
    const sub = SubBolsillo.findByIdAndUser(req.params.id, req.session.user.id);
    if (!sub) return res.status(404).json({ error: 'Sub-bolsillo no encontrado' });

    // Transferir saldo al bolsillo padre
    if (sub.saldo > 0) {
      Bolsillo.updateSaldo(sub.bolsillo_id, req.session.user.id, sub.saldo);
      Movimiento.create(sub.bolsillo_id, null, 'ingreso', sub.saldo, `Transferencia desde categoría "${sub.nombre}"`);
    }

    Movimiento.deleteAllBySubBolsillo(sub.id);
    SubBolsillo.delete(sub.id, sub.bolsillo_id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Añadir dinero a sub-bolsillo =====
router.post('/sub/:id/ingreso', auth, (req, res) => {
  const { monto, descripcion } = req.body;
  if (!monto || parseFloat(monto) <= 0) {
    return res.status(400).json({ error: 'Monto debe ser mayor a 0' });
  }
  try {
    const sub = SubBolsillo.findByIdAndUser(req.params.id, req.session.user.id);
    if (!sub) return res.status(404).json({ error: 'Sub-bolsillo no encontrado' });

    const montoNum = parseFloat(monto);
    SubBolsillo.updateSaldo(sub.id, sub.bolsillo_id, montoNum);
    Movimiento.create(null, sub.id, 'ingreso', montoNum, descripcion || null);
    Bolsillo.updateSaldo(sub.bolsillo_id, req.session.user.id, montoNum);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Retirar dinero de sub-bolsillo =====
router.post('/sub/:id/egreso', auth, (req, res) => {
  const { monto, descripcion } = req.body;
  if (!monto || parseFloat(monto) <= 0) {
    return res.status(400).json({ error: 'Monto debe ser mayor a 0' });
  }
  try {
    const sub = SubBolsillo.findByIdAndUser(req.params.id, req.session.user.id);
    if (!sub) return res.status(404).json({ error: 'Sub-bolsillo no encontrado' });

    const montoNum = parseFloat(monto);
    if (sub.saldo < montoNum) {
      return res.status(400).json({ error: 'Saldo insuficiente en esta categoría' });
    }
    SubBolsillo.updateSaldo(sub.id, sub.bolsillo_id, -montoNum);
    Movimiento.create(null, sub.id, 'egreso', montoNum, descripcion || null);
    Bolsillo.updateSaldo(sub.bolsillo_id, req.session.user.id, -montoNum);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Obtener movimientos de un sub-bolsillo =====
router.get('/sub/:id/movimientos', auth, (req, res) => {
  try {
    const sub = SubBolsillo.findByIdAndUser(req.params.id, req.session.user.id);
    if (!sub) return res.status(404).json({ error: 'Sub-bolsillo no encontrado' });
    const movimientos = Movimiento.findAllBySubBolsillo(sub.id);
    res.json(movimientos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ===== VISTA DETALLE DE BOLSILLO (DEBE IR AL FINAL) =====
// ============================================================
router.get('/:id', auth, (req, res) => {
  const bolsillo = Bolsillo.findById(req.params.id, req.session.user.id);
  if (!bolsillo) return res.status(404).send('Bolsillo no encontrado');

  const tieneSub = SubBolsillo.hasSubBolsillos(bolsillo.id);
  let subBolsillos = [];
  let movimientos = [];

  if (tieneSub) {
    subBolsillos = SubBolsillo.findAllByBolsillo(bolsillo.id);
    movimientos = Movimiento.findAllByBolsillo(bolsillo.id);
    bolsillo.saldo = SubBolsillo.getTotalSaldo(bolsillo.id);
  } else {
    movimientos = Movimiento.findAllByBolsillo(bolsillo.id);
  }

  res.render('bolsillos/detalle', {
    title: bolsillo.nombre,
    bolsillo,
    tieneSub,
    subBolsillos,
    movimientos,
    active: 'bolsillos'
  });
});

module.exports = router;
