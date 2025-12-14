const Activity = require('../models/Activity');

/**
 * Log user activity
 * @param {Object} req - Express request object
 * @param {string} action - Action performed (login, logout, create, update, delete, view, send, generate, export)
 * @param {string} resource - Resource affected (user, product, sale, message, notification, report, profile, dashboard)
 * @param {string} description - Description of the activity
 * @param {Object} details - Additional details about the activity
 */
const logActivity = async (req, action, resource, description, details = {}) => {
  try {
    if (!req.user) {
      console.warn('Cannot log activity: No user in request');
      return;
    }

    const activity = new Activity({
      user: req.user._id,
      userName: req.user.name,
      action,
      resource,
      description,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    await activity.save();
    console.log(`Activity logged: ${action} on ${resource} by ${req.user.name}`);
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to avoid breaking the main functionality
  }
};

/**
 * Log authentication activities
 */
const logAuthActivity = async (req, action, description) => {
  await logActivity(req, action, 'user', description, {
    authMethod: 'jwt',
    timestamp: new Date()
  });
};

/**
 * Log product-related activities
 */
const logProductActivity = async (req, action, description, productDetails = {}) => {
  await logActivity(req, action, 'product', description, productDetails);
};

/**
 * Log sales-related activities
 */
const logSaleActivity = async (req, action, description, saleDetails = {}) => {
  await logActivity(req, action, 'sale', description, saleDetails);
};

/**
 * Log communication activities
 */
const logCommunicationActivity = async (req, action, description, messageDetails = {}) => {
  await logActivity(req, action, 'message', description, messageDetails);
};

/**
 * Log report generation activities
 */
const logReportActivity = async (req, action, description, reportDetails = {}) => {
  await logActivity(req, action, 'report', description, reportDetails);
};

module.exports = {
  logActivity,
  logAuthActivity,
  logProductActivity,
  logSaleActivity,
  logCommunicationActivity,
  logReportActivity
};
