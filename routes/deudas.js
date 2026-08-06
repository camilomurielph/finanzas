const router = require('express').Router();
const Deuda = require('../models/Deuda');
const PagoDeuda = require('../models/PagoDeuda');

function auth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// ===== Página principal =====
router.get('/', auth, (req, res) => {
  const deudas = Deuda.findActiveByUser(req.session.user.id);
  const archivadas = Deuda.findArchivedByUser(req.session.user.id);
  res.render('deudas/index', {
    title: 'Deudas',
    deudas,
    archivadas,
    active: 'deudas'
  });
});

// ===== Obtener una deuda en JSON =====
router.get('/api/:id', auth, (req, res) => {
  const deuda = Deuda.findById(req.params.id, req.session.user.id);
  if (!deuda) return res.status(404).json({ error: 'Deuda no encontrada' });
  res.json(deuda);
});

// ===== Crear nueva deuda =====
router.post('/', auth, (req, res) => {
  const { nombre, valor_total, cuota_minima, numero_cuotas, dia_pago } = req.body;
  if (!nombre || !valor_total || !cuota_minima || !numero_cuotas || !dia_pago) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  try {
    const id = Deuda.create(
      req.session.user.id,
      nombre,
      parseFloat(valor_total),
      parseFloat(cuota_minima),
      parseInt(numero_cuotas),
      parseInt(dia_pago)
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
    if (deuda.archivada === 1) return res.status(400).json({ error: 'Esta deuda está archivada' });

    const monto = deuda.cuota_minima;
    const saldoRestante = deuda.valor_total - deuda.pagado_total;

    if (saldoRestante <= 0) {
      return res.status(400).json({ error: 'La deuda ya está pagada' });
    }

    let montoPagar = monto;
    if (monto > saldoRestante) montoPagar = saldoRestante;

    PagoDeuda.create(deuda.id, montoPagar, 'minimo');
    Deuda.updatePagadoTotal(deuda.id, req.session.user.id, montoPagar);
    
    const nuevaCuota = deuda.cuota_actual + 1;
    Deuda.updateCuotaActual(deuda.id, req.session.user.id, nuevaCuota);

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
    if (deuda.archivada === 1) return res.status(400).json({ error: 'Esta deuda está archivada' });

    const montoNum = parseFloat(monto);
    const saldoRestante = deuda.valor_total - deuda.pagado_total;

    if (montoNum > saldoRestante) {
      return res.status(400).json({ error: 'El abono supera el saldo restante' });
    }

    PagoDeuda.create(deuda.id, montoNum, 'abono');
    Deuda.updatePagadoTotal(deuda.id, req.session.user.id, montoNum);

    if (deuda.pagado_total + montoNum >= deuda.valor_total) {
      Deuda.marcarPagada(deuda.id, req.session.user.id);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ELIMINAR PAGO (nuevo) =====
router.delete('/pago/:id', auth, (req, res) => {
  try {
    // Primero, obtener el pago y verificar que pertenece a una deuda del usuario
    const pago = db.prepare(`
      SELECT p.*, d.usuario_id, d.pagado_total, d.activa
      FROM pagos_deuda p
      JOIN deudas d ON p.deuda_id = d.id
      WHERE p.id = ? AND d.usuario_id = ?
    `).get(req.params.id, req.session.user.id);

    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });

    // Restaurar el monto al pagado_total de la deuda
    Deuda.restarPagadoTotal(pago.deuda_id, req.session.user.id, pago.monto);

    // Si la deuda estaba marcada como pagada, reactivar
    if (pago.activa === 0) {
      // Reactivar y ajustar cuota_actual
      const stmt = db.prepare(`
        UPDATE deudas
        SET activa = 1, archivada = 0
        WHERE id = ? AND usuario_id = ?
      `);
      stmt.run(pago.deuda_id, req.session.user.id);
    }

    // Eliminar el pago
    PagoDeuda.delete(req.params.id, pago.deuda_id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ELIMINAR DEUDA =====
router.delete('/:id', auth, (req, res) => {
  try {
    const deuda = Deuda.findById(req.params.id, req.session.user.id);
    if (!deuda) return res.status(404).json({ error: 'Deuda no encontrada' });

    // Eliminar todos los pagos asociados
    PagoDeuda.deleteAllByDeuda(deuda.id);
    // Eliminar la deuda
    Deuda.delete(deuda.id, req.session.user.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ARCHIVAR DEUDA (cuando está pagada) =====
router.put('/:id/archivar', auth, (req, res) => {
  try {
    const deuda = Deuda.findById(req.params.id, req.session.user.id);
    if (!deuda) return res.status(404).json({ error: 'Deuda no encontrada' });
    if (deuda.activa !== 0) {
      return res.status(400).json({ error: 'Solo se pueden archivar deudas pagadas' });
    }
    Deuda.archivar(deuda.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== DESARCHIVAR DEUDA =====
router.put('/:id/desarchivar', auth, (req, res) => {
  try {
    const deuda = Deuda.findById(req.params.id, req.session.user.id);
    if (!deuda) return res.status(404).json({ error: 'Deuda no encontrada' });
    if (deuda.archivada !== 1) {
      return res.status(400).json({ error: 'La deuda no está archivada' });
    }
    Deuda.desarchivar(deuda.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Vista detalle =====
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
