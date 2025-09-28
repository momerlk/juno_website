import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { getAllSellers, getAllUsers } from '../../api/adminApi';

interface LocationData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'user' | 'seller';
}

const containerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 30.3753,
  lng: 69.3451
};

const API_KEY = "AIzaSyCj3NyWXsgMDyPTckLO9JT7AC0dnli_BJs"; // WARNING: This is not a secure way to store an API key.

const LocationMap: React.FC = () => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const [usersResponse, sellersResponse] = await Promise.all([getAllUsers(), getAllSellers()]);
        const locationData: LocationData[] = [];

        if (usersResponse.ok) {
          usersResponse.body.forEach((user: any) => {
            if (user.location && user.location.latitude && user.location.longitude) {
              locationData.push({ id: user.id, name: user.name, lat: user.location.latitude, lng: user.location.longitude, type: 'user' });
            }
          });
        }

        if (sellersResponse.ok) {
          sellersResponse.body.forEach((seller: any) => {
            if (seller.location && seller.location.latitude && seller.location.longitude) {
              locationData.push({ id: seller.id, name: seller.business_name, lat: seller.location.latitude, lng: seller.location.longitude, type: 'seller' });
            }
          });
        }

        setLocations(locationData);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-background rounded-lg p-6 mt-6"
    >
      <h2 className="text-xl font-semibold text-white mb-4">User and Seller Locations</h2>
      <p className="text-yellow-500 mb-4">Note: Storing API keys directly in the code is insecure. Please use environment variables.</p>
      <LoadScript googleMapsApiKey={API_KEY}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={5}
        >
          {locations.map(loc => (
            <Marker
              key={`${loc.type}-${loc.id}`}
              position={{ lat: loc.lat, lng: loc.lng }}
              title={loc.name}
              onClick={() => setSelectedLocation(loc)}
              icon={{
                url: loc.type === 'user' ? 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              }}
            />
          ))}

          {selectedLocation && (
            <InfoWindow
              position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
              onCloseClick={() => setSelectedLocation(null)}
            >
              <div>
                <h3 className="font-bold">{selectedLocation.name}</h3>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </motion.div>
  );
};

export default LocationMap;
