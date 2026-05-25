const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', inventoryController.getInventory);
router.get('/checks', inventoryController.getInventoryChecks);
router.post('/import', verifyToken, inventoryController.importStock);
router.post('/check', verifyToken, inventoryController.createInventoryCheck);
router.get('/imports', inventoryController.getImportHistory);
router.get('/imports/:id', inventoryController.getImportDetail);
router.get('/suppliers', inventoryController.getSuppliers);
router.get('/suppliers/detailed', verifyToken, inventoryController.getSuppliersDetailed);
router.post('/suppliers', verifyToken, inventoryController.createSupplier);
router.put('/suppliers/:id', verifyToken, inventoryController.updateSupplier);
router.put('/suppliers/:id/status', verifyToken, inventoryController.toggleSupplierStatus);
router.delete('/imports/:id', verifyToken, inventoryController.deleteImport);
router.put('/imports/:id/approve', verifyToken, inventoryController.approveImport);
router.put('/imports/:id/receive', verifyToken, inventoryController.receiveImport);
router.put('/imports/:id/pay', verifyToken, inventoryController.payImport);

module.exports = router;
