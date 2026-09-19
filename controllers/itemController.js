const Item = require('../models/Item');

// Get all items or filter by category
exports.getItems = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search && search.trim() !== '') {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    const items = await Item.find(filter).sort({ createdAt: -1 });

    // Respond with JSON if requested via API, else redirect/render
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, count: items.length, data: items });
    }

    res.redirect('/');
  } catch (error) {
    next(error);
  }
};

// Create a new Item
exports.createItem = async (req, res, next) => {
  try {
    const { title, description, category, priority, status } = req.body;

    if (!title || title.trim() === '') {
      return res.redirect('/?err=' + encodeURIComponent('Item title is required.'));
    }

    const newItem = await Item.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category || 'General',
      priority: priority || 'Medium',
      status: status || 'Pending'
    });

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(201).json({ success: true, data: newItem });
    }

    res.redirect('/?msg=' + encodeURIComponent(`Item "${newItem.title}" created successfully!`));
  } catch (error) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.redirect('/?err=' + encodeURIComponent(error.message));
  }
};

// Update an Item
exports.updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority, status } = req.body;

    const updated = await Item.findByIdAndUpdate(
      id,
      {
        title: title?.trim(),
        description: description?.trim(),
        category,
        priority,
        status
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }
      return res.redirect('/?err=' + encodeURIComponent('Item not found'));
    }

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, data: updated });
    }

    res.redirect('/?msg=' + encodeURIComponent(`Item "${updated.title}" updated successfully!`));
  } catch (error) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.redirect('/?err=' + encodeURIComponent(error.message));
  }
};

// Delete an Item
exports.deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Item.findByIdAndDelete(id);

    if (!deleted) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }
      return res.redirect('/?err=' + encodeURIComponent('Item not found'));
    }

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, message: 'Item deleted successfully' });
    }

    res.redirect('/?msg=' + encodeURIComponent('Item removed successfully.'));
  } catch (error) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.redirect('/?err=' + encodeURIComponent(error.message));
  }
};

// Toggle or cycle item status (Pending -> In Progress -> Completed -> Pending)
exports.toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);

    if (!item) {
      return res.redirect('/?err=' + encodeURIComponent('Item not found'));
    }

    const nextStatus = {
      'Pending': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'Pending'
    };

    item.status = nextStatus[item.status] || 'Pending';
    await item.save();

    res.redirect('/?msg=' + encodeURIComponent(`Status updated to "${item.status}"`));
  } catch (error) {
    next(error);
  }
};
