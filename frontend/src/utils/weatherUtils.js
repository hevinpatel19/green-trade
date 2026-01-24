/**
 * Weather Utility Functions
 * Helper functions for geo queries, timezone formatting, and geo matching
 */

const WEATHER_API_KEY = "2cf62494edaa9494d7c2025ddede5a9e";

/**
 * Format Unix timestamp to HH:MM using city's timezone offset
 * NO DST logic - uses raw offset from OpenWeather API
 */
export const formatTimeWithOffset = (unixTimestamp, timezoneOffsetSeconds) => {
    const utcMs = unixTimestamp * 1000;
    const cityMs = utcMs + (timezoneOffsetSeconds * 1000);
    const cityDate = new Date(cityMs);
    const hours = cityDate.getUTCHours().toString().padStart(2, '0');
    const minutes = cityDate.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

/**
 * Build Geo API query with optional country code filter
 */
export const buildGeoQuery = (city, countryCode) => {
    const encodedCity = encodeURIComponent(city.trim());
    if (countryCode && countryCode.trim()) {
        return `${encodedCity},${countryCode.trim().toUpperCase()}`;
    }
    return encodedCity;
};

/**
 * Normalize country input (handle common aliases)
 */
export const normalizeCountryCode = (input) => {
    if (!input) return null;
    const upper = input.toUpperCase().trim();
    const aliases = {
        'INDIA': 'IN',
        'USA': 'US',
        'AMERICA': 'US',
        'UNITED STATES': 'US',
        'FRANCE': 'FR',
        'GERMANY': 'DE',
        'BRITAIN': 'GB',
        'UK': 'GB',
        'AUSTRALIA': 'AU'
    };
    return aliases[upper] || upper;
};

/**
 * Select best geo match from results with priority:
 * 1. Exact city + exact country match
 * 2. Exact city + preferred country (dropdown)
 * 3. First result fallback
 */
export const selectBestGeoMatch = (results, searchCity, preferredCountry) => {
    if (!results || results.length === 0) return null;

    const normalizedSearch = searchCity.toLowerCase().trim();
    const normalizedCountry = preferredCountry?.toUpperCase();

    // Priority 1: Exact city name + exact country match
    for (const result of results) {
        const resultCity = result.name?.toLowerCase();
        const resultCountry = result.country?.toUpperCase();

        if (resultCity === normalizedSearch && resultCountry === normalizedCountry) {
            console.log(`✅ Priority 1 Match: Exact city + country`);
            return result;
        }
    }

    // Priority 2: Exact city name, prefer specified country or IN as default
    for (const result of results) {
        const resultCity = result.name?.toLowerCase();
        const resultCountry = result.country?.toUpperCase();

        if (resultCity === normalizedSearch) {
            if (resultCountry === normalizedCountry || resultCountry === 'IN') {
                console.log(`✅ Priority 2 Match: Exact city, preferred country`);
                return result;
            }
        }
    }

    // Priority 3: First result fallback
    console.log(`⚠️ Priority 3: Fallback to first result`);
    return results[0];
};

/**
 * API URLs builder
 */
export const buildWeatherUrl = (lat, lon) => {
    return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
};

export const buildForecastUrl = (lat, lon, cnt = 8) => {
    return `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&cnt=${cnt}`;
};

export const buildGeoUrl = (query, limit = 10) => {
    return `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=${limit}&appid=${WEATHER_API_KEY}`;
};

export { WEATHER_API_KEY };
