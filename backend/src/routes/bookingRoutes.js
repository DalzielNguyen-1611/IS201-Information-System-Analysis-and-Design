const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, bookingController.getBookings);
router.post('/', verifyToken, bookingController.createBooking);
router.put('/:id', verifyToken, bookingController.updateBooking);
router.delete('/:id', verifyToken, bookingController.cancelBooking);
router.get('/services', verifyToken, bookingController.getServices);
router.get('/customer-pets/:customerId', verifyToken, bookingController.getPetsByCustomer);

module.exports = router;
