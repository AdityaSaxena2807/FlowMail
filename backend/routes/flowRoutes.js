const express = require('express');
const {
  createFlow,
  getFlows,
  getFlow,
  updateFlow,
  deleteFlow,
  activateFlow,
  deactivateFlow,
  scheduleEmail
} = require('../controllers/flowController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router
  .route('/')
  .get(getFlows)
  .post(createFlow);

router
  .route('/:id')
  .get(getFlow)
  .put(updateFlow)
  .delete(deleteFlow);

router.post('/:id/activate', activateFlow);
router.post('/:id/deactivate', deactivateFlow);

// Email scheduling route
router.post('/email/schedule', scheduleEmail);

module.exports = router;