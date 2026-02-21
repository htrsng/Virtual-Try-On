#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/admin';

// Màu cho console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    cmd: (msg) => console.log(`${colors.cyan}> ${msg}${colors.reset}`)
};

async function checkSync() {
    try {
        log.info('Checking sync status...');
        const res = await axios.get(`${API_URL}/sync-status`);
        console.log('\n📊 Sync Status:');
        console.table(res.data.data);

        if (res.data.data.isSynced) {
            log.success('Dữ liệu đã được đồng bộ!');
        } else {
            log.warn('Dữ liệu chưa được đồng bộ!');
        }
    } catch (error) {
        log.error(`Failed to check sync: ${error.message}`);
    }
}

async function getAllData() {
    try {
        log.info('Fetching all data...');
        const res = await axios.get(`${API_URL}/get-all-data`);
        console.log('\n📦 Data Summary:');
        console.table({
            'Orders': res.data.data.orders,
            'Users': res.data.data.users,
            'Products': res.data.data.products.length
        });

        if (res.data.data.products.length > 0) {
            console.log('\n🛍️  Top Products:');
            const topProducts = res.data.data.products
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, 5);
            console.table(topProducts.map(p => ({
                'Product': p.name,
                'Sold': p.quantity,
                'Revenue': new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(p.totalRevenue)
            })));
        }
        log.success('Data fetched successfully!');
    } catch (error) {
        log.error(`Failed to fetch data: ${error.message}`);
    }
}

async function clearAllData() {
    try {
        log.warn('⚠️  THIS WILL DELETE ALL DATA!');

        const res = await axios.post(`${API_URL}/clear-all-data`, {
            confirm: 'CLEAR_ALL_DATA'
        });

        console.log('\n🗑️  Deleted Data:');
        console.table(res.data.deleted);
        log.success('All data cleared successfully!');
    } catch (error) {
        log.error(`Failed to clear data: ${error.message}`);
    }
}

async function resetData() {
    try {
        log.info('Resetting data to initial state...');
        const res = await axios.post(`${API_URL}/reset-data`, {});

        console.log('\n🔄 Reset Complete!');
        console.log(`📧 Test User: ${res.data.data.testUser}`);
        console.log(`🔐 Admin User: ${res.data.data.admin}`);
        console.log(`🔑 Passwords: ${res.data.data.password}`);

        log.success('Data reset successfully!');
    } catch (error) {
        log.error(`Failed to reset data: ${error.message}`);
    }
}

async function checkAndFix() {
    try {
        log.info('Checking data sync status...');
        const res = await axios.post(`${API_URL}/check-sync`, {});

        if (!res.data.isSynced) {
            log.warn(res.data.message);
            console.log(`\n💡 Suggestion: ${res.data.suggestion}`);

            console.log('\n🔧 Auto-fixing...');
            console.log('Step 1: Clearing all data...');
            await clearAllData();

            console.log('\nStep 2: Resetting data...');
            await resetData();

            log.success('Auto-fix completed!');
        } else {
            log.success('Data is already synced!');
        }
    } catch (error) {
        log.error(`Failed to check and fix: ${error.message}`);
    }
}

function showHelp() {
    console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}
${colors.cyan}║         Virtual Try-On Data Sync Manager              ║${colors.reset}
${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}

${colors.green}Usage:${colors.reset}
  node sync-data.js [command]

${colors.green}Commands:${colors.reset}
  status      - Check current sync status
  get         - Fetch all data from database
  clear       - Clear ALL data (⚠️  DANGEROUS!)
  reset       - Reset data to initial state
  check       - Check and auto-fix sync issues
  help        - Show this help message

${colors.green}Examples:${colors.reset}
  ${colors.cmd('node sync-data.js status')}
  ${colors.cmd('node sync-data.js get')}
  ${colors.cmd('node sync-data.js clear')}
  ${colors.cmd('node sync-data.js reset')}
  ${colors.cmd('node sync-data.js check')}

${colors.yellow}⚠️  WARNING:${colors.reset}
  - 'clear' command will DELETE ALL DATA permanently
  - 'reset' command will create test user and admin
  - Use 'check' to auto-fix sync issues
  
${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}
  `);
}

const command = process.argv[2] || 'help';

(async () => {
    console.log(`\n${colors.cyan}🚀 Starting Virtual Try-On Data Sync Manager...${colors.reset}\n`);

    switch (command) {
        case 'status':
            await checkSync();
            break;
        case 'get':
            await getAllData();
            break;
        case 'clear':
            await clearAllData();
            break;
        case 'reset':
            await resetData();
            break;
        case 'check':
            await checkAndFix();
            break;
        case 'help':
        case '-h':
        case '--help':
            showHelp();
            break;
        default:
            log.error(`Unknown command: ${command}`);
            showHelp();
    }

    console.log(`${colors.cyan}\n✨ Done!${colors.reset}\n`);
    process.exit(0);
})().catch(error => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
});
