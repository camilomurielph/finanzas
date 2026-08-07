const router = require('express').Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Login
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/login', { title: 'Iniciar sesión', error: null });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = User.findByEmail(email);
  if (!user) {
    return res.render('auth/login', { title: 'Iniciar sesión', error: 'Usuario no encontrado' });
  }
  const match = bcrypt.compareSync(password, user.password);
  if (!match) {
    return res.render('auth/login', { title: 'Iniciar sesión', error: 'Contraseña incorrecta' });
  }
  req.session.user = { id: user.id, email: user.email };
  res.redirect('/'); // ← REDIRECCIÓN AL DASHBOARD
});

// Registro
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/register', { title: 'Registrarse', error: null });
});

router.post('/register', (req, res) => {
  const { email, password, confirm } = req.body;
  if (password !== confirm) {
    return res.render('auth/register', { title: 'Registrarse', error: 'Las contraseñas no coinciden' });
  }
  if (User.findByEmail(email)) {
    return res.render('auth/register', { title: 'Registrarse', error: 'El email ya está registrado' });
  }
  const hash = bcrypt.hashSync(password, 10);
  User.create(email, hash);
  res.redirect('/login');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;
