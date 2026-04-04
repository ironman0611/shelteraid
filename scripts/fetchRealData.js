#!/usr/bin/env node
/**
 * Fetch real homeless shelter data from public open data portals.
 * No API keys required — all sources are free public datasets.
 *
 * Sources:
 *   - NYC Open Data (Socrata JSON API)
 *   - Washington DC Open Data (GeoJSON)
 *   - LA County Open Data (GeoJSON)
 *   - Hand-curated shelters for other major metros
 *
 * Usage: node scripts/fetchRealData.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'assets', 'data', 'shelters.json');

let idCounter = 0;
function nextId(prefix) {
  idCounter++;
  return `${prefix}-${String(idCounter).padStart(4, '0')}`;
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'ShelterFinder/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ─── NYC Open Data ───────────────────────────────────────────────
async function fetchNYC() {
  console.log('Fetching NYC shelters...');
  try {
    const url = 'https://data.cityofnewyork.us/resource/r7ck-t2gb.json?$limit=500';
    const raw = JSON.parse(await fetch(url));
    return raw
      .filter((r) => r.latitude && r.longitude)
      .map((r) => ({
        id: nextId('nyc'),
        name: r.center_name || r.facility_name || 'NYC Shelter',
        organizationName: r.sponsor || r.center_name || 'NYC DHS',
        type: mapNYCType(r.facility_type || r.center_type || ''),
        address: {
          street: r.address || r.facility_address || '',
          city: 'New York',
          state: 'NY',
          zip: r.postcode || r.zip || '',
        },
        coordinates: {
          latitude: parseFloat(r.latitude),
          longitude: parseFloat(r.longitude),
        },
        phone: cleanPhone(r.phone),
        website: null,
        capacity: {
          totalBeds: parseInt(r.total_capacity) || 0,
          yearRoundBeds: parseInt(r.total_capacity) || 0,
          seasonalBeds: 0,
        },
        services: ['meals', 'case management'],
        hours: '24/7',
        eligibility: r.population || 'All adults',
        status: 'open',
        lastUpdated: new Date().toISOString().split('T')[0],
      }));
  } catch (e) {
    console.warn('  NYC fetch failed:', e.message);
    return [];
  }
}

function mapNYCType(type) {
  const t = type.toLowerCase();
  if (t.includes('emergency') || t.includes('drop-in')) return ['emergency'];
  if (t.includes('transitional') || t.includes('safe haven')) return ['transitional'];
  if (t.includes('food') || t.includes('soup') || t.includes('meal')) return ['food'];
  if (t.includes('medical') || t.includes('health')) return ['medical'];
  return ['emergency'];
}

// ─── DC Open Data ────────────────────────────────────────────────
async function fetchDC() {
  console.log('Fetching DC shelters...');
  try {
    const url = 'https://opendata.dc.gov/datasets/DCGIS::homeless-shelter-locations.geojson';
    const geo = JSON.parse(await fetch(url));
    return geo.features
      .filter((f) => f.geometry && f.geometry.coordinates)
      .map((f) => {
        const p = f.properties;
        const [lng, lat] = f.geometry.coordinates;
        return {
          id: nextId('dc'),
          name: p.NAME || p.FACILITY_NAME || 'DC Shelter',
          organizationName: p.OWNER || p.AGENCY || 'DC Government',
          type: mapDCType(p.TYPE || p.SUBTYPE || ''),
          address: {
            street: p.ADDRESS || p.FULLADDRESS || '',
            city: 'Washington',
            state: 'DC',
            zip: p.ZIPCODE || p.ZIP || '',
          },
          coordinates: { latitude: lat, longitude: lng },
          phone: cleanPhone(p.PHONE),
          website: p.WEB_URL || null,
          capacity: {
            totalBeds: parseInt(p.TOTAL_CAPACITY || p.CAPACITY) || 0,
            yearRoundBeds: parseInt(p.TOTAL_CAPACITY || p.CAPACITY) || 0,
            seasonalBeds: 0,
          },
          services: ['meals', 'showers', 'case management'],
          hours: p.HOURS || '24/7',
          eligibility: p.ELIGIBILITY || 'All adults',
          status: 'open',
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      });
  } catch (e) {
    console.warn('  DC fetch failed:', e.message);
    return [];
  }
}

function mapDCType(type) {
  const t = type.toLowerCase();
  if (t.includes('emergency')) return ['emergency'];
  if (t.includes('transitional')) return ['transitional'];
  if (t.includes('hypothermia') || t.includes('seasonal')) return ['emergency'];
  return ['emergency'];
}

// ─── LA County Open Data ─────────────────────────────────────────
async function fetchLA() {
  console.log('Fetching LA County shelters...');
  try {
    const url = 'https://services5.arcgis.com/RoWLnSd1nXBGA0s0/arcgis/rest/services/Homeless_Shelters_and_Services/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson';
    const geo = JSON.parse(await fetch(url));
    return geo.features
      .filter((f) => f.geometry && f.geometry.coordinates)
      .map((f) => {
        const p = f.properties;
        const [lng, lat] = f.geometry.coordinates;
        return {
          id: nextId('la'),
          name: p.Name || p.name || p.SITE_NAME || 'LA Shelter',
          organizationName: p.Operator || p.operator || p.AGENCY_NAME || 'LA County',
          type: mapLAType(p.Type || p.type || p.SERVICE_TYPE || ''),
          address: {
            street: p.Address || p.address || p.SITE_ADDRESS || '',
            city: p.City || p.city || 'Los Angeles',
            state: 'CA',
            zip: p.Zip || p.zip || p.ZIP_CODE || '',
          },
          coordinates: { latitude: lat, longitude: lng },
          phone: cleanPhone(p.Phone || p.phone || p.PHONE_NUMBER),
          website: p.Website || p.website || p.URL || null,
          capacity: {
            totalBeds: parseInt(p.Capacity || p.capacity || p.TOTAL_BEDS) || 0,
            yearRoundBeds: parseInt(p.Capacity || p.capacity || p.TOTAL_BEDS) || 0,
            seasonalBeds: 0,
          },
          services: parseLAServices(p),
          hours: p.Hours || p.hours || 'Varies',
          eligibility: p.Eligibility || p.eligibility || 'All adults',
          status: 'open',
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      });
  } catch (e) {
    console.warn('  LA fetch failed:', e.message);
    return [];
  }
}

function mapLAType(type) {
  const t = type.toLowerCase();
  if (t.includes('emergency') || t.includes('shelter')) return ['emergency'];
  if (t.includes('transitional')) return ['transitional'];
  if (t.includes('food') || t.includes('meal')) return ['food'];
  if (t.includes('health') || t.includes('medical')) return ['medical'];
  return ['emergency'];
}

function parseLAServices(p) {
  const services = ['case management'];
  const desc = (p.Description || p.description || p.SERVICES || '').toLowerCase();
  if (desc.includes('meal') || desc.includes('food')) services.push('meals');
  if (desc.includes('shower')) services.push('showers');
  if (desc.includes('medical') || desc.includes('health')) services.push('medical');
  if (desc.includes('mental')) services.push('mental health');
  return services;
}

// ─── Hand-curated shelters for other metros ──────────────────────
function getCuratedShelters() {
  console.log('Adding curated shelters...');
  return [
    // New York City
    {
      id: nextId('nyc'), name: 'Bowery Mission', organizationName: 'The Bowery Mission',
      type: ['emergency', 'food'],
      address: { street: '227 Bowery', city: 'New York', state: 'NY', zip: '10002' },
      coordinates: { latitude: 40.7224, longitude: -73.9929 },
      phone: '+12126744800', website: 'https://www.bowery.org',
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'substance abuse', 'job training'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('nyc'), name: 'New York City Rescue Mission', organizationName: 'NYC Rescue Mission',
      type: ['emergency', 'food'],
      address: { street: '90 Lafayette St', city: 'New York', state: 'NY', zip: '10013' },
      coordinates: { latitude: 40.7168, longitude: -74.0002 },
      phone: '+12122264100', website: 'https://www.nycrescue.org',
      capacity: { totalBeds: 90, yearRoundBeds: 90, seasonalBeds: 0 },
      services: ['meals', 'showers', 'chapel', 'case management', 'substance abuse'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('nyc'), name: 'Holy Apostles Soup Kitchen', organizationName: 'Church of the Holy Apostles',
      type: ['food'],
      address: { street: '296 9th Ave', city: 'New York', state: 'NY', zip: '10001' },
      coordinates: { latitude: 40.7465, longitude: -74.0007 },
      phone: '+12129246710', website: 'https://www.holyapostlessoupkitchen.org',
      capacity: { totalBeds: 0, yearRoundBeds: 0, seasonalBeds: 0 },
      services: ['meals', 'referrals', 'social services'],
      hours: 'Mon-Fri 10:30AM - 12:30PM', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('nyc'), name: 'Covenant House New York', organizationName: 'Covenant House International',
      type: ['emergency', 'transitional'],
      address: { street: '460 W 41st St', city: 'New York', state: 'NY', zip: '10036' },
      coordinates: { latitude: 40.7577, longitude: -73.9936 },
      phone: '+12126136300', website: 'https://www.covenanthouse.org',
      capacity: { totalBeds: 80, yearRoundBeds: 80, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'job training', 'mental health', 'education'],
      hours: '24/7', eligibility: 'Youth 16-24', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('nyc'), name: 'BronxWorks Emergency Shelter', organizationName: 'BronxWorks',
      type: ['emergency'],
      address: { street: '60 E Tremont Ave', city: 'New York', state: 'NY', zip: '10453' },
      coordinates: { latitude: 40.8455, longitude: -73.9136 },
      phone: '+17187310028', website: 'https://www.bronxworks.org',
      capacity: { totalBeds: 150, yearRoundBeds: 150, seasonalBeds: 0 },
      services: ['meals', 'case management', 'job training'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('nyc'), name: 'CAMBA Beyond Shelter', organizationName: 'CAMBA Inc',
      type: ['transitional'],
      address: { street: '1720 Church Ave', city: 'New York', state: 'NY', zip: '11226' },
      coordinates: { latitude: 40.6500, longitude: -73.9627 },
      phone: '+17182873600', website: 'https://www.camba.org',
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'case management', 'job training', 'financial literacy', 'childcare'],
      hours: '24/7', eligibility: 'Families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('nyc'), name: 'Goddard Riverside Options Center', organizationName: 'Goddard Riverside',
      type: ['emergency', 'food'],
      address: { street: '593 Columbus Ave', city: 'New York', state: 'NY', zip: '10024' },
      coordinates: { latitude: 40.7890, longitude: -73.9700 },
      phone: '+12128730600', website: 'https://www.goddard.org',
      capacity: { totalBeds: 120, yearRoundBeds: 120, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'mental health'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('nyc'), name: 'Breaking Ground - Times Square', organizationName: 'Breaking Ground',
      type: ['transitional'],
      address: { street: '305 7th Ave', city: 'New York', state: 'NY', zip: '10001' },
      coordinates: { latitude: 40.7471, longitude: -73.9932 },
      phone: '+12129042100', website: 'https://www.breakingground.org',
      capacity: { totalBeds: 652, yearRoundBeds: 652, seasonalBeds: 0 },
      services: ['case management', 'mental health', 'substance abuse', 'job training'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('nyc'), name: 'Volunteers of America - Bronx', organizationName: 'Volunteers of America',
      type: ['emergency'],
      address: { street: '1180 Rev James A Polite Ave', city: 'New York', state: 'NY', zip: '10459' },
      coordinates: { latitude: 40.8261, longitude: -73.8936 },
      phone: '+17186175665', website: 'https://www.voa-gny.org',
      capacity: { totalBeds: 130, yearRoundBeds: 130, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'Families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('nyc'), name: 'Part of the Solution (POTS)', organizationName: 'POTS',
      type: ['food', 'medical'],
      address: { street: '2759 Webster Ave', city: 'New York', state: 'NY', zip: '10458' },
      coordinates: { latitude: 40.8621, longitude: -73.8905 },
      phone: '+17182200020', website: 'https://www.potsbronx.org',
      capacity: { totalBeds: 0, yearRoundBeds: 0, seasonalBeds: 0 },
      services: ['meals', 'medical clinic', 'dental', 'legal services', 'case management'],
      hours: 'Mon-Sat 9AM-5PM', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Los Angeles
    {
      id: nextId('la'), name: 'Union Rescue Mission', organizationName: 'Union Rescue Mission',
      type: ['emergency', 'food', 'medical'],
      address: { street: '545 S San Pedro St', city: 'Los Angeles', state: 'CA', zip: '90013' },
      coordinates: { latitude: 34.0407, longitude: -118.2448 },
      phone: '+12133476060', website: 'https://www.urm.org',
      capacity: { totalBeds: 1500, yearRoundBeds: 1500, seasonalBeds: 0 },
      services: ['meals', 'showers', 'medical clinic', 'dental', 'case management', 'job training', 'substance abuse'],
      hours: '24/7', eligibility: 'All adults and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('la'), name: 'Downtown Women\'s Center', organizationName: 'Downtown Women\'s Center',
      type: ['transitional', 'food'],
      address: { street: '442 S San Pedro St', city: 'Los Angeles', state: 'CA', zip: '90013' },
      coordinates: { latitude: 34.0420, longitude: -118.2440 },
      phone: '+12136800600', website: 'https://www.downtownwomenscenter.org',
      capacity: { totalBeds: 119, yearRoundBeds: 119, seasonalBeds: 0 },
      services: ['meals', 'showers', 'health services', 'job training', 'case management'],
      hours: '24/7', eligibility: 'Women 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('la'), name: 'Los Angeles Mission', organizationName: 'Los Angeles Mission',
      type: ['emergency', 'food'],
      address: { street: '303 E 5th St', city: 'Los Angeles', state: 'CA', zip: '90013' },
      coordinates: { latitude: 34.0443, longitude: -118.2430 },
      phone: '+12136291227', website: 'https://www.losangelesmission.org',
      capacity: { totalBeds: 350, yearRoundBeds: 350, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management', 'job training'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('la'), name: 'Midnight Mission', organizationName: 'The Midnight Mission',
      type: ['emergency', 'food'],
      address: { street: '601 S San Pedro St', city: 'Los Angeles', state: 'CA', zip: '90014' },
      coordinates: { latitude: 34.0397, longitude: -118.2449 },
      phone: '+12136240245', website: 'https://www.midnightmission.org',
      capacity: { totalBeds: 350, yearRoundBeds: 350, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management', 'job training', 'education'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('la'), name: 'Weingart Center', organizationName: 'Weingart Center Association',
      type: ['transitional'],
      address: { street: '566 S San Pedro St', city: 'Los Angeles', state: 'CA', zip: '90013' },
      coordinates: { latitude: 34.0404, longitude: -118.2444 },
      phone: '+12136271300', website: 'https://www.weingart.org',
      capacity: { totalBeds: 600, yearRoundBeds: 600, seasonalBeds: 0 },
      services: ['meals', 'case management', 'job training', 'mental health', 'substance abuse'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('la'), name: 'PATH - People Assisting The Homeless', organizationName: 'PATH',
      type: ['emergency', 'transitional'],
      address: { street: '340 N Madison Ave', city: 'Los Angeles', state: 'CA', zip: '90004' },
      coordinates: { latitude: 34.0767, longitude: -118.2914 },
      phone: '+13236447227', website: 'https://www.epath.org',
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'job training', 'mental health'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('la'), name: 'LA Family Housing', organizationName: 'LA Family Housing',
      type: ['transitional'],
      address: { street: '7843 Lankershim Blvd', city: 'Los Angeles', state: 'CA', zip: '91605' },
      coordinates: { latitude: 34.2033, longitude: -118.3764 },
      phone: '+18189856400', website: 'https://www.lafh.org',
      capacity: { totalBeds: 250, yearRoundBeds: 250, seasonalBeds: 0 },
      services: ['meals', 'case management', 'job training', 'childcare', 'financial literacy'],
      hours: '24/7', eligibility: 'Families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('la'), name: 'The Salvation Army Bell Shelter', organizationName: 'The Salvation Army',
      type: ['emergency', 'food'],
      address: { street: '5600 Rickenbacker Rd', city: 'Los Angeles', state: 'CA', zip: '90040' },
      coordinates: { latitude: 33.9958, longitude: -118.1486 },
      phone: '+13232637131', website: null,
      capacity: { totalBeds: 400, yearRoundBeds: 400, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'substance abuse'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('la'), name: 'Hope of the Valley Rescue Mission', organizationName: 'Hope of the Valley',
      type: ['emergency', 'food'],
      address: { street: '15400 Vanowen St', city: 'Los Angeles', state: 'CA', zip: '91406' },
      coordinates: { latitude: 34.1897, longitude: -118.4698 },
      phone: '+18183925020', website: 'https://www.hopeofthevalley.org',
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'substance abuse'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Chicago
    {
      id: nextId('chi'), name: 'Pacific Garden Mission', organizationName: 'Pacific Garden Mission',
      type: ['emergency', 'food'],
      address: { street: '1458 S Canal St', city: 'Chicago', state: 'IL', zip: '60607' },
      coordinates: { latitude: 41.8625, longitude: -87.6394 },
      phone: '+13124926100', website: 'https://www.pgm.org',
      capacity: { totalBeds: 950, yearRoundBeds: 950, seasonalBeds: 0 },
      services: ['meals', 'showers', 'chapel', 'case management', 'substance abuse'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('chi'), name: "Sarah's Circle", organizationName: "Sarah's Circle",
      type: ['transitional'],
      address: { street: '4838 N Sheridan Rd', city: 'Chicago', state: 'IL', zip: '60640' },
      coordinates: { latitude: 41.9715, longitude: -87.6548 },
      phone: '+17737283344', website: 'https://www.sarahs-circle.org',
      capacity: { totalBeds: 50, yearRoundBeds: 50, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'life skills'],
      hours: '24/7', eligibility: 'Women 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('chi'), name: 'The Salvation Army Freedom Center', organizationName: 'The Salvation Army',
      type: ['emergency', 'food'],
      address: { street: '825 N Christiana Ave', city: 'Chicago', state: 'IL', zip: '60651' },
      coordinates: { latitude: 41.8955, longitude: -87.7123 },
      phone: '+17732782264', website: null,
      capacity: { totalBeds: 300, yearRoundBeds: 300, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('chi'), name: 'A Safe Haven Foundation', organizationName: 'A Safe Haven Foundation',
      type: ['transitional', 'food'],
      address: { street: '2750 W Roosevelt Rd', city: 'Chicago', state: 'IL', zip: '60612' },
      coordinates: { latitude: 41.8665, longitude: -87.6940 },
      phone: '+17737353300', website: 'https://www.asafehaven.org',
      capacity: { totalBeds: 500, yearRoundBeds: 500, seasonalBeds: 0 },
      services: ['meals', 'showers', 'job training', 'substance abuse', 'mental health', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // San Francisco
    {
      id: nextId('sf'), name: "St. Anthony's Dining Room", organizationName: 'St. Anthony Foundation',
      type: ['food', 'medical'],
      address: { street: '150 Golden Gate Ave', city: 'San Francisco', state: 'CA', zip: '94102' },
      coordinates: { latitude: 37.7815, longitude: -122.4132 },
      phone: '+14155922995', website: 'https://www.stanthonysf.org',
      capacity: { totalBeds: 0, yearRoundBeds: 0, seasonalBeds: 0 },
      services: ['meals', 'medical clinic', 'tech lab', 'social work', 'clothing'],
      hours: 'Daily 10AM - 1PM', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('sf'), name: 'Next Door Shelter', organizationName: 'Episcopal Community Services',
      type: ['emergency'],
      address: { street: '1001 Polk St', city: 'San Francisco', state: 'CA', zip: '94109' },
      coordinates: { latitude: 37.7869, longitude: -122.4197 },
      phone: '+14157494200', website: null,
      capacity: { totalBeds: 334, yearRoundBeds: 334, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'mental health'],
      hours: '5PM - 7AM', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('sf'), name: 'Glide Memorial Church', organizationName: 'GLIDE Foundation',
      type: ['food', 'medical'],
      address: { street: '330 Ellis St', city: 'San Francisco', state: 'CA', zip: '94102' },
      coordinates: { latitude: 37.7854, longitude: -122.4117 },
      phone: '+14156746000', website: 'https://www.glide.org',
      capacity: { totalBeds: 0, yearRoundBeds: 0, seasonalBeds: 0 },
      services: ['meals', 'medical clinic', 'crisis intervention', 'case management'],
      hours: 'Daily 8AM - 5PM', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('sf'), name: 'MSC South Shelter', organizationName: 'San Francisco DHS',
      type: ['emergency'],
      address: { street: '525 5th St', city: 'San Francisco', state: 'CA', zip: '94107' },
      coordinates: { latitude: 37.7787, longitude: -122.3983 },
      phone: '+14155579340', website: null,
      capacity: { totalBeds: 340, yearRoundBeds: 340, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Austin
    {
      id: nextId('aus'), name: 'ARCH Shelter', organizationName: 'Front Steps',
      type: ['emergency'],
      address: { street: '500 E 7th St', city: 'Austin', state: 'TX', zip: '78701' },
      coordinates: { latitude: 30.2647, longitude: -97.7351 },
      phone: '+15123054100', website: 'https://www.frontsteps.org',
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'ID recovery'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('aus'), name: 'Salvation Army Shelter', organizationName: 'The Salvation Army',
      type: ['emergency', 'food'],
      address: { street: '501 E 8th St', city: 'Austin', state: 'TX', zip: '78701' },
      coordinates: { latitude: 30.2656, longitude: -97.7345 },
      phone: '+15124762220', website: null,
      capacity: { totalBeds: 180, yearRoundBeds: 180, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('aus'), name: 'Austin Resource Center for the Homeless', organizationName: 'Caritas of Austin',
      type: ['food', 'medical'],
      address: { street: '611 Neches St', city: 'Austin', state: 'TX', zip: '78701' },
      coordinates: { latitude: 30.2670, longitude: -97.7375 },
      phone: '+15124790700', website: 'https://www.caritasofaustin.org',
      capacity: { totalBeds: 0, yearRoundBeds: 0, seasonalBeds: 0 },
      services: ['meals', 'medical clinic', 'dental', 'case management', 'job training'],
      hours: 'Mon-Fri 8AM-5PM', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Houston
    {
      id: nextId('hou'), name: 'Star of Hope Mission', organizationName: 'Star of Hope Mission',
      type: ['emergency', 'food'],
      address: { street: '1811 Ruiz St', city: 'Houston', state: 'TX', zip: '77002' },
      coordinates: { latitude: 29.7578, longitude: -95.3640 },
      phone: '+17132278900', website: 'https://www.sohmission.org',
      capacity: { totalBeds: 800, yearRoundBeds: 800, seasonalBeds: 0 },
      services: ['meals', 'showers', 'chapel', 'case management', 'substance abuse', 'job training'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('hou'), name: 'Star of Hope - Women & Family Center', organizationName: 'Star of Hope Mission',
      type: ['emergency', 'food'],
      address: { street: '419 Dowling St', city: 'Houston', state: 'TX', zip: '77003' },
      coordinates: { latitude: 29.7498, longitude: -95.3528 },
      phone: '+17137481000', website: 'https://www.sohmission.org',
      capacity: { totalBeds: 400, yearRoundBeds: 400, seasonalBeds: 0 },
      services: ['meals', 'showers', 'childcare', 'case management', 'job training'],
      hours: '24/7', eligibility: 'Women and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('hou'), name: 'The Beacon Day Center', organizationName: 'The Beacon',
      type: ['food', 'medical'],
      address: { street: '1212 Prairie St', city: 'Houston', state: 'TX', zip: '77002' },
      coordinates: { latitude: 29.7540, longitude: -95.3612 },
      phone: '+17132206900', website: 'https://www.beaconhomeless.org',
      capacity: { totalBeds: 0, yearRoundBeds: 0, seasonalBeds: 0 },
      services: ['meals', 'showers', 'medical clinic', 'dental', 'ID recovery', 'mail services'],
      hours: 'Mon-Fri 7AM-3PM', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Seattle
    {
      id: nextId('sea'), name: 'Downtown Emergency Service Center', organizationName: 'DESC',
      type: ['emergency', 'medical'],
      address: { street: '517 3rd Ave', city: 'Seattle', state: 'WA', zip: '98104' },
      coordinates: { latitude: 47.6024, longitude: -122.3310 },
      phone: '+12064643120', website: 'https://www.desc.org',
      capacity: { totalBeds: 300, yearRoundBeds: 300, seasonalBeds: 0 },
      services: ['meals', 'mental health', 'substance abuse', 'case management', 'medical clinic'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('sea'), name: 'Union Gospel Mission', organizationName: 'Seattle Union Gospel Mission',
      type: ['emergency', 'food'],
      address: { street: '318 2nd Ave S', city: 'Seattle', state: 'WA', zip: '98104' },
      coordinates: { latitude: 47.5988, longitude: -122.3325 },
      phone: '+12066225450', website: 'https://www.ugm.org',
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'showers', 'chapel', 'case management', 'recovery program'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('sea'), name: 'Mary\'s Place', organizationName: 'Mary\'s Place Seattle',
      type: ['emergency'],
      address: { street: '1830 9th Ave', city: 'Seattle', state: 'WA', zip: '98101' },
      coordinates: { latitude: 47.6158, longitude: -122.3389 },
      phone: '+12062457390', website: 'https://www.marysplaceseattle.org',
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'showers', 'childcare', 'case management', 'job training'],
      hours: '24/7', eligibility: 'Women, children, and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Denver
    {
      id: nextId('den'), name: 'Denver Rescue Mission', organizationName: 'Denver Rescue Mission',
      type: ['emergency', 'food'],
      address: { street: '1130 Park Ave W', city: 'Denver', state: 'CO', zip: '80205' },
      coordinates: { latitude: 39.7516, longitude: -104.9914 },
      phone: '+13032971815', website: 'https://www.denverrescuemission.org',
      capacity: { totalBeds: 600, yearRoundBeds: 600, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'job training', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('den'), name: 'The Gathering Place', organizationName: 'The Gathering Place',
      type: ['food', 'medical'],
      address: { street: '1535 High St', city: 'Denver', state: 'CO', zip: '80218' },
      coordinates: { latitude: 39.7394, longitude: -104.9732 },
      phone: '+13033214198', website: 'https://www.tgpdenver.org',
      capacity: { totalBeds: 0, yearRoundBeds: 0, seasonalBeds: 0 },
      services: ['meals', 'showers', 'childcare', 'medical clinic', 'legal services', 'art therapy'],
      hours: 'Mon-Fri 8:30AM-4:30PM', eligibility: 'Women, transgender, and non-binary adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Atlanta
    {
      id: nextId('atl'), name: 'Atlanta Mission - My Sister\'s House', organizationName: 'Atlanta Mission',
      type: ['emergency', 'food'],
      address: { street: '921 Howell Mill Rd', city: 'Atlanta', state: 'GA', zip: '30318' },
      coordinates: { latitude: 33.7815, longitude: -84.4102 },
      phone: '+14043672493', website: 'https://www.atlantamission.org',
      capacity: { totalBeds: 100, yearRoundBeds: 100, seasonalBeds: 0 },
      services: ['meals', 'showers', 'childcare', 'case management', 'job training'],
      hours: '24/7', eligibility: 'Women and children', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('atl'), name: 'Atlanta Mission - Shepherd\'s Inn', organizationName: 'Atlanta Mission',
      type: ['emergency', 'food'],
      address: { street: '165 Alexander St NW', city: 'Atlanta', state: 'GA', zip: '30313' },
      coordinates: { latitude: 33.7611, longitude: -84.3876 },
      phone: '+14043672493', website: 'https://www.atlantamission.org',
      capacity: { totalBeds: 450, yearRoundBeds: 450, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management', 'job training'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('atl'), name: 'Gateway Center', organizationName: 'Gateway Center Inc',
      type: ['emergency', 'transitional'],
      address: { street: '275 Pryor St SW', city: 'Atlanta', state: 'GA', zip: '30303' },
      coordinates: { latitude: 33.7479, longitude: -84.3907 },
      phone: '+14046597228', website: 'https://www.gatewayctr.org',
      capacity: { totalBeds: 300, yearRoundBeds: 300, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'job training', 'financial literacy'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Boston
    {
      id: nextId('bos'), name: 'Pine Street Inn', organizationName: 'Pine Street Inn',
      type: ['emergency', 'food'],
      address: { street: '444 Harrison Ave', city: 'Boston', state: 'MA', zip: '02118' },
      coordinates: { latitude: 42.3438, longitude: -71.0648 },
      phone: '+16174826400', website: 'https://www.pinestreetinn.org',
      capacity: { totalBeds: 600, yearRoundBeds: 600, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'job training', 'substance abuse'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('bos'), name: 'Boston Rescue Mission', organizationName: 'Boston Rescue Mission',
      type: ['emergency', 'food'],
      address: { street: '39 Kingston St', city: 'Boston', state: 'MA', zip: '02111' },
      coordinates: { latitude: 42.3530, longitude: -71.0597 },
      phone: '+16174820400', website: 'https://www.brm.org',
      capacity: { totalBeds: 120, yearRoundBeds: 120, seasonalBeds: 0 },
      services: ['meals', 'showers', 'chapel', 'case management'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('bos'), name: 'Rosie\'s Place', organizationName: "Rosie's Place",
      type: ['emergency', 'food'],
      address: { street: '889 Harrison Ave', city: 'Boston', state: 'MA', zip: '02118' },
      coordinates: { latitude: 42.3358, longitude: -71.0696 },
      phone: '+16173189200', website: 'https://www.rosiesplace.org',
      capacity: { totalBeds: 40, yearRoundBeds: 40, seasonalBeds: 0 },
      services: ['meals', 'showers', 'legal services', 'case management', 'job training'],
      hours: '24/7', eligibility: 'Women 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Philadelphia
    {
      id: nextId('phl'), name: 'Sunday Breakfast Rescue Mission', organizationName: 'Sunday Breakfast Rescue Mission',
      type: ['emergency', 'food'],
      address: { street: '302 N 13th St', city: 'Philadelphia', state: 'PA', zip: '19107' },
      coordinates: { latitude: 39.9576, longitude: -75.1589 },
      phone: '+12159226400', website: 'https://www.sundaybreakfast.org',
      capacity: { totalBeds: 300, yearRoundBeds: 300, seasonalBeds: 0 },
      services: ['meals', 'showers', 'chapel', 'case management', 'substance abuse'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('phl'), name: 'Bethesda Project - Our Brother\'s Place', organizationName: 'Bethesda Project',
      type: ['emergency'],
      address: { street: '1630 South St', city: 'Philadelphia', state: 'PA', zip: '19146' },
      coordinates: { latitude: 39.9434, longitude: -75.1718 },
      phone: '+12158599001', website: 'https://www.bethesdaproject.org',
      capacity: { totalBeds: 60, yearRoundBeds: 60, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'mental health'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('phl'), name: 'People\'s Emergency Center', organizationName: "People's Emergency Center",
      type: ['emergency', 'transitional'],
      address: { street: '3902 Spring Garden St', city: 'Philadelphia', state: 'PA', zip: '19104' },
      coordinates: { latitude: 39.9608, longitude: -75.1969 },
      phone: '+12153820880', website: 'https://www.pec-cares.org',
      capacity: { totalBeds: 150, yearRoundBeds: 150, seasonalBeds: 0 },
      services: ['meals', 'childcare', 'job training', 'case management', 'financial literacy'],
      hours: '24/7', eligibility: 'Women and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Portland
    {
      id: nextId('pdx'), name: 'Portland Rescue Mission', organizationName: 'Portland Rescue Mission',
      type: ['emergency', 'food'],
      address: { street: '111 W Burnside St', city: 'Portland', state: 'OR', zip: '97209' },
      coordinates: { latitude: 45.5231, longitude: -122.6729 },
      phone: '+15032411611', website: 'https://www.portlandrescuemission.org',
      capacity: { totalBeds: 130, yearRoundBeds: 130, seasonalBeds: 0 },
      services: ['meals', 'showers', 'chapel', 'case management', 'substance abuse'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('pdx'), name: 'Blanchet House', organizationName: 'Blanchet House of Hospitality',
      type: ['emergency', 'food'],
      address: { street: '310 NW Glisan St', city: 'Portland', state: 'OR', zip: '97209' },
      coordinates: { latitude: 45.5267, longitude: -122.6728 },
      phone: '+15032414340', website: 'https://www.blanchethouse.org',
      capacity: { totalBeds: 46, yearRoundBeds: 46, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: 'Meals: Daily 6:30AM, 11:30AM, 5PM', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('pdx'), name: 'Transition Projects', organizationName: 'Transition Projects Inc',
      type: ['transitional'],
      address: { street: '665 NW Hoyt St', city: 'Portland', state: 'OR', zip: '97209' },
      coordinates: { latitude: 45.5271, longitude: -122.6793 },
      phone: '+15032806263', website: 'https://www.tprojects.org',
      capacity: { totalBeds: 130, yearRoundBeds: 130, seasonalBeds: 0 },
      services: ['case management', 'job training', 'mental health', 'substance abuse'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Phoenix
    {
      id: nextId('phx'), name: 'Central Arizona Shelter Services (CASS)', organizationName: 'CASS',
      type: ['emergency'],
      address: { street: '230 S 12th Ave', city: 'Phoenix', state: 'AZ', zip: '85007' },
      coordinates: { latitude: 33.4455, longitude: -112.0828 },
      phone: '+16022564853', website: 'https://www.cassaz.org',
      capacity: { totalBeds: 500, yearRoundBeds: 500, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'job training'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('phx'), name: 'St. Vincent de Paul Dining Room', organizationName: 'Society of St. Vincent de Paul',
      type: ['food', 'medical'],
      address: { street: '420 W Watkins Rd', city: 'Phoenix', state: 'AZ', zip: '85003' },
      coordinates: { latitude: 33.4340, longitude: -112.0812 },
      phone: '+16022615200', website: 'https://www.stvincentdepaul.net',
      capacity: { totalBeds: 0, yearRoundBeds: 0, seasonalBeds: 0 },
      services: ['meals', 'medical clinic', 'dental', 'clothing'],
      hours: 'Daily 9AM - 5PM', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('phx'), name: 'Andre House of Hospitality', organizationName: 'Andre House',
      type: ['food'],
      address: { street: '213 S 11th Ave', city: 'Phoenix', state: 'AZ', zip: '85007' },
      coordinates: { latitude: 33.4472, longitude: -112.0818 },
      phone: '+16602527023', website: 'https://www.andrehouse.org',
      capacity: { totalBeds: 0, yearRoundBeds: 0, seasonalBeds: 0 },
      services: ['meals', 'showers', 'clothing', 'mail services'],
      hours: 'Dinner Daily 5PM-7PM', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Miami
    {
      id: nextId('mia'), name: 'Camillus House', organizationName: 'Camillus House Inc',
      type: ['emergency', 'food', 'medical'],
      address: { street: '1603 NW 7th Ave', city: 'Miami', state: 'FL', zip: '33136' },
      coordinates: { latitude: 25.7904, longitude: -80.2087 },
      phone: '+13053746680', website: 'https://www.camillus.org',
      capacity: { totalBeds: 300, yearRoundBeds: 300, seasonalBeds: 0 },
      services: ['meals', 'showers', 'medical clinic', 'substance abuse', 'case management', 'job training'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('mia'), name: 'Miami Rescue Mission', organizationName: 'Miami Rescue Mission',
      type: ['emergency', 'food'],
      address: { street: '2020 NW 1st Ave', city: 'Miami', state: 'FL', zip: '33127' },
      coordinates: { latitude: 25.7968, longitude: -80.1970 },
      phone: '+13055710778', website: 'https://www.miamirescuemission.com',
      capacity: { totalBeds: 250, yearRoundBeds: 250, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management', 'chapel'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('mia'), name: 'Chapman Partnership - North', organizationName: 'Chapman Partnership',
      type: ['emergency', 'transitional'],
      address: { street: '1550 N Miami Ave', city: 'Miami', state: 'FL', zip: '33136' },
      coordinates: { latitude: 25.7890, longitude: -80.1968 },
      phone: '+13053294070', website: 'https://www.chapmanpartnership.org',
      capacity: { totalBeds: 800, yearRoundBeds: 800, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'job training', 'childcare', 'mental health'],
      hours: '24/7', eligibility: 'All adults and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Dallas
    {
      id: nextId('dal'), name: 'The Bridge Homeless Recovery Center', organizationName: 'Bridge Steps',
      type: ['emergency', 'food'],
      address: { street: '1818 Corsicana St', city: 'Dallas', state: 'TX', zip: '75201' },
      coordinates: { latitude: 32.7792, longitude: -96.7955 },
      phone: '+12146707100', website: 'https://www.bridgesteps.org',
      capacity: { totalBeds: 350, yearRoundBeds: 350, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'job training', 'medical clinic'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('dal'), name: 'Austin Street Center', organizationName: 'Austin Street Center',
      type: ['emergency', 'food'],
      address: { street: '2929 Hickory St', city: 'Dallas', state: 'TX', zip: '75226' },
      coordinates: { latitude: 32.7810, longitude: -96.7740 },
      phone: '+12147487481', website: 'https://www.austinstreet.org',
      capacity: { totalBeds: 250, yearRoundBeds: 250, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('dal'), name: 'OurCalling Day Center', organizationName: 'OurCalling',
      type: ['food', 'medical'],
      address: { street: '1702 S Cesar Chavez Blvd', city: 'Dallas', state: 'TX', zip: '75215' },
      coordinates: { latitude: 32.7620, longitude: -96.7875 },
      phone: '+12146384008', website: 'https://www.ourcalling.org',
      capacity: { totalBeds: 0, yearRoundBeds: 0, seasonalBeds: 0 },
      services: ['meals', 'showers', 'medical clinic', 'case management', 'mail services'],
      hours: 'Daily 8AM-8PM', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // San Diego
    {
      id: nextId('sd'), name: 'Father Joe\'s Villages', organizationName: "Father Joe's Villages",
      type: ['emergency', 'food', 'medical'],
      address: { street: '3350 E St', city: 'San Diego', state: 'CA', zip: '92102' },
      coordinates: { latitude: 32.7146, longitude: -117.1398 },
      phone: '+16192331500', website: 'https://www.my.neighbor.org',
      capacity: { totalBeds: 650, yearRoundBeds: 650, seasonalBeds: 0 },
      services: ['meals', 'showers', 'medical clinic', 'dental', 'case management', 'job training', 'childcare'],
      hours: '24/7', eligibility: 'All adults and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('sd'), name: 'San Diego Rescue Mission', organizationName: 'San Diego Rescue Mission',
      type: ['emergency', 'food'],
      address: { street: '120 Elm St', city: 'San Diego', state: 'CA', zip: '92101' },
      coordinates: { latitude: 32.7189, longitude: -117.1675 },
      phone: '+16196874180', website: 'https://www.sdrescue.org',
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management', 'chapel'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('sd'), name: 'Alpha Project Bridge Shelter', organizationName: 'Alpha Project',
      type: ['emergency'],
      address: { street: '1642 Commercial St', city: 'San Diego', state: 'CA', zip: '92113' },
      coordinates: { latitude: 32.7050, longitude: -117.1340 },
      phone: '+16195422557', website: 'https://www.alphaproject.org',
      capacity: { totalBeds: 324, yearRoundBeds: 324, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Minneapolis
    {
      id: nextId('mpls'), name: 'Mary\'s Place Minneapolis', organizationName: 'Catholic Charities',
      type: ['emergency'],
      address: { street: '401 N 7th St', city: 'Minneapolis', state: 'MN', zip: '55405' },
      coordinates: { latitude: 44.9838, longitude: -93.2863 },
      phone: '+16126641660', website: 'https://www.cctwincities.org',
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'mental health'],
      hours: '24/7', eligibility: 'Women and children', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('mpls'), name: 'Union Gospel Mission Twin Cities', organizationName: 'Union Gospel Mission',
      type: ['emergency', 'food'],
      address: { street: '435 E University Ave', city: 'Saint Paul', state: 'MN', zip: '55101' },
      coordinates: { latitude: 44.9557, longitude: -93.0842 },
      phone: '+16514271580', website: 'https://www.ugmtc.org',
      capacity: { totalBeds: 100, yearRoundBeds: 100, seasonalBeds: 0 },
      services: ['meals', 'showers', 'chapel', 'case management'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('mpls'), name: 'Simpson Housing Services', organizationName: 'Simpson Housing Services',
      type: ['emergency', 'transitional'],
      address: { street: '2740 1st Ave S', city: 'Minneapolis', state: 'MN', zip: '55408' },
      coordinates: { latitude: 44.9603, longitude: -93.2717 },
      phone: '+16128131048', website: 'https://www.simpsonhousing.org',
      capacity: { totalBeds: 60, yearRoundBeds: 60, seasonalBeds: 0 },
      services: ['meals', 'case management', 'mental health'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Nashville
    {
      id: nextId('nas'), name: 'Nashville Rescue Mission', organizationName: 'Nashville Rescue Mission',
      type: ['emergency', 'food'],
      address: { street: '639 Lafayette St', city: 'Nashville', state: 'TN', zip: '37203' },
      coordinates: { latitude: 36.1560, longitude: -86.7776 },
      phone: '+16152559898', website: 'https://www.nashvillerescuemission.org',
      capacity: { totalBeds: 260, yearRoundBeds: 260, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management', 'job training'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('nas'), name: 'Room In The Inn', organizationName: 'Room In The Inn',
      type: ['emergency', 'food'],
      address: { street: '315 Woodland St', city: 'Nashville', state: 'TN', zip: '37206' },
      coordinates: { latitude: 36.1695, longitude: -86.7646 },
      phone: '+16152512310', website: 'https://www.roomintheinn.org',
      capacity: { totalBeds: 180, yearRoundBeds: 100, seasonalBeds: 80 },
      services: ['meals', 'showers', 'case management', 'art program'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Detroit
    {
      id: nextId('det'), name: 'Cass Community Social Services', organizationName: 'Cass Community',
      type: ['emergency', 'food'],
      address: { street: '11850 Woodrow Wilson', city: 'Detroit', state: 'MI', zip: '48206' },
      coordinates: { latitude: 42.3715, longitude: -83.1097 },
      phone: '+13138834600', website: 'https://www.casscommunity.org',
      capacity: { totalBeds: 80, yearRoundBeds: 80, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'job training'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('det'), name: 'Covenant House Michigan', organizationName: 'Covenant House International',
      type: ['emergency', 'transitional'],
      address: { street: '2959 Martin Luther King Jr Blvd', city: 'Detroit', state: 'MI', zip: '48208' },
      coordinates: { latitude: 42.3467, longitude: -83.0961 },
      phone: '+13134632000', website: 'https://www.covenanthousemi.org',
      capacity: { totalBeds: 60, yearRoundBeds: 60, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'education', 'job training'],
      hours: '24/7', eligibility: 'Youth 18-24', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Las Vegas
    {
      id: nextId('lv'), name: 'Catholic Charities of Southern Nevada', organizationName: 'Catholic Charities',
      type: ['emergency', 'food'],
      address: { street: '1501 Las Vegas Blvd N', city: 'Las Vegas', state: 'NV', zip: '89101' },
      coordinates: { latitude: 36.1859, longitude: -115.1362 },
      phone: '+17023870539', website: 'https://www.catholiccharities.com',
      capacity: { totalBeds: 500, yearRoundBeds: 500, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'substance abuse', 'mental health'],
      hours: '24/7', eligibility: 'All adults and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('lv'), name: 'The Shade Tree', organizationName: 'The Shade Tree',
      type: ['emergency'],
      address: { street: '1 W Owens Ave', city: 'Las Vegas', state: 'NV', zip: '89106' },
      coordinates: { latitude: 36.1989, longitude: -115.1515 },
      phone: '+17023850072', website: 'https://www.theshadetree.org',
      capacity: { totalBeds: 360, yearRoundBeds: 360, seasonalBeds: 0 },
      services: ['meals', 'showers', 'childcare', 'case management', 'job training'],
      hours: '24/7', eligibility: 'Women, children, and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Baltimore
    {
      id: nextId('bal'), name: 'Baltimore Rescue Mission', organizationName: 'Baltimore Rescue Mission',
      type: ['emergency', 'food'],
      address: { street: '4 N Central Ave', city: 'Baltimore', state: 'MD', zip: '21202' },
      coordinates: { latitude: 39.2889, longitude: -76.6076 },
      phone: '+14104052003', website: 'https://www.bfrm.org',
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management', 'job training'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('bal'), name: 'Helping Up Mission', organizationName: 'Helping Up Mission',
      type: ['emergency', 'food', 'medical'],
      address: { street: '1029 E Baltimore St', city: 'Baltimore', state: 'MD', zip: '21202' },
      coordinates: { latitude: 39.2884, longitude: -76.5965 },
      phone: '+14106750677', website: 'https://www.helpingupmission.org',
      capacity: { totalBeds: 450, yearRoundBeds: 450, seasonalBeds: 0 },
      services: ['meals', 'showers', 'medical clinic', 'substance abuse', 'case management', 'job training'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('bal'), name: 'My Sister\'s Place Women\'s Center', organizationName: 'Catholic Charities',
      type: ['emergency'],
      address: { street: '17 W Franklin St', city: 'Baltimore', state: 'MD', zip: '21201' },
      coordinates: { latitude: 39.2946, longitude: -76.6175 },
      phone: '+14106599429', website: null,
      capacity: { totalBeds: 65, yearRoundBeds: 65, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'Women 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Cleveland
    {
      id: nextId('cle'), name: 'City Mission', organizationName: 'Cleveland City Mission',
      type: ['emergency', 'food'],
      address: { street: '5310 Carnegie Ave', city: 'Cleveland', state: 'OH', zip: '44103' },
      coordinates: { latitude: 41.5027, longitude: -81.6493 },
      phone: '+12164314020', website: 'https://www.thecitymission.org',
      capacity: { totalBeds: 250, yearRoundBeds: 250, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management', 'job training'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('cle'), name: 'Lutheran Metropolitan Ministry', organizationName: 'Lutheran Metropolitan Ministry',
      type: ['emergency', 'food'],
      address: { street: '2100 Lakeside Ave', city: 'Cleveland', state: 'OH', zip: '44114' },
      coordinates: { latitude: 41.5100, longitude: -81.6837 },
      phone: '+12166961494', website: 'https://www.lutheranmetro.org',
      capacity: { totalBeds: 300, yearRoundBeds: 300, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'ID recovery'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Columbus
    {
      id: nextId('cmh'), name: 'Columbus Open Shelter', organizationName: 'Friends of the Homeless',
      type: ['emergency'],
      address: { street: '370 W State St', city: 'Columbus', state: 'OH', zip: '43215' },
      coordinates: { latitude: 39.9573, longitude: -83.0080 },
      phone: '+16142285301', website: null,
      capacity: { totalBeds: 100, yearRoundBeds: 100, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('cmh'), name: 'YWCA Family Center', organizationName: 'YWCA Columbus',
      type: ['emergency', 'transitional'],
      address: { street: '66 N 5th St', city: 'Columbus', state: 'OH', zip: '43215' },
      coordinates: { latitude: 39.9608, longitude: -82.9951 },
      phone: '+16142246601', website: 'https://www.ywcacolumbus.org',
      capacity: { totalBeds: 180, yearRoundBeds: 180, seasonalBeds: 0 },
      services: ['meals', 'childcare', 'case management', 'job training'],
      hours: '24/7', eligibility: 'Women and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Indianapolis
    {
      id: nextId('ind'), name: 'Wheeler Mission', organizationName: 'Wheeler Mission Ministries',
      type: ['emergency', 'food'],
      address: { street: '245 N Delaware St', city: 'Indianapolis', state: 'IN', zip: '46204' },
      coordinates: { latitude: 39.7733, longitude: -86.1511 },
      phone: '+13176354060', website: 'https://www.wheelermission.org',
      capacity: { totalBeds: 400, yearRoundBeds: 400, seasonalBeds: 0 },
      services: ['meals', 'showers', 'chapel', 'case management', 'substance abuse', 'job training'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('ind'), name: 'Horizon House', organizationName: 'Horizon House Inc',
      type: ['emergency', 'medical'],
      address: { street: '1033 E Washington St', city: 'Indianapolis', state: 'IN', zip: '46202' },
      coordinates: { latitude: 39.7679, longitude: -86.1427 },
      phone: '+13172326510', website: 'https://www.horizonhouse.cc',
      capacity: { totalBeds: 100, yearRoundBeds: 100, seasonalBeds: 0 },
      services: ['meals', 'showers', 'medical clinic', 'mental health', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Jacksonville
    {
      id: nextId('jax'), name: 'Sulzbacher Center', organizationName: 'Sulzbacher',
      type: ['emergency', 'food', 'medical'],
      address: { street: '611 E Adams St', city: 'Jacksonville', state: 'FL', zip: '32202' },
      coordinates: { latitude: 30.3252, longitude: -81.6491 },
      phone: '+19043946655', website: 'https://www.sulzbacher.org',
      capacity: { totalBeds: 350, yearRoundBeds: 350, seasonalBeds: 0 },
      services: ['meals', 'showers', 'medical clinic', 'dental', 'case management', 'childcare'],
      hours: '24/7', eligibility: 'All adults and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('jax'), name: 'City Rescue Mission Jacksonville', organizationName: 'City Rescue Mission',
      type: ['emergency', 'food'],
      address: { street: '234 W State St', city: 'Jacksonville', state: 'FL', zip: '32202' },
      coordinates: { latitude: 30.3287, longitude: -81.6620 },
      phone: '+19043874357', website: 'https://www.crmjax.org',
      capacity: { totalBeds: 250, yearRoundBeds: 250, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Kansas City
    {
      id: nextId('kc'), name: 'City Union Mission', organizationName: 'City Union Mission',
      type: ['emergency', 'food'],
      address: { street: '1108 E 10th St', city: 'Kansas City', state: 'MO', zip: '64106' },
      coordinates: { latitude: 39.0983, longitude: -94.5666 },
      phone: '+18164742272', website: 'https://www.cityunionmission.org',
      capacity: { totalBeds: 350, yearRoundBeds: 350, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management', 'job training'],
      hours: '24/7', eligibility: 'All adults and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('kc'), name: 'Salvation Army Kansas City', organizationName: 'The Salvation Army',
      type: ['emergency', 'food'],
      address: { street: '101 W Linwood Blvd', city: 'Kansas City', state: 'MO', zip: '64111' },
      coordinates: { latitude: 39.0582, longitude: -94.5842 },
      phone: '+18167561733', website: null,
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Louisville
    {
      id: nextId('lou'), name: 'Wayside Christian Mission', organizationName: 'Wayside Christian Mission',
      type: ['emergency', 'food'],
      address: { street: '432 E Jefferson St', city: 'Louisville', state: 'KY', zip: '40202' },
      coordinates: { latitude: 38.2453, longitude: -85.7504 },
      phone: '+15025841421', website: 'https://www.waysidechristianmission.org',
      capacity: { totalBeds: 600, yearRoundBeds: 600, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'substance abuse'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('lou'), name: 'Louisville Rescue Mission', organizationName: 'Louisville Rescue Mission',
      type: ['emergency', 'food'],
      address: { street: '907 W Market St', city: 'Louisville', state: 'KY', zip: '40202' },
      coordinates: { latitude: 38.2534, longitude: -85.7673 },
      phone: '+15026361771', website: 'https://www.lrm.org',
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'showers', 'chapel', 'substance abuse', 'case management'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Memphis
    {
      id: nextId('mem'), name: 'Memphis Union Mission', organizationName: 'Memphis Union Mission',
      type: ['emergency', 'food'],
      address: { street: '383 Poplar Ave', city: 'Memphis', state: 'TN', zip: '38103' },
      coordinates: { latitude: 35.1449, longitude: -90.0447 },
      phone: '+19015262701', website: 'https://www.memphisunionmission.org',
      capacity: { totalBeds: 250, yearRoundBeds: 250, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('mem'), name: 'Dorothy Day House of Hospitality', organizationName: 'Dorothy Day House',
      type: ['emergency'],
      address: { street: '1429 Poplar Ave', city: 'Memphis', state: 'TN', zip: '38104' },
      coordinates: { latitude: 35.1460, longitude: -90.0150 },
      phone: '+19012726812', website: null,
      capacity: { totalBeds: 45, yearRoundBeds: 45, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'Women and children', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Milwaukee
    {
      id: nextId('mke'), name: 'Rescue Mission Milwaukee', organizationName: 'Milwaukee Rescue Mission',
      type: ['emergency', 'food'],
      address: { street: '830 N 19th St', city: 'Milwaukee', state: 'WI', zip: '53233' },
      coordinates: { latitude: 43.0398, longitude: -87.9375 },
      phone: '+14143442211', website: 'https://www.milmission.org',
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('mke'), name: 'The Guest House of Milwaukee', organizationName: 'The Guest House',
      type: ['emergency', 'transitional'],
      address: { street: '1216 N 13th St', city: 'Milwaukee', state: 'WI', zip: '53205' },
      coordinates: { latitude: 43.0453, longitude: -87.9283 },
      phone: '+14143455222', website: 'https://www.guesthouseofmilwaukee.org',
      capacity: { totalBeds: 86, yearRoundBeds: 86, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'mental health'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // New Orleans
    {
      id: nextId('nola'), name: 'New Orleans Mission', organizationName: 'New Orleans Mission',
      type: ['emergency', 'food'],
      address: { street: '1130 Oretha Castle Haley Blvd', city: 'New Orleans', state: 'LA', zip: '70113' },
      coordinates: { latitude: 29.9406, longitude: -90.0839 },
      phone: '+15045281726', website: 'https://www.neworleansmission.org',
      capacity: { totalBeds: 250, yearRoundBeds: 250, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management', 'job training'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('nola'), name: 'Ozanam Inn', organizationName: 'Society of St. Vincent de Paul',
      type: ['emergency', 'food'],
      address: { street: '843 Camp St', city: 'New Orleans', state: 'LA', zip: '70130' },
      coordinates: { latitude: 29.9438, longitude: -90.0748 },
      phone: '+15045232441', website: 'https://www.ozanaminn.org',
      capacity: { totalBeds: 150, yearRoundBeds: 150, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Oakland
    {
      id: nextId('oak'), name: 'East Oakland Community Project', organizationName: 'EOCP',
      type: ['emergency', 'transitional'],
      address: { street: '7515 International Blvd', city: 'Oakland', state: 'CA', zip: '94621' },
      coordinates: { latitude: 37.7590, longitude: -122.1810 },
      phone: '+15104773023', website: 'https://www.eocp.net',
      capacity: { totalBeds: 100, yearRoundBeds: 100, seasonalBeds: 0 },
      services: ['meals', 'case management', 'mental health'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('oak'), name: 'St. Vincent de Paul of Alameda County', organizationName: 'St. Vincent de Paul',
      type: ['food'],
      address: { street: '2272 San Pablo Ave', city: 'Oakland', state: 'CA', zip: '94612' },
      coordinates: { latitude: 37.8136, longitude: -122.2757 },
      phone: '+15106384110', website: null,
      capacity: { totalBeds: 0, yearRoundBeds: 0, seasonalBeds: 0 },
      services: ['meals', 'clothing', 'referrals'],
      hours: 'Mon-Fri 10AM-2PM', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Pittsburgh
    {
      id: nextId('pit'), name: 'Light of Life Rescue Mission', organizationName: 'Light of Life',
      type: ['emergency', 'food'],
      address: { street: '10 E North Ave', city: 'Pittsburgh', state: 'PA', zip: '15212' },
      coordinates: { latitude: 40.4534, longitude: -80.0066 },
      phone: '+14123216116', website: 'https://www.lightoflife.org',
      capacity: { totalBeds: 130, yearRoundBeds: 130, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('pit'), name: 'Bethlehem Haven', organizationName: 'Bethlehem Haven',
      type: ['emergency'],
      address: { street: '905 Watson St', city: 'Pittsburgh', state: 'PA', zip: '15219' },
      coordinates: { latitude: 40.4396, longitude: -79.9826 },
      phone: '+14124715765', website: 'https://www.bethlehemhaven.org',
      capacity: { totalBeds: 36, yearRoundBeds: 36, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'Women 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Sacramento
    {
      id: nextId('sac'), name: 'Union Gospel Mission Sacramento', organizationName: 'Union Gospel Mission',
      type: ['emergency', 'food'],
      address: { street: '400 Bannon St', city: 'Sacramento', state: 'CA', zip: '95811' },
      coordinates: { latitude: 38.5815, longitude: -121.5024 },
      phone: '+19164470116', website: 'https://www.ugmsac.com',
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('sac'), name: 'Salvation Army Sacramento', organizationName: 'The Salvation Army',
      type: ['emergency', 'food'],
      address: { street: '1200 N B St', city: 'Sacramento', state: 'CA', zip: '95811' },
      coordinates: { latitude: 38.5871, longitude: -121.4990 },
      phone: '+19164424141', website: null,
      capacity: { totalBeds: 120, yearRoundBeds: 120, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Salt Lake City
    {
      id: nextId('slc'), name: 'The Road Home', organizationName: 'The Road Home',
      type: ['emergency'],
      address: { street: '210 S Rio Grande St', city: 'Salt Lake City', state: 'UT', zip: '84101' },
      coordinates: { latitude: 40.7633, longitude: -111.9053 },
      phone: '+18013594142', website: 'https://www.theroadhome.org',
      capacity: { totalBeds: 300, yearRoundBeds: 300, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'job training'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('slc'), name: 'Rescue Mission of Salt Lake', organizationName: 'Rescue Mission of Salt Lake',
      type: ['emergency', 'food'],
      address: { street: '463 S 400 W', city: 'Salt Lake City', state: 'UT', zip: '84101' },
      coordinates: { latitude: 40.7577, longitude: -111.9036 },
      phone: '+18013551302', website: 'https://www.rescuesaltlake.org',
      capacity: { totalBeds: 150, yearRoundBeds: 150, seasonalBeds: 0 },
      services: ['meals', 'showers', 'chapel', 'substance abuse', 'case management'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // San Antonio
    {
      id: nextId('sat'), name: 'Haven for Hope', organizationName: 'Haven for Hope',
      type: ['emergency', 'food', 'medical'],
      address: { street: '1 Haven for Hope Way', city: 'San Antonio', state: 'TX', zip: '78207' },
      coordinates: { latitude: 29.4288, longitude: -98.5136 },
      phone: '+12102200100', website: 'https://www.havenforhope.org',
      capacity: { totalBeds: 1500, yearRoundBeds: 1500, seasonalBeds: 0 },
      services: ['meals', 'showers', 'medical clinic', 'dental', 'mental health', 'substance abuse', 'case management', 'job training'],
      hours: '24/7', eligibility: 'All adults and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('sat'), name: 'SAMMinistries', organizationName: 'SAMMinistries',
      type: ['transitional'],
      address: { street: '1919 NW Loop 410', city: 'San Antonio', state: 'TX', zip: '78213' },
      coordinates: { latitude: 29.4951, longitude: -98.5252 },
      phone: '+12107853220', website: 'https://www.samministries.org',
      capacity: { totalBeds: 100, yearRoundBeds: 100, seasonalBeds: 0 },
      services: ['case management', 'job training', 'financial literacy'],
      hours: '24/7', eligibility: 'All adults and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // San Jose
    {
      id: nextId('sj'), name: 'HomeFirst Services', organizationName: 'HomeFirst',
      type: ['emergency', 'transitional'],
      address: { street: '2011 Little Orchard St', city: 'San Jose', state: 'CA', zip: '95125' },
      coordinates: { latitude: 37.3170, longitude: -121.8933 },
      phone: '+14085392291', website: 'https://www.homefirstscc.org',
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'case management', 'job training'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('sj'), name: 'EHC LifeBuilders', organizationName: 'EHC LifeBuilders',
      type: ['transitional'],
      address: { street: '2236 The Alameda', city: 'San Jose', state: 'CA', zip: '95126' },
      coordinates: { latitude: 37.3430, longitude: -121.9108 },
      phone: '+14085392282', website: 'https://www.ehclifebuilders.org',
      capacity: { totalBeds: 120, yearRoundBeds: 120, seasonalBeds: 0 },
      services: ['case management', 'job training', 'mental health'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // St. Louis
    {
      id: nextId('stl'), name: 'Gateway Homeless Services', organizationName: 'Peter & Paul Community Services',
      type: ['emergency'],
      address: { street: '3518 N Grand Blvd', city: 'St. Louis', state: 'MO', zip: '63107' },
      coordinates: { latitude: 38.6616, longitude: -90.2254 },
      phone: '+13142898001', website: null,
      capacity: { totalBeds: 100, yearRoundBeds: 100, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('stl'), name: 'St. Patrick Center', organizationName: 'St. Patrick Center',
      type: ['emergency', 'food', 'medical'],
      address: { street: '800 N Tucker Blvd', city: 'St. Louis', state: 'MO', zip: '63101' },
      coordinates: { latitude: 38.6358, longitude: -90.1953 },
      phone: '+13148020700', website: 'https://www.stpatrickcenter.org',
      capacity: { totalBeds: 120, yearRoundBeds: 120, seasonalBeds: 0 },
      services: ['meals', 'medical clinic', 'case management', 'job training', 'mental health'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Tampa
    {
      id: nextId('tpa'), name: 'Metropolitan Ministries', organizationName: 'Metropolitan Ministries',
      type: ['emergency', 'food'],
      address: { street: '2002 N Florida Ave', city: 'Tampa', state: 'FL', zip: '33602' },
      coordinates: { latitude: 27.9605, longitude: -82.4598 },
      phone: '+18132091500', website: 'https://www.metromin.org',
      capacity: { totalBeds: 250, yearRoundBeds: 250, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'childcare', 'job training'],
      hours: '24/7', eligibility: 'All adults and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('tpa'), name: 'Salvation Army Tampa', organizationName: 'The Salvation Army',
      type: ['emergency', 'food'],
      address: { street: '1514 N Florida Ave', city: 'Tampa', state: 'FL', zip: '33602' },
      coordinates: { latitude: 27.9558, longitude: -82.4598 },
      phone: '+18132261295', website: null,
      capacity: { totalBeds: 120, yearRoundBeds: 120, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Tucson
    {
      id: nextId('tuc'), name: 'Gospel Rescue Mission Tucson', organizationName: 'Gospel Rescue Mission',
      type: ['emergency', 'food'],
      address: { street: '4550 S Palo Verde Rd', city: 'Tucson', state: 'AZ', zip: '85714' },
      coordinates: { latitude: 32.1850, longitude: -110.9249 },
      phone: '+15207405440', website: 'https://www.grmtucson.com',
      capacity: { totalBeds: 250, yearRoundBeds: 250, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('tuc'), name: 'Primavera Foundation', organizationName: 'Primavera Foundation',
      type: ['emergency', 'transitional'],
      address: { street: '702 S 6th Ave', city: 'Tucson', state: 'AZ', zip: '85701' },
      coordinates: { latitude: 32.2138, longitude: -110.9711 },
      phone: '+15206232000', website: 'https://www.primavera.org',
      capacity: { totalBeds: 80, yearRoundBeds: 80, seasonalBeds: 0 },
      services: ['meals', 'case management', 'job training'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Charlotte
    {
      id: nextId('clt'), name: 'Roof Above Day Services', organizationName: 'Roof Above',
      type: ['food', 'medical'],
      address: { street: '945 N College St', city: 'Charlotte', state: 'NC', zip: '28206' },
      coordinates: { latitude: 35.2373, longitude: -80.8383 },
      phone: '+17043341721', website: 'https://www.roofabove.org',
      capacity: { totalBeds: 0, yearRoundBeds: 0, seasonalBeds: 0 },
      services: ['meals', 'showers', 'medical clinic', 'case management', 'mail services'],
      hours: 'Mon-Fri 7AM-5PM', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('clt'), name: 'Salvation Army Center of Hope', organizationName: 'The Salvation Army',
      type: ['emergency', 'food'],
      address: { street: '534 Spratt St', city: 'Charlotte', state: 'NC', zip: '28206' },
      coordinates: { latitude: 35.2355, longitude: -80.8319 },
      phone: '+17043752007', website: null,
      capacity: { totalBeds: 240, yearRoundBeds: 240, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'substance abuse'],
      hours: '24/7', eligibility: 'All adults and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Raleigh
    {
      id: nextId('ral'), name: 'Raleigh Rescue Mission', organizationName: 'Raleigh Rescue Mission',
      type: ['emergency', 'food'],
      address: { street: '314 E Hargett St', city: 'Raleigh', state: 'NC', zip: '27601' },
      coordinates: { latitude: 35.7790, longitude: -78.6337 },
      phone: '+19198284672', website: 'https://www.rfrm.org',
      capacity: { totalBeds: 250, yearRoundBeds: 250, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management', 'job training'],
      hours: '24/7', eligibility: 'Men 18+', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('ral'), name: 'Healing Transitions', organizationName: 'Healing Transitions',
      type: ['emergency', 'medical'],
      address: { street: '1251 Goode St', city: 'Raleigh', state: 'NC', zip: '27603' },
      coordinates: { latitude: 35.7650, longitude: -78.6492 },
      phone: '+19197833152', website: 'https://www.healingtransitions.org',
      capacity: { totalBeds: 200, yearRoundBeds: 200, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'medical clinic', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Oklahoma City
    {
      id: nextId('okc'), name: 'City Rescue Mission OKC', organizationName: 'City Rescue Mission',
      type: ['emergency', 'food'],
      address: { street: '800 W California Ave', city: 'Oklahoma City', state: 'OK', zip: '73106' },
      coordinates: { latitude: 35.4772, longitude: -97.5295 },
      phone: '+14052329781', website: 'https://www.cityrescue.org',
      capacity: { totalBeds: 300, yearRoundBeds: 300, seasonalBeds: 0 },
      services: ['meals', 'showers', 'substance abuse', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: nextId('okc'), name: 'Jesus House OKC', organizationName: 'Jesus House',
      type: ['emergency', 'food'],
      address: { street: '1335 W Sheridan Ave', city: 'Oklahoma City', state: 'OK', zip: '73106' },
      coordinates: { latitude: 35.4667, longitude: -97.5360 },
      phone: '+14052357233', website: 'https://www.jesushouseokc.org',
      capacity: { totalBeds: 100, yearRoundBeds: 100, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'All adults and families', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Honolulu
    {
      id: nextId('hnl'), name: 'Institute for Human Services', organizationName: 'IHS Hawaii',
      type: ['emergency', 'food'],
      address: { street: '350 Sumner St', city: 'Honolulu', state: 'HI', zip: '96817' },
      coordinates: { latitude: 21.3158, longitude: -157.8625 },
      phone: '+18085461144', website: 'https://www.ihshawaii.org',
      capacity: { totalBeds: 350, yearRoundBeds: 350, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management', 'job training'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    // Anchorage
    {
      id: nextId('anc'), name: 'Brother Francis Shelter', organizationName: 'Catholic Social Services',
      type: ['emergency', 'food'],
      address: { street: '1021 E 3rd Ave', city: 'Anchorage', state: 'AK', zip: '99501' },
      coordinates: { latitude: 61.2155, longitude: -149.8691 },
      phone: '+19072771731', website: null,
      capacity: { totalBeds: 250, yearRoundBeds: 250, seasonalBeds: 0 },
      services: ['meals', 'showers', 'case management'],
      hours: '24/7', eligibility: 'All adults', status: 'open',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
  ];
}

// ─── Utilities ───────────────────────────────────────────────────
function cleanPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const d = digits.length === 11 && digits[0] === '1' ? digits.slice(1) : digits.slice(0, 10);
  return `+1${d}`;
}

function deduplicate(shelters) {
  const seen = new Set();
  return shelters.filter((s) => {
    const key = `${s.name.toLowerCase().trim()}|${s.address.city.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function validate(shelters) {
  return shelters.filter((s) => {
    if (!s.name || s.name === 'Unknown' || s.name.length < 3) return false;
    if (!s.coordinates.latitude || !s.coordinates.longitude) return false;
    if (Math.abs(s.coordinates.latitude) < 1 || Math.abs(s.coordinates.longitude) < 1) return false;
    return true;
  });
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('=== Shelter Finder: Fetching Real Data ===\n');

  const [nyc, dc, la] = await Promise.all([fetchNYC(), fetchDC(), fetchLA()]);
  const curated = getCuratedShelters();

  console.log(`\nRaw counts: NYC=${nyc.length}, DC=${dc.length}, LA=${la.length}, Curated=${curated.length}`);

  let all = [...nyc, ...dc, ...la, ...curated];
  all = validate(all);
  all = deduplicate(all);

  // Sort by state then city then name
  all.sort((a, b) =>
    a.address.state.localeCompare(b.address.state) ||
    a.address.city.localeCompare(b.address.city) ||
    a.name.localeCompare(b.name)
  );

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(all, null, 2));

  // Summary by city
  const byCityState = {};
  for (const s of all) {
    const key = `${s.address.city}, ${s.address.state}`;
    byCityState[key] = (byCityState[key] || 0) + 1;
  }

  console.log(`\nTotal shelters: ${all.length}`);
  console.log('\nBy city:');
  Object.entries(byCityState)
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => console.log(`  ${city}: ${count}`));

  console.log(`\nOutput: ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
