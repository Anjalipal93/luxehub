const express = require('express');
const Sale = require('../models/Sale');
const Message = require('../models/Message');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

/* ======================================================
   GET TEAM PERFORMANCE (OWNER SCOPED)
====================================================== */
router.get('/team-performance', auth, async (req, res) => {
  try {
    const ownerId = req.user.ownerId || req.user._id;

    // ✅ ONLY TEAM MEMBERS
    const users = await User.find({
      isActive: true,
      excludeFromLeaderboard: false,
      $or: [
        { ownerId },
        { _id: ownerId } // include admin himself
      ]
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sales = await Sale.find({
      ownerId,
      createdAt: { $gte: thirtyDaysAgo },
      status: 'completed'
    }).populate('soldBy', 'name email');

    const messages = await Message.find({
      ownerId,
      createdAt: { $gte: thirtyDaysAgo }
    }).populate('sentBy', 'name email');

    const performanceData = users.map(user => {
      const userSales = sales.filter(
        s => s.soldBy?._id?.toString() === user._id.toString()
      );

      const userMessages = messages.filter(
        m => m.sentBy?._id?.toString() === user._id.toString()
      );

      const totalSales = userSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const messagesSent = userMessages.length;

      const conversionRate =
        messagesSent > 0
          ? Math.round((userSales.length / messagesSent) * 100)
          : 0;

      return {
        _id: user._id,
        name: user.name,
        sales: totalSales,
        messagesSent,
        conversionRate,
      };
    });

    const leaderboard = [...performanceData].sort((a, b) => b.sales - a.sales);

    res.json({
      leaderboard,
      individualPerformance: performanceData,
      currentUser: {
        id: req.user._id,
        role: req.user.role,
      }
    });

  } catch (error) {
    console.error('Team performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ======================================================
   DELETE FROM LEADERBOARD (ADMIN / OWNER)
====================================================== */
router.delete('/team-performance/leaderboard/:userId', auth, async (req, res) => {
  try {
    const ownerId = req.user.ownerId || req.user._id;

    if (req.user.role !== 'admin' && req.user._id.toString() !== ownerId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await User.findByIdAndUpdate(req.params.userId, {
      excludeFromLeaderboard: true
    });

    res.json({
      success: true,
      message: 'User removed from leaderboard'
    });

  } catch (error) {
    console.error('Delete leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
