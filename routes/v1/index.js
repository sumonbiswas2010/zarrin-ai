const express = require('express');
const router = express.Router();
const appRoute = require('./app.route');
const adminRoute = require('./admin.route');

const defaultRoutes = [
  {
    path: '/',
    route: appRoute,
  },
  {
    path: '/admin',
    route: adminRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
