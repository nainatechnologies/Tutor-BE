/**
 * @file wallet.constants.js
 * @description Frozen constant variables for wallet transactions, statuses, costs, and coin packages.
 * Adheres strictly to code_quality.md (No magic strings).
 */

const TRANSACTION_TYPE = Object.freeze({
    BONUS: 'BONUS',
    PURCHASE: 'PURCHASE',
    SPEND_CONNECTION: 'SPEND_CONNECTION',
    SPEND_LEAD_UNLOCK: 'SPEND_LEAD_UNLOCK',
    REFUND: 'REFUND',
    ADMIN_GRANT: 'ADMIN_GRANT',
});

const WALLET_STATUS = Object.freeze({
    ACTIVE: 'active',
    FROZEN: 'frozen',
});

const COIN_COSTS = Object.freeze({
    PARENT_CONNECTION_COST: 50,
    TUTOR_LEAD_COST: 30,
    DEFAULT_VALIDITY_DAYS: 30,
});

const PARENT_COIN_PACKAGES = Object.freeze([
    {
        id: 'cp_starter',
        name: 'Starter Pack',
        coins: 150,
        bonus: 0,
        price: 299,
        validityDays: 60,
        tutors: 3,
        popular: false,
        label: 'Quick Start',
    },
    {
        id: 'cp_growth',
        name: 'Growth Pack',
        coins: 400,
        bonus: 0,
        price: 699,
        validityDays: 180,
        tutors: 8,
        popular: true,
        label: 'Most Popular · 6 Months',
    },
    {
        id: 'cp_annual',
        name: 'Annual Family Pass',
        coins: 800,
        bonus: 100,
        price: 1299,
        validityDays: 365,
        tutors: 18,
        popular: false,
        label: 'Best Value · 1 Year',
    },
]);

const TUTOR_COIN_PACKAGES = Object.freeze([
    { id: 'plan-3m', name: '3 Month Plan', coins: 270, bonus: 0, price: 1398, validityDays: 90 },
    { id: 'plan-12m', name: '12 Month Plan', coins: 1200, bonus: 0, price: 4800, validityDays: 365 },
]);

module.exports = {
    TRANSACTION_TYPE,
    WALLET_STATUS,
    COIN_COSTS,
    PARENT_COIN_PACKAGES,
    TUTOR_COIN_PACKAGES,
};
