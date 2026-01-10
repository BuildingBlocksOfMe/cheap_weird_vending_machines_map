import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import type { VendingMachine } from '../types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  vendingMachines: VendingMachine[];
  onMapClick: (lat: number, lng: number) => void;
  selectedLocation: { lat: number; lng: number } | null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function Map({ vendingMachines, onMapClick, selectedLocation }: MapProps) {
  // Center of Japan roughly
  const defaultPosition: [number, number] = [36.2048, 138.2529];

  return (
    <MapContainer center={defaultPosition} zoom={5} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onMapClick={onMapClick} />
      
      {/* Existing Markers */}
      {vendingMachines.map((vm) => (
        <Marker key={vm.id} position={[vm.lat, vm.lng]}>
          <Popup>
            <div className="p-2">
              <span className={`inline-block px-2 py-1 rounded text-white text-xs mb-1 ${vm.type === 'cheap' ? 'bg-green-500' : 'bg-purple-500'}`}>
                {vm.type === 'cheap' ? '安い' : '変な'}自販機
              </span>
              {vm.price && <p className="font-bold">¥{vm.price}</p>}
              {vm.description && <p className="text-sm mt-1">{vm.description}</p>}
              {vm.image_path && (
                  <div className="mt-2">
                      <img
                          src={vm.image_path.startsWith('http') ? vm.image_path : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/vm-photos/${vm.image_path}`}
                          alt="自販機"
                          className="max-w-full h-auto rounded"
                          style={{ maxHeight: '150px' }}
                      />
                  </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Selected Location Marker (temporary) */}
      {selectedLocation && (
        <Marker position={[selectedLocation.lat, selectedLocation.lng]} opacity={0.6}>
           <Popup>
             <p>ここに追加しますか？</p>
           </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
