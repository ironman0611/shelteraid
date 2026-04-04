#!/usr/bin/env node
/**
 * Import HUD Housing Inventory Count (HIC) data and geocode via US Census Bureau.
 *
 * 1. Parses HIC CSV (downloaded from huduser.gov)
 * 2. Extracts ES (Emergency Shelter), TH (Transitional Housing), SH (Safe Haven)
 * 3. Deduplicates by organization+address
 * 4. Batch geocodes addresses via Census Bureau (free, no API key, 10K per batch)
 * 5. Merges with existing curated shelters
 * 6. Outputs final shelters.json
 *
 * Usage: node scripts/importHUD.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const HIC_FILE = '/tmp/hic-2023.csv';
const EXISTING_FILE = path.join(__dirname, '..', 'assets', 'data', 'shelters.json');
const OUTPUT_FILE = EXISTING_FILE;
const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/locations/addressbatch';
const BATCH_SIZE = 1000; // Census supports 10K but smaller batches are more reliable
const BATCH_DELAY_MS = 2000; // Be polite to the API

// Project types we care about
const PROJECT_TYPE_MAP = {
  'ES': ['emergency'],
  'TH': ['transitional'],
  'SH': ['emergency'],
};

function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQ = false;
  for (const c of line) {
    if (c === '"') inQ = !inQ;
    else if (c === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  result.push(cur.trim());
  return result;
}

// ─── Step 1: Parse HIC CSV ──────────────────────────────────────
function parseHIC() {
  console.log('Step 1: Parsing HUD HIC CSV...');
  const raw = fs.readFileSync(HIC_FILE, 'utf-8');
  const lines = raw.split('\n').filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  const col = (name) => headers.indexOf(name);

  const colProjectType = col('Project Type');
  const colOrgName = col('Organization Name');
  const colProjectName = col('Project Name');
  const colAddress = col('address1');
  const colCity = col('city');
  const colState = col('state');
  const colZip = col('zip');
  const colTarget = col('Target Population');
  const colBedType = col('Bed Type');

  // Bed count columns
  const colBedsHHwC = col('Beds HH w/ Children');
  const colBedsHHwoC = col('Beds HH w/o Children');

  const shelters = [];
  const seen = new Set();

  for (let i = 1; i < lines.length; i++) {
    const c = parseCsvLine(lines[i]);
    const pt = c[colProjectType];
    if (!PROJECT_TYPE_MAP[pt]) continue;

    const addr = c[colAddress];
    const city = c[colCity];
    const state = c[colState];
    const zip = c[colZip];

    // Must have an address
    if (!addr || !city || !state) continue;

    // Deduplicate by org+address+city
    const dedupKey = `${(c[colOrgName] || '').toLowerCase()}|${addr.toLowerCase()}|${city.toLowerCase()}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    const bedsWC = parseInt(c[colBedsHHwC]) || 0;
    const bedsWoC = parseInt(c[colBedsHHwoC]) || 0;
    const totalBeds = bedsWC + bedsWoC;

    const target = c[colTarget] || '';
    let eligibility = 'All adults';
    if (target === 'DV') eligibility = 'Domestic violence survivors';
    else if (target === 'VET') eligibility = 'Veterans';
    else if (target === 'YTH') eligibility = 'Youth';
    else if (target === 'FAM') eligibility = 'Families';

    shelters.push({
      id: `hud-${state.toLowerCase()}-${String(shelters.length + 1).padStart(5, '0')}`,
      name: c[colProjectName] || c[colOrgName] || 'Shelter',
      organizationName: c[colOrgName] || c[colProjectName] || 'Unknown',
      type: PROJECT_TYPE_MAP[pt],
      address: {
        street: addr,
        city: city,
        state: state,
        zip: zip || '',
      },
      coordinates: { latitude: 0, longitude: 0 }, // Will be geocoded
      phone: null,
      website: null,
      capacity: {
        totalBeds: totalBeds,
        yearRoundBeds: totalBeds,
        seasonalBeds: 0,
      },
      services: pt === 'ES' ? ['meals', 'showers', 'case management'] : ['case management'],
      hours: pt === 'ES' ? '24/7' : 'Varies',
      eligibility: eligibility,
      status: 'open',
      lastUpdated: '2023-01-24',
      _geocodeAddress: `${addr}, ${city}, ${state} ${zip}`, // temp field for geocoding
    });
  }

  console.log(`  Parsed ${shelters.length} unique shelters (ES/TH/SH with addresses)`);
  return shelters;
}

// ─── Step 2: Batch geocode via Census Bureau ─────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function geocodeBatch(addresses) {
  // addresses: array of {id, address} where address is "street, city, state zip"
  // Census Bureau format: id, street, city, state, zip (CSV)
  const csvLines = addresses.map(a => {
    // Parse "123 Main St, City, ST 12345" into parts
    const parts = a.address.split(',').map(s => s.trim());
    const street = parts[0] || '';
    const city = parts[1] || '';
    const stateZip = (parts[2] || '').split(' ');
    const state = stateZip[0] || '';
    const zip = stateZip[1] || '';
    return `${a.id},${street},${city},${state},${zip}`;
  }).join('\n');

  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="addressFile"; filename="addresses.csv"',
      'Content-Type: text/csv',
      '',
      csvLines,
      `--${boundary}`,
      'Content-Disposition: form-data; name="benchmark"',
      '',
      'Public_AR_Current',
      `--${boundary}--`,
      '',
    ].join('\r\n');

    const options = {
      hostname: 'geocoding.geo.census.gov',
      port: 443,
      path: '/geocoder/locations/addressbatch',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const results = {};
        const lines = data.split('\n').filter(Boolean);
        for (const line of lines) {
          // Response format: "id","input","match","exact/non-exact","formatted","lon,lat",...
          const parts = parseCsvLine(line);
          const id = parts[0];
          const matchType = parts[2];
          if (matchType === 'Match') {
            // Census returns coords as "lon,lat" in column 5
            const coordStr = parts[5] || '';
            const coordParts = coordStr.split(',');
            if (coordParts.length === 2) {
              const lon = parseFloat(coordParts[0]);
              const lat = parseFloat(coordParts[1]);
              if (!isNaN(lon) && !isNaN(lat) && Math.abs(lat) > 1) {
                results[id] = { latitude: lat, longitude: lon };
              }
            }
          }
        }
        resolve(results);
      });
    });

    req.on('error', (e) => {
      console.warn(`  Geocode batch error: ${e.message}`);
      resolve({}); // Don't fail, just return empty
    });

    req.setTimeout(120000, () => {
      req.destroy();
      console.warn('  Geocode batch timeout');
      resolve({});
    });

    req.write(body);
    req.end();
  });
}

async function geocodeAll(shelters) {
  console.log(`\nStep 2: Geocoding ${shelters.length} addresses via Census Bureau...`);
  console.log(`  Batch size: ${BATCH_SIZE}, estimated batches: ${Math.ceil(shelters.length / BATCH_SIZE)}`);

  let geocoded = 0;
  let failed = 0;

  for (let i = 0; i < shelters.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(shelters.length / BATCH_SIZE);
    const batch = shelters.slice(i, i + BATCH_SIZE);

    const addresses = batch.map(s => ({
      id: s.id,
      address: s._geocodeAddress,
    }));

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${addresses.length} addresses)...`);

    const results = await geocodeBatch(addresses);
    const matchCount = Object.keys(results).length;
    geocoded += matchCount;
    failed += addresses.length - matchCount;

    process.stdout.write(` ${matchCount} matched\n`);

    // Apply coordinates
    for (const s of batch) {
      if (results[s.id]) {
        s.coordinates = results[s.id];
      }
    }

    // Rate limit between batches
    if (i + BATCH_SIZE < shelters.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log(`  Geocoded: ${geocoded}, Failed: ${failed}`);
  return shelters;
}

// ─── Step 3: Merge and output ────────────────────────────────────
function mergeAndOutput(hudShelters) {
  console.log('\nStep 3: Merging with existing curated data...');

  // Load existing curated shelters
  let existing = [];
  if (fs.existsSync(EXISTING_FILE)) {
    existing = JSON.parse(fs.readFileSync(EXISTING_FILE, 'utf-8'));
    console.log(`  Existing shelters: ${existing.length}`);
  }

  // Filter HUD shelters to only those that were successfully geocoded
  const geocodedHUD = hudShelters.filter(s =>
    s.coordinates.latitude !== 0 && s.coordinates.longitude !== 0 &&
    Math.abs(s.coordinates.latitude) > 1 && Math.abs(s.coordinates.longitude) > 1
  );
  console.log(`  HUD shelters with coordinates: ${geocodedHUD.length}`);

  // Clean up temp fields
  for (const s of geocodedHUD) {
    delete s._geocodeAddress;
  }

  // Merge: existing curated shelters take priority (better data quality)
  const existingKeys = new Set(
    existing.map(s => `${s.name.toLowerCase()}|${s.address.city.toLowerCase()}`)
  );

  const newFromHUD = geocodedHUD.filter(s => {
    const key = `${s.name.toLowerCase()}|${s.address.city.toLowerCase()}`;
    return !existingKeys.has(key);
  });

  console.log(`  New from HUD (not in curated): ${newFromHUD.length}`);

  const all = [...existing, ...newFromHUD];

  // Sort by state, city, name
  all.sort((a, b) =>
    a.address.state.localeCompare(b.address.state) ||
    a.address.city.localeCompare(b.address.city) ||
    a.name.localeCompare(b.name)
  );

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(all, null, 2));

  // Summary
  const cities = new Set(all.map(s => `${s.address.city}, ${s.address.state}`));
  const states = new Set(all.map(s => s.address.state));

  console.log(`\n=== FINAL RESULTS ===`);
  console.log(`Total shelters: ${all.length}`);
  console.log(`Cities: ${cities.size}`);
  console.log(`States: ${states.size}`);
  console.log(`Output: ${OUTPUT_FILE}`);

  // Top 20 cities
  const byCityState = {};
  for (const s of all) {
    const key = `${s.address.city}, ${s.address.state}`;
    byCityState[key] = (byCityState[key] || 0) + 1;
  }
  console.log('\nTop 20 cities:');
  Object.entries(byCityState)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([city, count]) => console.log(`  ${city}: ${count}`));
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('=== HUD Shelter Import + Census Geocoding ===\n');

  if (!fs.existsSync(HIC_FILE)) {
    console.error(`HIC file not found: ${HIC_FILE}`);
    console.error('Download from: https://www.huduser.gov/portal/sites/default/files/xls/2023-HIC-Counts-by-State.csv');
    process.exit(1);
  }

  const shelters = parseHIC();
  const geocoded = await geocodeAll(shelters);
  mergeAndOutput(geocoded);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
