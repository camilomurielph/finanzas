const router = require('express').Router();
const Simulacro = require('../models/Simulacro');
const GastoSimulacro = require('../models/GastoSimulacro');

// Middleware de autenticación
function auth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// ===== Página principal =====
router.get('/', auth, (req, res) => {
  const simulacro = Simulacro.getActivo(req.session.user.id);
  let gastos = [];
  if (simulacro) {
    gastos = GastoSimulacro.findAllBySimulacro(simulacro.id);
  }
  res.render('salario/index', {
    title: 'Simulador de Salario',
    simulacro,
    gastos,
    active: 'salario'
  });
});

// ===== Iniciar nuevo simulacro =====
router.post('/iniciar', auth, (req, res) => {
  const { salario } = req.body;
  if (!salario || parseFloat(salario) <= 0) {
    return res.status(400).json({ error: 'Ingresa un monto válido' });
  }
  try {
    const id = Simulacro.crear(req.session.user.id, parseFloat(salario));
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Añadir gasto =====
router.post('/gasto', auth, (req, res) => {
  const { nombre, valor } = req.body;
  if (!nombre || !valor || parseFloat(valor) <= 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
  try {
    const simulacro = Simulacro.getActivo(req.session.user.id);
    if (!simulacro) {
      return res.status(400).json({ error: 'No hay simulacro activo' });
    }
    // Verificar que haya saldo suficiente
    if (simulacro.saldo_disponible < parseFloat(valor)) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }
    // Crear gasto
    GastoSimulacro.create(simulacro.id, nombre, parseFloat(valor));
    // Actualizar saldo disponible
    const nuevoSaldo = simulacro.saldo_disponible - parseFloat(valor);
    Simulacro.actualizar(simulacro.id, req.session.user.id, {
      saldo_disponible: nuevoSaldo,
      ahorro: simulacro.ahorro
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Eliminar gasto =====
router.delete('/gasto/:id', auth, (req, res) => {
  try {
    const simulacro = Simulacro.getActivo(req.session.user.id);
    if (!simulacro) {
      return res.status(400).json({ error: 'No hay simulacro activo' });
    }
    // Obtener el gasto para saber su valor
    const gasto = GastoSimulacro.findAllBySimulacro(simulacro.id).find(g => g.id == req.params.id);
    if (!gasto) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }
    // Eliminar gasto
    GastoSimulacro.delete(req.params.id, simulacro.id);
    // Restaurar el valor al saldo disponible
    const nuevoSaldo = simulacro.saldo_disponible + gasto.valor;
    Simulacro.actualizar(simulacro.id, req.session.user.id, {
      saldo_disponible: nuevoSaldo,
      ahorro: simulacro.ahorro
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Ahorrar =====
router.post('/ahorrar', auth, (req, res) => {
  const { tipo, monto } = req.body;
  try {
    const simulacro = Simulacro.getActivo(req.session.user.id);
    if (!simulacro) {
      return res.status(400).json({ error: 'No hay simulacro activo' });
    }
    let montoAhorro = 0;
    const disponible = simulacro.saldo_disponible;

    if (tipo === '1/10') {
      montoAhorro = disponible / 10;
    } else if (tipo === '50/50') {
      montoAhorro = disponible / 2;
    } else if (tipo === 'otro') {
      if (!monto || parseFloat(monto) <= 0) {
        return res.status(400).json({ error: 'Ingresa un monto válido' });
      }
      if (parseFloat(monto) > disponible) {
        return res.status(400).json({ error: 'El monto supera el saldo disponible' });
      }
      montoAhorro = parseFloat(monto);
    } else {
      return res.status(400).json({ error: 'Tipo de ahorro inválido' });
    }

    if (montoAhorro <= 0) {
      return res.status(400).json({ error: 'El monto a ahorrar debe ser mayor a 0' });
    }
    if (montoAhorro > disponible) {
      return res.status(400).json({ error: 'No hay suficiente saldo disponible' });
    }

    // Actualizar disponible y ahorro
    const nuevoSaldo = disponible - montoAhorro;
    const nuevoAhorro = simulacro.ahorro + montoAhorro;
    Simulacro.actualizar(simulacro.id, req.session.user.id, {
      saldo_disponible: nuevoSaldo,
      ahorro: nuevoAhorro
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Reiniciar simulacro =====
router.post('/reiniciar', auth, (req, res) => {
  try {
    Simulacro.desactivar(req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
