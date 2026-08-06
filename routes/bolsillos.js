const router = require('express').Router();
const Bolsillo = require('../models/Bolsillo');
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

// ===== Obtener un bolsillo en JSON (para editar) =====
router.get('/api/:id', auth, (req, res) => {
  const bolsillo = Bolsillo.findById(req.params.id, req.session.user.id);
  if (!bolsillo) return res.status(404).json({ error: 'Bolsillo no encontrado' });
  res.json(bolsillo);
});

// ===== Crear nuevo bolsillo =====
router.post('/', auth, (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

  // Verificar límite de 20
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

// ===== Añadir dinero al bolsillo (ingreso) =====
router.post('/:id/ingreso', auth, (req, res) => {
  const { monto, descripcion } = req.body;
  if (!monto || parseFloat(monto) <= 0) {
    return res.status(400).json({ error: 'Monto debe ser mayor a 0' });
  }
  try {
    const bolsillo = Bolsillo.findById(req.params.id, req.session.user.id);
    if (!bolsillo) return res.status(404).json({ error: 'Bolsillo no encontrado' });

    const montoNum = parseFloat(monto);
    // Actualizar saldo
    Bolsillo.updateSaldo(req.params.id, req.session.user.id, montoNum);
    // Registrar movimiento
    Movimiento.create(req.params.id, 'ingreso', montoNum, descripcion || null);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Retirar dinero del bolsillo (egreso) =====
router.post('/:id/egreso', auth, (req, res) => {
  const { monto, descripcion } = req.body;
  if (!monto || parseFloat(monto) <= 0) {
    return res.status(400).json({ error: 'Monto debe ser mayor a 0' });
  }
  try {
    const bolsillo = Bolsillo.findById(req.params.id, req.session.user.id);
    if (!bolsillo) return res.status(404).json({ error: 'Bolsillo no encontrado' });

    const montoNum = parseFloat(monto);
    // Verificar que haya saldo suficiente
    if (bolsillo.saldo < montoNum) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }
    // Actualizar saldo (restar)
    Bolsillo.updateSaldo(req.params.id, req.session.user.id, -montoNum);
    // Registrar movimiento
    Movimiento.create(req.params.id, 'egreso', montoNum, descripcion || null);
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

// ===== Actualizar orden (drag & drop) =====
router.put('/orden', auth, (req, res) => {
  const { ordenes } = req.body; // array de objetos { id, orden }
  if (!ordenes || !Array.isArray(ordenes)) {
    return res.status(400).json({ error: 'Ordenes inválidas' });
  }
  try {
    const usuario_id = req.session.user.id;
    // Actualizar cada bolsillo
    ordenes.forEach(item => {
      Bolsillo.updateOrden(item.id, usuario_id, item.orden);
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Vista detalle de un bolsillo =====
router.get('/:id', auth, (req, res) => {
  const bolsillo = Bolsillo.findById(req.params.id, req.session.user.id);
  if (!bolsillo) return res.status(404).send('Bolsillo no encontrado');
  const movimientos = Movimiento.findAllByBolsillo(bolsillo.id);
  res.render('bolsillos/detalle', {
    title: bolsillo.nombre,
    bolsillo,
    movimientos,
    active: 'bolsillos'
  });
});

module.exports = router;
