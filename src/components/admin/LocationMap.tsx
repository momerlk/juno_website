import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { getAllSellers, getAllUsers } from '../../api/adminApi';
import { Map as MapIcon } from 'lucide-react';

interface LocationData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'user' | 'seller';
}

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '1rem',
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
      className="glass-panel p-6 mt-6"
    >
      <div className="flex items-center mb-6 border-b border-white/10 pb-4">
        <div className="p-2 bg-primary/20 rounded-lg mr-3">
            <MapIcon size={24} className="text-primary" />
        </div>
        <div>
            <h2 className="text-xl font-semibold text-white">User and Seller Locations</h2>
            <p className="text-sm text-neutral-400 mt-1">
                Visualizing {locations.filter(l => l.type === 'user').length} users and {locations.filter(l => l.type === 'seller').length} sellers.
            </p>
        </div>
      </div>
      
      {isLoading ? (
          <div className="h-[500px] flex items-center justify-center text-neutral-400">Loading map data...</div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-white/10">
            <LoadScript googleMapsApiKey={API_KEY}>
                <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={5}
                options={{
                    styles: [
                        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                        {
                        featureType: "administrative.locality",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#d59563" }],
                        },
                        {
                        featureType: "poi",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#d59563" }],
                        },
                        {
                        featureType: "poi.park",
                        elementType: "geometry",
                        stylers: [{ color: "#263c3f" }],
                        },
                        {
                        featureType: "poi.park",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#6b9a76" }],
                        },
                        {
                        featureType: "road",
                        elementType: "geometry",
                        stylers: [{ color: "#38414e" }],
                        },
                        {
                        featureType: "road",
                        elementType: "geometry.stroke",
                        stylers: [{ color: "#212a37" }],
                        },
                        {
                        featureType: "road",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#9ca5b3" }],
                        },
                        {
                        featureType: "road.highway",
                        elementType: "geometry",
                        stylers: [{ color: "#746855" }],
                        },
                        {
                        featureType: "road.highway",
                        elementType: "geometry.stroke",
                        stylers: [{ color: "#1f2835" }],
                        },
                        {
                        featureType: "road.highway",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#f3d19c" }],
                        },
                        {
                        featureType: "transit",
                        elementType: "geometry",
                        stylers: [{ color: "#2f3948" }],
                        },
                        {
                        featureType: "transit.station",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#d59563" }],
                        },
                        {
                        featureType: "water",
                        elementType: "geometry",
                        stylers: [{ color: "#17263c" }],
                        },
                        {
                        featureType: "water",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#515c6d" }],
                        },
                        {
                        featureType: "water",
                        elementType: "labels.text.stroke",
                        stylers: [{ color: "#17263c" }],
                        },
                    ],
                }}
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
                    <div className="text-black p-2">
                        <h3 className="font-bold text-lg">{selectedLocation.name}</h3>
                        <p className="capitalize text-sm text-gray-600">{selectedLocation.type}</p>
                    </div>
                    </InfoWindow>
                )}
                </GoogleMap>
            </LoadScript>
        </div>
      )}
    </motion.div>
  );
};

export default LocationMap;
