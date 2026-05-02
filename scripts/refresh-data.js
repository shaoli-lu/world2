const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper to fetch JSON from a URL
const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Status Code: ${res.statusCode} for ${url}`));
      }
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

const fetchIndicator = async (indicatorCode) => {
  const map = {};
  try {
    const baseUrl = `https://api.worldbank.org/v2/country/all/indicator/${indicatorCode}?format=json&date=2020:2023&per_page=300`;
    console.log(`Fetching ${baseUrl}...`);
    const firstJson = await fetchJson(baseUrl);
    const totalPages = firstJson[0].pages || 1;
    const allRecords = [...(firstJson[1] || [])];

    if (totalPages > 1) {
      const fetches = [];
      for (let p = 2; p <= totalPages; p++) {
        fetches.push(
          fetchJson(`${baseUrl}&page=${p}`)
            .then((json) => json[1] || [])
            .catch((err) => {
              console.error(`Error fetching page ${p} for ${indicatorCode}:`, err.message);
              return [];
            })
        );
      }
      const results = await Promise.all(fetches);
      results.forEach((records) => allRecords.push(...records));
    }

    for (const rec of allRecords) {
      const code = rec.countryiso3code;
      if (!code || rec.value == null) continue;
      const year = parseInt(rec.date, 10);
      if (!map[code] || year > map[code].year) {
        map[code] = { value: rec.value, year };
      }
    }
  } catch (error) {
    console.error(`Failed to fetch ${indicatorCode}:`, error.message);
  }
  return map;
};

const refreshData = async () => {
  try {
    console.log("Starting data refresh...");
    const fields = "name,translations,capital,population,area,car,flags,cca3";
    const restCountriesUrl = `https://restcountries.com/v3.1/all?fields=${fields}`;
    console.log(`Fetching ${restCountriesUrl}...`);
    
    const [restCountriesData, gdpMap, gdpPcMap] = await Promise.all([
      fetchJson(restCountriesUrl),
      fetchIndicator("NY.GDP.MKTP.CD"),       // GDP (current US$)
      fetchIndicator("NY.GDP.PCAP.CD"),        // GDP per capita (current US$)
    ]);

    const enriched = restCountriesData.map((c) => {
      const gdp = gdpMap[c.cca3];
      const gdpPc = gdpPcMap[c.cca3];
      return {
        ...c,
        ...(gdp ? { _gdp: gdp.value, _gdpYear: gdp.year } : {}),
        ...(gdpPc ? { _gdpPerCapita: gdpPc.value, _gdpPerCapitaYear: gdpPc.year } : {}),
      };
    });

    const dataDir = path.join(__dirname, '..', 'public', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const outputPath = path.join(dataDir, 'countries.json');
    fs.writeFileSync(outputPath, JSON.stringify(enriched, null, 2), 'utf-8');
    
    console.log(`Successfully written ${enriched.length} countries to ${outputPath}`);
  } catch (error) {
    console.error("Failed to refresh data:", error);
    process.exit(1);
  }
};

refreshData();
