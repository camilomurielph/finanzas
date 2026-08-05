const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./models/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'cambia-este-secreto-en-produccion',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 día
}));

// Middleware para pasar usuario a todas las vistas
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Rutas
app.use('/', require('./routes/auth'));
app.use('/gastos', require('./routes/gastos'));
app.use('/suscripciones', require('./routes/subscriptions'));

// Redirección raíz
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/gastos');
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
