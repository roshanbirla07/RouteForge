const express = require('express');
const { createRoute } = require('../controllers/routeController');

const router = express.Router();

router.post('/', createRoute);

module.exports = router;
