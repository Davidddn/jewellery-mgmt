
const db = require('../models');
const InvoiceTemplate = db.InvoiceTemplate;

// Get all templates for user
const getTemplates = async (req, res) => {
  try {
    const templates = await InvoiceTemplate.findAll({ where: { userId: req.user.id } });
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load templates' });
  }
};

// Get one template by name
const getTemplate = async (req, res) => {
  try {
    const { name } = req.params;
    const template = await InvoiceTemplate.findOne({ where: { userId: req.user.id, name } });
    res.json({ template: template ? template.template : null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load template' });
  }
};

// Save or update template
const saveTemplate = async (req, res) => {
  try {
    const { name, template } = req.body;
    await InvoiceTemplate.upsert({ userId: req.user.id, name, template });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save template' });
  }
};

// Delete template
const deleteTemplate = async (req, res) => {
  try {
    const { name } = req.params;
    await InvoiceTemplate.destroy({ where: { userId: req.user.id, name } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

// Reset template to default
const resetTemplate = async (req, res) => {
  try {
    const { name } = req.body;
    const defaultTemplate = [
      { id: '1', type: 'Text', props: { text: 'Invoice Title' } },
      { id: '2', type: 'Text', props: { text: '{customerName}' } },
      { id: '3', type: 'Text', props: { text: '{invoiceDate}' } },
      { id: '4', type: 'Image', props: { src: '/logo.jpg' } },
    ];
    await InvoiceTemplate.upsert({ userId: req.user.id, name, template: defaultTemplate });
    res.json({ success: true, template: defaultTemplate });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset template' });
  }
};

module.exports = { getTemplates, getTemplate, saveTemplate, deleteTemplate, resetTemplate };
