const mongoose = require('mongoose');
const Item = require('../models/Item');

const getStatusLabel = (state) => {
  switch (state) {
    case 0:
      return { text: 'Disconnected', color: 'danger', ready: false };
    case 1:
      return { text: 'Connected', color: 'success', ready: true };
    case 2:
      return { text: 'Connecting', color: 'warning', ready: false };
    case 3:
      return { text: 'Disconnecting', color: 'warning', ready: false };
    default:
      return { text: 'Unknown', color: 'secondary', ready: false };
  }
};

exports.getHome = async (req, res, next) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = getStatusLabel(dbState);

    let items = [];
    let stats = { total: 0, pending: 0, inProgress: 0, completed: 0 };

    if (dbState === 1) {
      items = await Item.find().sort({ createdAt: -1 }).limit(10);
      const [total, pending, inProgress, completed] = await Promise.all([
        Item.countDocuments(),
        Item.countDocuments({ status: 'Pending' }),
        Item.countDocuments({ status: 'In Progress' }),
        Item.countDocuments({ status: 'Completed' })
      ]);
      stats = { total, pending, inProgress, completed };
    }

    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptimeSeconds: Math.floor(process.uptime()),
      port: process.env.PORT || 3000,
      env: process.env.NODE_ENV || 'development'
    };

    res.render('index', {
      title: 'Web_ass_2 | Full-Stack Dashboard',
      activePage: 'home',
      dbStatus,
      stats,
      items,
      systemInfo,
      message: req.query.msg || null,
      error: req.query.err || null
    });
  } catch (error) {
    next(error);
  }
};

exports.getAbout = (req, res) => {
  res.render('about', {
    title: 'About | Project Architecture',
    activePage: 'about'
  });
};

exports.getHealth = (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: dbState === 1 ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: dbState === 1,
      state: dbState,
      name: mongoose.connection.name || 'web_ass_2'
    },
    system: {
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    }
  });
};
