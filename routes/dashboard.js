const express = require('express');
const { db } = require('../models/db');
const router = express.Router();

const MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

router.get('/', (req, res) => {
  const uid = req.session.userId;
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Total gastos del mes actual
  const gastosMes = db.prepare(`
    SELECT COALESCE(SUM(monto), 0) as total FROM gastos 
    WHERE usuario_id = ? AND strftime('%Y-%m', fecha) = ?
  `).get(uid, yearMonth).total;

  // Gastos por categoría (mes actual)
  const gastosPorCategoria = db.prepare(`
    SELECT COALESCE(c.nombre, 'Sin categoría') as nombre, 
           COALESCE(c.color, '#8b5cf6') as color, 
           COALESCE(SUM(g.monto), 0) as total
    FROM gastos g
    LEFT JOIN categorias c ON g.categoria_id = c.id
    WHERE g.usuario_id = ? AND strftime('%Y-%m', g.fecha) = ?
    GROUP BY g.categoria_id
    ORDER BY total DESC
  `).all(uid, yearMonth);

  // Últimos 5 gastos
  const ultimosGastos = db.prepare(`
    SELECT g.*, c.nombre as categoria_nombre, c.color as categoria_color
    FROM gastos g
    LEFT JOIN categorias c ON g.categoria_id = c.id
    WHERE g.usuario_id = ?
    ORDER BY g.fecha DESC, g.id DESC
    LIMIT 5
  `).all(uid);

  // Suscripciones activas (mensuales + prorrateo de anuales)
  const suscripciones = db.prepare(`
    SELECT * FROM suscripciones WHERE usuario_id = ? AND activa = 1 ORDER BY dia_cobro ASC
  `).all(uid);
  const totalSuscripciones = suscripciones.reduce((acc, s) => {
    return acc + (s.frecuencia === 'anual' ? s.monto / 12 : s.monto);
  }, 0);

  // Bolsillos
  const bolsillos = db.prepare(`
    SELECT * FROM bolsillos WHERE usuario_id = ? ORDER BY saldo DESC
  `).all(uid);
  const totalBolsillos = bolsillos.reduce((acc, b) => acc + b.saldo, 0);

  // Deudas activas
  const deudas = db.prepare(`
    SELECT * FROM deudas WHERE usuario_id = ? AND estado = 'activa' ORDER BY fecha_limite ASC
  `).all(uid);
  const totalDeudas = deudas.reduce((acc, d) => acc + (d.monto_total - d.monto_pagado), 0);

  // Salario
  const salarioConfig = db.prepare('SELECT * FROM salario_config WHERE usuario_id = ?').get(uid);
  const salarioDistribuciones = db.prepare('SELECT * FROM salario_distribuciones WHERE usuario_id = ?').all(uid);

  res.render('dashboard', {
    title: 'Dashboard',
    active: 'dashboard',
    gastosMes,
    gastosPorCategoria,
    ultimosGastos,
    suscripciones,
    totalSuscripciones,
    bolsillos,
    totalBolsillos,
    deudas,
    totalDeudas,
    salarioConfig: salarioConfig || { salario_mensual: 0 },
    salarioDistribuciones,
    meses: MESES
  });
});

module.exports = router;
