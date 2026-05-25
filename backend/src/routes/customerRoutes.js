const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/', customerController.getAllCustomers);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.put('/:id/status', customerController.toggleCustomerStatus);
router.get('/:id/pets', customerController.getPetsByCustomer);
router.post('/:id/pets', customerController.createPet);

module.exports = router;