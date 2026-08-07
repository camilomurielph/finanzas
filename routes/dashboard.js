const router = require('express').Router();
const DashboardHelper = require('../models/DashboardHelper');

function auth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// ===== Dashboard principal =====
router.get('/', auth, (req, res) => {
  const data = DashboardHelper.getResumen(req.session.user.id);
  res.render('dashboard/index', {
    title: 'Dashboard',
    data: data,
    active: 'dashboard'
  });
});

module.exports = router;
