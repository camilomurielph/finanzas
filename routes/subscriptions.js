const router = require('express').Router();
const Subscription = require('../models/Subscription');

// Middleware de autenticación
function auth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// ===== Página principal de suscripciones =====
router.get('/', auth, (req, res) => {
  const suscripciones = Subscription.findAllByUser(req.session.user.id);
  const totalMensual = Subscription.getTotalMensual(req.session.user.id);
  res.render('subscriptions/index', {
    title: 'Suscripciones',
    suscripciones,
    totalMensual,
    active: 'suscripciones'
  });
});

// ===== API: Obtener una suscripción para editar =====
router.get('/api/:id', auth, (req, res) => {
  const subscription = Subscription.findById(req.params.id, req.session.user.id);
  if (!subscription) return res.status(404).json({ error: 'No encontrado' });
  res.json(subscription);
});

// ===== Crear nueva suscripción =====
router.post('/agregar', auth, (req, res) => {
  const { nombre, valor, dia_pago, frecuencia, mes_pago } = req.body;
  const freq = frecuencia === 'anual' ? 'anual' : 'mensual';
  const mesNum = freq === 'anual' ? parseInt(mes_pago) : null;

  if (!nombre || !valor || !dia_pago) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  if (freq === 'anual' && (!mesNum || mesNum < 1 || mesNum > 12)) {
    return res.status(400).json({ error: 'Debes seleccionar el mes de pago para una suscripción anual' });
  }

  try {
    const id = Subscription.create(
      req.session.user.id,
      nombre,
      parseFloat(valor),
      parseInt(dia_pago),
      freq,
      mesNum
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Editar suscripción =====
router.put('/editar/:id', auth, (req, res) => {
  const { nombre, valor, dia_pago, frecuencia, mes_pago } = req.body;
  const freq = frecuencia === 'anual' ? 'anual' : 'mensual';
  const mesNum = freq === 'anual' ? parseInt(mes_pago) : null;

  if (freq === 'anual' && (!mesNum || mesNum < 1 || mesNum > 12)) {
    return res.status(400).json({ error: 'Debes seleccionar el mes de pago para una suscripción anual' });
  }

  try {
    Subscription.update(req.params.id, req.session.user.id, {
      nombre,
      valor: parseFloat(valor),
      dia_pago: parseInt(dia_pago),
      frecuencia: freq,
      mes_pago: mesNum
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Borrar suscripción =====
router.delete('/borrar/:id', auth, (req, res) => {
  try {
    Subscription.delete(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
