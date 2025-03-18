const geoip = require("geoip-lite");
const getLocation = async (ipAddress) => {
  try {
    const geo = geoip.lookup(ipAddress);
    if (!geo) {
      return;
    }
    return {
      country: geo.country,
      region: geo.region,
      city: geo.city,
      timezone: geo.timezone,
      latitude: geo.ll[0],
      longitude: geo.ll[1],
    };
  } catch (err) {
    return;
  }
};
module.exports = getLocation;
