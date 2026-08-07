const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./models/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'cambia-este-secreto-en-produccion',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ===== RUTAS =====
app.use('/', require('./routes/dashboard')); // Dashboard como página principal
app.use('/', require('./routes/auth'));      // AUTH EN RAÍZ (para /login, /register, /logout)
app.use('/gastos', require('./routes/gastos'));
app.use('/suscripciones', require('./routes/subscriptions'));
app.use('/bolsillos', require('./routes/bolsillos'));
app.use('/salario', require('./routes/salario'));
app.use('/deudas', require('./routes/deudas'));
app.use('/reporte', require('./routes/reporte'));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
