const twilio = require('twilio');
const logger = require('../utils/logger');

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  async sendSMS(to, message) {
    try {
      if (!this.client || !this.fromNumber) {
        logger.warn('SMS service not configured, using mock SMS');
        return this.mockSMS(to, message);
      }

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to
      });

      logger.info(`SMS sent to ${to}: ${result.sid}`);
      return result;
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw new Error('Failed to send SMS');
    }
  }

  async mockSMS(to, message) {
    logger.info(`Mock SMS to ${to}: ${message}`);
    return {
      sid: 'mock_sms_id',
      status: 'delivered',
      to: to,
      body: message
    };
  }

  async sendOrderConfirmation(customerPhone, orderDetails) {
    const message = `Thank you for your purchase! Order #${orderDetails.invoice_id} for ₹${orderDetails.total_amount} has been confirmed. Track your order at our store.`;
    return this.sendSMS(customerPhone, message);
  }

  async sendPaymentReminder(customerPhone, customerName, amount, dueDate) {
    const message = `Dear ${customerName}, your EMI payment of ₹${amount} is due on ${dueDate}. Please visit our store to make the payment.`;
    return this.sendSMS(customerPhone, message);
  }

  async sendLowStockAlert(adminPhone, productName, currentStock) {
    const message = `Low stock alert: ${productName} has only ${currentStock} units remaining. Please restock soon.`;
    return this.sendSMS(adminPhone, message);
  }

  async sendDiscountNotification(customerPhone, customerName, discountPercent, validUntil) {
    const message = `Dear ${customerName}, you have a ${discountPercent}% discount on your next purchase! Valid until ${validUntil}. Visit our store today!`;
    return this.sendSMS(customerPhone, message);
  }

  async sendLoyaltyPointsUpdate(customerPhone, customerName, points, totalPoints) {
    const message = `Dear ${customerName}, you earned ${points} loyalty points! Your total points: ${totalPoints}. Redeem them on your next purchase.`;
    return this.sendSMS(customerPhone, message);
  }

  async sendNewArrivalNotification(customerPhone, customerName, productName) {
    const message = `Dear ${customerName}, new arrival: ${productName}! Visit our store to see the latest collection.`;
    return this.sendSMS(customerPhone, message);
  }
}

module.exports = new SMSService(); 