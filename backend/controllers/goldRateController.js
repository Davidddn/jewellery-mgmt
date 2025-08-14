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
    let finalRates = {};
    let liveApiRates = {}; // To store rates directly from live API
    let dbManualRates = {}; // To store rates directly from DB
    let overallSource = 'live-api'; // Default to live

    // 1. Always attempt to fetch live rates and populate liveApiRates
    try {
        const apiUrl = `${process.env.GOLD_RATE_API_URL}`;
        console.log("Attempting to fetch live gold rates from:", apiUrl); // Added log
        const apiResponse = await axios.get(apiUrl, {
            headers: {
                'x-access-token': process.env.GOLD_RATE_API_KEY
            },
            params: {
                base: 'XAU',
                currencies: 'INR'
            }
        });
        console.log("Live API response data:", apiResponse.data); // Added log

        if (!apiResponse.data || !apiResponse.data.price_gram_24k) {
            throw new Error('Invalid response from gold rate API: Missing expected gold prices.');
        }

        const rate24k = apiResponse.data.price_gram_24k * 10; // Assuming the API returns price per gram
        const rate22k = apiResponse.data.price_gram_22k * 10;
        const rate18k = apiResponse.data.price_gram_18k * 10;

        liveApiRates = {
            '24K': { purity: '24K', rate: parseFloat(rate24k.toFixed(2)), source: 'live-api', timestamp: new Date() },
            '22K': { purity: '22K', rate: parseFloat(rate22k.toFixed(2)), source: 'live-api', timestamp: new Date() },
            '18K': { purity: '18K', rate: parseFloat(rate18k.toFixed(2)), source: 'live-api', timestamp: new Date() }
        };
        finalRates = { ...liveApiRates }; // Start finalRates with live rates

    } catch (err) {
        console.error("Error fetching live gold rates:", err.message);
        console.error("Live API fetch error details:", err.response?.data || err); // Added detailed error log
        // If live API fails, liveApiRates remains empty or partially populated, but we continue
        overallSource = 'manual-fallback'; // Indicate that live API failed
    }

    // 2. Fetch manual rates from DB and populate dbManualRates
    try {
        const manualRatesFromDb = await GoldRate.findAll();
        console.log("Manual rates from DB:", manualRatesFromDb); // Added log
        let manualOverrideApplied = false;

        manualRatesFromDb.forEach(rate => {
            dbManualRates[rate.purity] = { // Store all manual rates from DB
                purity: rate.purity,
                rate: parseFloat(rate.rate),
                timestamp: rate.updatedAt,
                source: 'manual'
            };

            if (isToday(new Date(rate.updatedAt))) { // Use updatedAt for checking if updated today
                finalRates[rate.purity] = {
                    purity: rate.purity,
                    rate: parseFloat(rate.rate),
                    timestamp: rate.updatedAt,
                    source: 'manual'
                };
                manualOverrideApplied = true;
            }
        });

        // If live API failed and there are manual rates in DB, use them as fallback for finalRates
        if (overallSource === 'manual-fallback' && Object.keys(finalRates).length === 0 && Object.keys(dbManualRates).length > 0) {
            finalRates = { ...dbManualRates };
        } else if (manualOverrideApplied) {
            overallSource = 'mixed'; // Indicates some rates are manual, some live
        } else if (overallSource === 'manual-fallback' && Object.keys(finalRates).length > 0) {
            // If live API failed, but we still have some rates (e.g., from partial live fetch or old manual rates)
            // and no manual override today, keep overallSource as manual-fallback
        } else if (Object.keys(finalRates).length === 0 && Object.keys(dbManualRates).length === 0) {
            // If no live rates and no manual rates, then it's a complete failure
            overallSource = 'failed';
        }


    } catch (dbErr) {
        console.error("Error fetching manual gold rates from DB:", dbErr.message);
        // If DB also fails, finalRates might be empty or only contain live rates if API succeeded
    }

    // If after all attempts, finalRates is empty, return an error
    if (Object.keys(finalRates).length === 0) {
        console.error("No gold rates could be retrieved after all attempts."); // Added log
        return res.status(500).json({ success: false, message: 'Failed to retrieve any gold rates.' });
    }

    console.log("Final gold rates response:", { success: true, rates: finalRates, liveApiRates: liveApiRates, manualDbRates: dbManualRates, source: overallSource }); // Added log
    res.json({
        success: true,
        rates: finalRates, // The rates to be displayed
        liveApiRates: liveApiRates, // Rates directly from live API
        manualDbRates: dbManualRates, // Rates directly from DB
        source: overallSource
    });
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

// @desc    Reset all manual gold rates, reverting to live API only
// @route   DELETE /api/gold-rates/reset
// @access  Admin
exports.resetGoldRates = async (req, res) => {
    try {
        await GoldRate.destroy({
            truncate: true // Deletes all rows from the table
        });
        res.json({ success: true, message: 'All manual gold rate overrides have been reset. System will now use live rates.' });
    } catch (err) {
        console.error("Error resetting gold rates:", err.message);
        res.status(500).json({ success: false, message: 'Failed to reset gold rates.' });
    }
};