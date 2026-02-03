#!/usr/bin/env node
/**
 * Auto-registration script for OpenClaw
 * Adds temporal-cognition plugin to openclaw.json on npm install
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const PLUGIN_ID = 'temporal-cognition';
const OPENCLAW_DIR = process.env.OPENCLAW_DIR || path.join(os.homedir(), '.openclaw');
const CONFIG_FILE = path.join(OPENCLAW_DIR, 'openclaw.json');

// Default plugin config
const DEFAULT_CONFIG = {
  enabled: true,
  config: {
    enabled: true,
    timePerception: { enabled: true },
    taskEstimator: { enabled: true, learningRate: 0.1 },
    temporalTranslator: { enabled: true },
    priorityScheduler: { enabled: true },
    cycleManager: {
      enabled: true,
      phases: {
        active: { start: "08:00", end: "18:00" },
        passive: { start: "18:00", end: "22:00" },
        autonomous: { start: "22:00", end: "02:00" },
        consolidation: { start: "02:00", end: "04:00" },
        maintenance: { start: "04:00", end: "08:00" }
      },
      adaptToUserActivity: true
    },
    crossChannelSync: { enabled: true, channels: ["discord", "telegram"] },
    temporalMemory: { enabled: true, decayHalfLifeDays: 7 }
  }
};

function findPackagePath() {
  // Find where this package is installed
  let dir = __dirname;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      if (pkg.name === 'temporal-cognition-openclaw') {
        return dir;
      }
    }
    dir = path.dirname(dir);
  }
  return path.dirname(__dirname);
}

function register() {
  console.log(`[${PLUGIN_ID}] Auto-registering with OpenClaw...`);

  // Check if openclaw.json exists
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log(`[${PLUGIN_ID}] OpenClaw config not found at ${CONFIG_FILE}`);
    console.log(`[${PLUGIN_ID}] Skipping auto-registration. Add manually after OpenClaw setup.`);
    return;
  }

  try {
    // Read existing config
    const configRaw = fs.readFileSync(CONFIG_FILE, 'utf8');
    const config = JSON.parse(configRaw);

    // Ensure plugins section exists
    if (!config.plugins) {
      config.plugins = { enabled: true, entries: {} };
    }
    if (!config.plugins.entries) {
      config.plugins.entries = {};
    }

    // Check if already registered
    if (config.plugins.entries[PLUGIN_ID]) {
      console.log(`[${PLUGIN_ID}] Already registered in openclaw.json`);
      return;
    }

    // Find package installation path
    const pkgPath = findPackagePath();
    
    // Add plugin entry
    config.plugins.entries[PLUGIN_ID] = {
      ...DEFAULT_CONFIG,
      path: pkgPath
    };

    // Write back
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log(`[${PLUGIN_ID}] ✅ Successfully registered!`);
    console.log(`[${PLUGIN_ID}] Run 'openclaw gateway restart' to activate`);

  } catch (err) {
    console.error(`[${PLUGIN_ID}] Registration failed:`, err.message);
    console.log(`[${PLUGIN_ID}] Manual registration may be required.`);
  }
}

// Only run if this is an npm install (not local dev)
if (process.env.npm_lifecycle_event === 'postinstall' || process.argv.includes('--force')) {
  register();
}

module.exports = { register, DEFAULT_CONFIG };
