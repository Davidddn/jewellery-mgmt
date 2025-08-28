// Backend push notification service using web-push
const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const vapidKeysPath = path.join(__dirname, '../data/vapid-keys.json');

// Generate or load VAPID keys
let vapidKeys;
if (fs.existsSync(vapidKeysPath)) {
  vapidKeys = JSON.parse(fs.readFileSync(vapidKeysPath));
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(vapidKeysPath, JSON.stringify(vapidKeys));
}

webpush.setVapidDetails(
  'mailto:admin@jewellery-mgmt.local',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);




// SQLite-based push subscription management
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '../data/jewellery_mgmt.db');
const db = new sqlite3.Database(dbPath);

function saveSubscription(subscription) {
  return new Promise((resolve, reject) => {
    const { endpoint, keys } = subscription;
    db.run(
      `INSERT OR IGNORE INTO push_subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)` ,
      [endpoint, keys.p256dh, keys.auth],
      function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

function removeSubscription(endpoint) {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM push_subscriptions WHERE endpoint = ?`,
      [endpoint],
      function(err) {
        if (err) return reject(err);
        resolve(this.changes);
      }
    );
  });
}

function getAllSubscriptions() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM push_subscriptions`, [], (err, rows) => {
      if (err) return reject(err);
      // Convert DB rows to web-push subscription format
      const subs = rows.map(row => ({
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth }
      }));
      resolve(subs);
    });
  });
}

function subscriptionExists(endpoint) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT 1 FROM push_subscriptions WHERE endpoint = ?`, [endpoint], (err, row) => {
      if (err) return reject(err);
      resolve(!!row);
    });
  });
}

async function sendNotification(payload) {
  const subscriptions = await getAllSubscriptions();
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
    } catch (err) {
      // Remove invalid subscriptions
      if (err.statusCode === 410 || err.statusCode === 404) {
        await removeSubscription(sub.endpoint);
      }
      console.error('Push error:', err.message);
    }
  }
}

module.exports = {
  getVapidPublicKey: () => vapidKeys.publicKey,
  saveSubscription,
  sendNotification,
  removeSubscription,
  subscriptionExists,
};
