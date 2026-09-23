import { getOptions, loadContractors, ORIGINAL_SHA256 } from '../lib/dataset';
const profiles = loadContractors();
const options = getOptions(profiles);
console.log(JSON.stringify({ rows: profiles.length, headers: 13, sha256: ORIGINAL_SHA256,
  cities: Object.fromEntries(options.cities.map(c => [c, profiles.filter(p => p.city === c).length])),
  categories: Object.fromEntries(options.categories.map(c => [c, profiles.filter(p => p.categories.includes(c)).length])),
  synthetic: profiles.filter(p => p.synthetic).length, priceImputed: profiles.filter(p => p.priceImputed).length,
  cityImputed: profiles.filter(p => p.cityImputed).length, maxHoursNull: profiles.filter(p => p.maxHours === null).length,
  calendar: ['2026-09-23', '2026-12-31'],
}, null, 2));
