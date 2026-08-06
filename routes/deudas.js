const router = require('express').Router();
const Deuda = require('../models/Deuda');
const PagoDeuda = require('../models/PagoDeuda');

// Middleware de autenticación
function auth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// ===== Página principal de deudas =====
router.get('/', auth, (req, res) => {
  const deudas = Deuda.findAllByUser(req.session.user.id);
  res.render('deudas/index', {
    title: 'Deudas',
    deudas,
    active: 'deudas'
  });
});

// ===== Obtener una deuda en JSON (para editar) =====
router.get('/api/:id', auth, (req, res) => {
  const deuda = Deuda.findById(req.params.id, req.session.user.id);
  if (!deuda) return res.status(404).json({ error: 'Deuda no encontrada' });
  res.json(deuda);
});

// ===== Crear nueva deuda =====
router.post('/', auth, (req, res) => {
  const { nombre, valor_total, cuota_minima, numero_cuotas, fecha_pago } = req.body;
  if (!nombre || !valor_total || !cuota_minima || !numero_cuotas || !fecha_pago) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  try {
    const id = Deuda.create(
      req.session.user.id,
      nombre,
      parseFloat(valor_total),
      parseFloat(cuota_minima),
      parseInt(numero_cuotas),
      fecha_pago
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Registrar pago mínimo =====
router.post('/:id/pago-minimo', auth, (req, res) => {
  try {
    const deuda = Deuda.findById(req.params.id, req.session.user.id);
    if (!deuda) return res.status(404).json({ error: 'Deuda no encontrada' });
    if (deuda.activa === 0) return res.status(400).json({ error: 'Esta deuda ya está pagada' });

    const monto = deuda.cuota_minima;
    const saldoRestante = deuda.valor_total - deuda.pagado_total;

    if (saldoRestante <= 0) {
      return res.status(400).json({ error: 'La deuda ya está pagada' });
    }

    let montoPagar = monto;
    if (monto > saldoRestante) montoPagar = saldoRestante;

    // Registrar pago
    PagoDeuda.create(deuda.id, montoPagar, 'minimo');
    // Actualizar pagado_total
    Deuda.updatePagadoTotal(deuda.id, req.session.user.id, montoPagar);
    // Actualizar cuota_actual
    const nuevaCuota = deuda.cuota_actual + 1;
    Deuda.updateCuotaActual(deuda.id, req.session.user.id, nuevaCuota);

    // Si ya se pagó todo, marcar como pagada
    if (deuda.pagado_total + montoPagar >= deuda.valor_total) {
      Deuda.marcarPagada(deuda.id, req.session.user.id);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Registrar abono =====
router.post('/:id/abono', auth, (req, res) => {
  const { monto } = req.body;
  if (!monto || parseFloat(monto) <= 0) {
    return res.status(400).json({ error: 'Monto debe ser mayor a 0' });
  }
  try {
    const deuda = Deuda.findById(req.params.id, req.session.user.id);
    if (!deuda) return res.status(404).json({ error: 'Deuda no encontrada' });
    if (deuda.activa === 0) return res.status(400).json({ error: 'Esta deuda ya está pagada' });

    const montoNum = parseFloat(monto);
    const saldoRestante = deuda.valor_total - deuda.pagado_total;

    if (montoNum > saldoRestante) {
      return res.status(400).json({ error: 'El abono supera el saldo restante' });
    }

    // Registrar pago
    PagoDeuda.create(deuda.id, montoNum, 'abono');
    // Actualizar pagado_total
    Deuda.updatePagadoTotal(deuda.id, req.session.user.id, montoNum);

    // Si ya se pagó todo, marcar como pagada
    if (deuda.pagado_total + montoNum >= deuda.valor_total) {
      Deuda.marcarPagada(deuda.id, req.session.user.id);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Eliminar deuda =====
router.delete('/:id', auth, (req, res) => {
  try {
    Deuda.delete(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Vista detalle de una deuda =====
router.get('/:id', auth, (req, res) => {
  const deuda = Deuda.findById(req.params.id, req.session.user.id);
  if (!deuda) return res.status(404).send('Deuda no encontrada');
  const pagos = PagoDeuda.findAllByDeuda(deuda.id);
  res.render('deudas/detalle', {
    title: deuda.nombre,
    deuda,
    pagos,
    active: 'deudas'
  });
});

module.exports = router;
