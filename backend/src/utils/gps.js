const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in meters
  return distance;
};

const verifyRestaurantProximity = (userLat, userLon) => {
  const restLat = parseFloat(process.env.RESTAURANT_LAT) || 12.9715987;
  const restLon = parseFloat(process.env.RESTAURANT_LNG) || 77.5945627;
  
  const distance = getDistanceInMeters(userLat, userLon, restLat, restLon);
  return {
    isWithinRange: distance <= 100, // 100 meters threshold
    distanceMeters: Math.round(distance * 100) / 100
  };
};

module.exports = {
  getDistanceInMeters,
  verifyRestaurantProximity,
};
