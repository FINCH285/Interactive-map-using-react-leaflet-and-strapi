import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';

const Map = () => {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [polygonPoints, setPolygonPoints] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/locations');
        const data = await response.json();
        const locationsWithPhotoUrl = data.data.map((location) => ({
          ...location,
          photoUrl: `http://localhost:1337${location.attributes.photo?.data[0]?.attributes?.url}`,
        }));
        setLocations(locationsWithPhotoUrl);
        setFilteredLocations(locationsWithPhotoUrl);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const customIcon = L.icon({
    iconUrl: '/custom-marker.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

  const handleMarkerClick = (location) => {
    setSelectedLocation(location);
    mapRef.current.flyTo(
      [location.attributes.latitude, location.attributes.longitude],
      14 // Zoom level
    );
  };

  const handleSearch = () => {
    if (searchQuery.trim() === '') {
      setFilteredLocations(locations);
      setSelectedLocation(null);
    } else {
      const filtered = locations.filter((location) =>
        location.attributes.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLocations(filtered);
      if (filtered.length > 0) {
        setSelectedLocation(filtered[0]);
        mapRef.current.flyTo(
          [filtered[0].attributes.latitude, filtered[0].attributes.longitude],
          14 // Zoom level
        );
      } else {
        setSelectedLocation(null);
      }
    }
  };

  const handleDragMarker = (event, location) => {
    const newLatLng = event.target.getLatLng();
    const updatedLocations = locations.map((loc) =>
      loc.id === location.id
        ? { ...loc, attributes: { ...loc.attributes, latitude: newLatLng.lat, longitude: newLatLng.lng } }
        : loc
    );
    setLocations(updatedLocations);
    setFilteredLocations(updatedLocations);
  };

  const _onCreate = (e) => {
    const { layerType, layer } = e;
    if (layerType === 'polygon') {
      setPolygonPoints(layer.getLatLngs()[0]);
    }
  };

  const _onEdited = (e) => {
    const {
      layers: { _layers },
    } = e;
    Object.values(_layers).map(({ editing }) => {
      setPolygonPoints(editing.latlngs[0]);
    });
  };

  const _onDeleted = (e) => {
    const {
      layers: { _layers },
    } = e;
    Object.values(_layers).map(() => {
      setPolygonPoints([]);
    });
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search locations"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ color: 'black', border: '1px solid #ccc', borderRadius: '4px', padding: '8px' }}
      />
      <button onClick={handleSearch} style={{ backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px', marginLeft: '8px' }}>Search</button>
      <MapContainer
        center={[0, 0]}
        zoom={2}
        style={{ height: '80vh' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FeatureGroup>
          <EditControl
            position="topright"
            onCreated={_onCreate}
            onEdited={_onEdited}
            onDeleted={_onDeleted}
            draw={{
              rectangle: false,
              polyline: false,
              circle: false,
              circlemarker: false,
              marker: false,
            }}
          />
        </FeatureGroup>
        {Array.isArray(filteredLocations) &&
          filteredLocations.map((location) => (
            <Marker
              key={location.id}
              position={[
                location.attributes.latitude,
                location.attributes.longitude,
              ]}
              icon={customIcon}
              eventHandlers={{
                click: () => handleMarkerClick(location),
                dragend: (event) => handleDragMarker(event, location),
              }}
              draggable
            >
              <Popup>
                <div style={{ width: '300px', height: 'Auto', paddingTop: '10px' }}>
                  <h3>{location.attributes.name}</h3>
                  {selectedLocation?.id === location.id && (
                    <div>
                      <p>{location.attributes.description}</p>
                      {location.photoUrl && (
                        <img
                          src={location.photoUrl}
                          alt={location.attributes.name}
                          style={{ maxWidth: '100%', height: 'auto' }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        {polygonPoints.length > 0 && (
          <Polygon positions={polygonPoints} color="blue" fillOpacity={0.5} />
        )}
      </MapContainer>
    </div>
  );
};

export default Map;
