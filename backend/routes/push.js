const express = require('express');
const router = express.Router();
const pushService = require('../services/pushService');

// Get VAPID public key for client
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: pushService.getVapidPublicKey() });
});


// Subscribe to push notifications

// Subscribe to push notifications (SQLite)
router.post('/subscribe', async (req, res) => {
  const subscription = req.body;
  console.log('Received subscription:', JSON.stringify(subscription, null, 2));
  try {
    const exists = await pushService.subscriptionExists(subscription.endpoint);
    if (!exists) {
      await pushService.saveSubscription(subscription);
      res.status(201).json({ message: 'Subscribed' });
    } else {
      res.status(200).json({ message: 'Already subscribed' });
    }
  } catch (err) {
    console.error('Error subscribing to push notifications:', err);
    res.status(500).json({ error: 'Failed to subscribe', details: err.message });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
  const { endpoint } = req.body;
  await pushService.removeSubscription(endpoint);
  res.json({ message: 'Unsubscribed' });
});

// Send a test notification
router.post('/notify', async (req, res) => {
  const { title, body, url } = req.body;
  await pushService.sendNotification({ title, body, url });
  res.json({ message: 'Notification sent' });
});

module.exports = router;
