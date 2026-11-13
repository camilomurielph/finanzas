const express = require('express');
const { db } = require('../models/db');
const router = express.Router();

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

router.get('/', (req, res) => {
  const uid = req.session.userId;
  const suscripciones = db.prepare('SELECT * FROM suscripciones WHERE usuario_id = ? ORDER BY activa DESC, frecuencia ASC, mes_cobro ASC, dia_cobro ASC').all(uid);
  
  const activas = suscripciones.filter(s => s.activa === 1);
  
  // Equivalente mensual: las mensuales suman 100%, las anuales se prorratean entre 12 meses
  const totalMensual = activas.reduce((acc, s) => {
    return acc + (s.frecuencia === 'anual' ? s.monto / 12 : s.monto);
  }, 0);
  
  const totalAnual = activas.reduce((acc, s) => {
    return acc + (s.frecuencia === 'anual' ? s.monto : s.monto * 12);
  }, 0);

  res.render('suscripciones/index', {
    title: 'Suscripciones',
    active: 'suscripciones',
    suscripciones,
    totalMensual,
    totalAnual,
    meses: MESES
  });
});

router.post('/', (req, res) => {
  const uid = req.session.userId;
  const { nombre, monto, dia_cobro, frecuencia, mes_cobro } = req.body;
  const montoNum = parseFloat(monto);
  const diaNum = parseInt(dia_cobro);
  const freq = frecuencia === 'anual' ? 'anual' : 'mensual';
  const mesNum = freq === 'anual' ? parseInt(mes_cobro) : null;

  if (!nombre || isNaN(montoNum) || montoNum <= 0 || isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
    return res.redirect('/suscripciones?error=Datos inválidos');
  }

  if (freq === 'anual' && (isNaN(mesNum) || mesNum < 1 || mesNum > 12)) {
    return res.redirect('/suscripciones?error=Debe seleccionar un mes válido para suscripciones anuales');
  }

  db.prepare('INSERT INTO suscripciones (usuario_id, nombre, monto, dia_cobro, frecuencia, mes_cobro) VALUES (?, ?, ?, ?, ?, ?)').run(
    uid, nombre.trim(), montoNum, diaNum, freq, mesNum
  );
  res.redirect('/suscripciones?success=Suscripción creada');
});

router.post('/:id/edit', (req, res) => {
  const uid = req.session.userId;
  const { nombre, monto, dia_cobro, frecuencia, mes_cobro } = req.body;
  const montoNum = parseFloat(monto);
  const diaNum = parseInt(dia_cobro);
  const freq = frecuencia === 'anual' ? 'anual' : 'mensual';
  const mesNum = freq === 'anual' ? parseInt(mes_cobro) : null;

  if (!nombre || isNaN(montoNum) || montoNum <= 0 || isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
    return res.redirect('/suscripciones?error=Datos inválidos');
  }

  if (freq === 'anual' && (isNaN(mesNum) || mesNum < 1 || mesNum > 12)) {
    return res.redirect('/suscripciones?error=Debe seleccionar un mes válido');
  }

  db.prepare('UPDATE suscripciones SET nombre = ?, monto = ?, dia_cobro = ?, frecuencia = ?, mes_cobro = ? WHERE id = ? AND usuario_id = ?').run(
    nombre.trim(), montoNum, diaNum, freq, mesNum, req.params.id, uid
  );
  res.redirect('/suscripciones?success=Suscripción actualizada');
});

router.post('/:id/toggle', (req, res) => {
  const uid = req.session.userId;
  const sub = db.prepare('SELECT * FROM suscripciones WHERE id = ? AND usuario_id = ?').get(req.params.id, uid);
  if (sub) {
    db.prepare('UPDATE suscripciones SET activa = ? WHERE id = ?').run(sub.activa === 1 ? 0 : 1, sub.id);
  }
  res.redirect('/suscripciones');
});

router.post('/:id/delete', (req, res) => {
  const uid = req.session.userId;
  db.prepare('DELETE FROM suscripciones WHERE id = ? AND usuario_id = ?').run(req.params.id, uid);
  res.redirect('/suscripciones?success=Suscripción eliminada');
});

module.exports = router;
