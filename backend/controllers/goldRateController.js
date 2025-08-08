const axios = require('axios');
const { GoldRate } = require('../models');

// Helper function to check if a date is today
const isToday = (someDate) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
           someDate.getMonth() === today.getMonth() &&
           someDate.getFullYear() === today.getFullYear();
};

// @desc    Get all gold rates (from DB override or live API)
// @route   GET /api/gold-rates
// @access  Public
exports.getGoldRates = async (req, res) => {
    try {
        // 1. Check for a manual override from today
        const manualRates = await GoldRate.findAll();
        const ratesObject = {};
        let manualOverrideToday = false;

        if (manualRates.length > 0) {
            manualRates.forEach(rate => {
                ratesObject[rate.purity] = {
                    purity: rate.purity,
                    rate: parseFloat(rate.rate),
                    timestamp: rate.updatedAt,
                    source: 'manual'
                };
            });
            // Check if any manual rate was updated today
            if (Object.values(ratesObject).some(rate => isToday(new Date(rate.timestamp)))) {
                 manualOverrideToday = true;
            }
        }

        if (manualOverrideToday) {
            // If a manual rate was set today, return it
            return res.json({ success: true, rates: ratesObject });
        }

        // 2. If no manual override, fetch from the live API
        const apiUrl = `${process.env.GOLD_RATE_API_URL}?api_key=${process.env.GOLD_RATE_API_KEY}&base=XAU&currencies=INR`;
        const apiResponse = await axios.get(apiUrl);

        if (!apiResponse.data || !apiResponse.data.rates || !apiResponse.data.rates.INR) {
            throw new Error('Invalid response from gold rate API');
        }

        const pricePerOunce = apiResponse.data.rates.INR;
        const pricePerGram = pricePerOunce / 31.1035; // Corrected typo from pricePerOounce
        
        const rate24k = pricePerGram * 10;
        const rate22k = rate24k * (22 / 24);
        const rate18k = rate24k * (18 / 24);

        const liveRates = {
            '24K': { purity: '24K', rate: rate24k.toFixed(2), source: 'live-api', timestamp: new Date() },
            '22K': { purity: '22K', rate: rate22k.toFixed(2), source: 'live-api', timestamp: new Date() },
            '18K': { purity: '18K', rate: rate18k.toFixed(2), source: 'live-api', timestamp: new Date() }
        };

        res.json({ success: true, rates: liveRates });

    } catch (err) {
        console.error("Error fetching gold rates:", err.message);
        // Fallback to last known DB rates if API fails
        try {
            const fallbackRates = await GoldRate.findAll();
            if (fallbackRates.length > 0) {
                const fallbackRatesObject = {};
                fallbackRates.forEach(rate => {
                    fallbackRatesObject[rate.purity] = {
                        purity: rate.purity,
                        rate: parseFloat(rate.rate),
                        timestamp: rate.updatedAt,
                        source: 'manual-fallback'
                    };
                });
                return res.status(200).json({ success: true, rates: fallbackRatesObject, message: 'Live API failed, showing last saved rates.' });
            }
             return res.status(500).json({ success: false, message: 'Failed to fetch live gold rates and no fallback available.' });
        } catch (dbErr) {
             return res.status(500).json({ success: false, message: 'Failed to fetch live gold rates and database fallback failed.' });
        }
    }
};

// @desc    Update gold rates (manual override)
// @route   POST /api/gold-rates
// @access  Admin, Manager
exports.updateGoldRates = async (req, res) => {
    try {
        const { rates } = req.body;
        const userId = req.user.id;

        for (const rateInfo of rates) {
            await GoldRate.upsert({
                purity: rateInfo.purity,
                rate: rateInfo.rate,
                last_updated_by: userId
            });
        }

        const updatedRatesResult = await GoldRate.findAll();
        const ratesObject = {};
        updatedRatesResult.forEach(rate => {
            ratesObject[rate.purity] = {
                purity: rate.purity,
                rate: parseFloat(rate.rate),
                timestamp: rate.updatedAt,
                source: 'manual'
            };
        });

        res.json({ success: true, message: 'Gold rates updated successfully', rates: ratesObject });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
