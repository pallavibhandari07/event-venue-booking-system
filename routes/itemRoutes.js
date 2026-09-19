const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// GET all items (filter/search)
router.get('/', itemController.getItems);

// POST create item
router.post('/', itemController.createItem);

// PUT update item
router.put('/:id', itemController.updateItem);

// DELETE item
router.delete('/:id', itemController.deleteItem);

// PATCH / POST toggle status
router.post('/:id/toggle', itemController.toggleStatus);

module.exports = router;
