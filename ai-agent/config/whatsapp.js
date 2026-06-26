const { Client, LocalAuth } = require("whatsapp-web.js");
const { execSync } = require("child_process");
const path = require("path");

const puppeteerOpts = {
    headless: true,
    args: [
        "--no-sandbox", 
        "--disable-setuid-sandbox", 
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-site-isolation-trials",
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
    ]
};

if (process.platform === 'win32') {
    puppeteerOpts.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "session", dataPath: path.join(__dirname, "../nexa_sessions") }),
    puppeteer: puppeteerOpts,
    webVersion: '2.3000.1042095497',
    webVersionCache: {
        type: 'local',
        path: path.join(__dirname, '../.wwebjs_cache/')
    }
});

let watchdogInterval = null;
let isRestarting = false;
let isInitializing = false;

const cleanupZombieBrowsers = () => {
    console.log('Cleaning up any orphaned Chrome instances using nexa_sessions...');
    try {
        if (process.platform === 'win32') {
            const cmd = "powershell -Command \"Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'chrome.exe' -and $_.CommandLine -match 'nexa_sessions' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }\"";
            execSync(cmd, { stdio: 'ignore' });
        } else {
            const cmd = "pkill -9 -f \"nexa_sessions\"";
            execSync(cmd, { stdio: 'ignore' });
        }
        console.log('Orphaned Chrome cleanup completed successfully.');
    } catch (err) {
        // Ignored, pkill/powershell returns non-zero when no matching process is running
    }
};

const triggerHardRestart = async () => {
    if (isRestarting) return;
    isRestarting = true;
    console.log('[DEBUG] Watchdog/State recovery: Performing a hard restart of the client...');
    stopWatchdog();
    try {
        await client.destroy();
    } catch (e) {}
    isInitializing = false;
    isRestarting = false;
    startClient();
};

const stopWatchdog = () => {
    if (watchdogInterval) {
        clearInterval(watchdogInterval);
        watchdogInterval = null;
        console.log('[DEBUG] Connection watchdog stopped.');
    }
};

const startWatchdog = () => {
    if (watchdogInterval) clearInterval(watchdogInterval);
    console.log('[DEBUG] Connection watchdog started.');
    watchdogInterval = setInterval(async () => {
        try {
            if (!client || !client.pupPage) return;
            
            // Check current connection state with a 15-second timeout
            const statePromise = client.getState();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('getState timeout')), 15000)
            );
            
            const state = await Promise.race([statePromise, timeoutPromise]);
            console.log(`[DEBUG] Watchdog tick: Connection state is ${state}`);
            
            if (state !== 'CONNECTED') {
                console.log(`[DEBUG] Watchdog detected unstable state (${state}). Attempting resetState...`);
                try {
                    await client.resetState();
                } catch (e) {
                    console.error('[DEBUG] Watchdog resetState failed. Triggering hard restart...', e.message);
                    triggerHardRestart();
                }
            } else {
                // Send keep-alive evaluation to prevent Chrome tab suspension
                await client.pupPage.evaluate(() => {
                    console.log('Keep-alive ping');
                    document.dispatchEvent(new CustomEvent('keep-alive-heartbeat'));
                });
                console.log('[DEBUG] Watchdog keep-alive heartbeat sent successfully.');
            }
        } catch (err) {
            console.error('[DEBUG] Watchdog check failed:', err.message);
            triggerHardRestart();
        }
    }, 5 * 60 * 1000); // Check every 5 minutes
};

const startClient = async () => {
    if (isInitializing) return;
    isInitializing = true;
    
    // Always release any session file locks before initializing
    cleanupZombieBrowsers();
    
    // Set a 2-minute watchdog timeout for initialization
    const initTimeout = setTimeout(async () => {
        console.error('[DEBUG] WhatsApp client initialization timed out (took longer than 2 minutes). Triggering recovery...');
        try {
            await client.destroy();
        } catch (e) {}
        isInitializing = false;
        startClient();
    }, 2 * 60 * 1000);
    
    try {
        console.log('Starting WhatsApp client...');
        await client.initialize();
        clearTimeout(initTimeout);
        isInitializing = false; // Successfully started
    } catch (err) {
        clearTimeout(initTimeout);
        console.error('Initialization failed:', err.message);
        try {
            await client.destroy(); // Must destroy to kill the zombie Chrome before retrying!
        } catch (e) {}
        isInitializing = false;
        setTimeout(startClient, 5000); // Only retry from here
    }
};

// Bind client disconnection/state handlers that are part of the client lifecycle
client.on('change_state', async (state) => {
    console.log(`[DEBUG] Connection state changed: ${state}`);
    if (state === 'CONFLICT' || state === 'UNLAUNCHED' || state === 'TIMEOUT') {
        console.log(`[DEBUG] Connection state dropped to ${state}. Attempting resetState...`);
        try {
            await client.resetState();
        } catch (err) {
            console.error('[DEBUG] resetState failed, triggering hard restart:', err.message);
            triggerHardRestart();
        }
    }
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out or disconnected. Reason:', reason);
    stopWatchdog();
    console.log('Re-initializing client to recover...');
    client.initialize();
});

// Traps unhandled rejections for Puppeteer errors and retries
process.on('unhandledRejection', async (reason, promise) => {
    const msg = reason ? reason.toString() : '';
    
    const isPuppeteerCrash = msg.includes('Target closed') || 
                             msg.includes('detached Frame') || 
                             msg.includes('main frame too early') || 
                             msg.includes('Session closed') || 
                             msg.includes('context was destroyed') || 
                             msg.includes('Execution context was destroyed');
    
    if (isPuppeteerCrash && !isInitializing) {
        console.log('Browser crashed or detached during active session. Attempting to recover...');
        try {
            await client.destroy();
        } catch (e) {}
        setTimeout(startClient, 3000);
    }
});

module.exports = {
    client,
    startClient,
    startWatchdog,
    stopWatchdog,
    cleanupZombieBrowsers,
    triggerHardRestart
};
