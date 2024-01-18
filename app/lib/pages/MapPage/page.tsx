'use client'
import {MapContainer,TileLayer} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function Map() {
   return(
    <div>
     <div style={{ height:"50px",margin: "20px", display: "flex", justifyContent: "space-between" }}>
  <input
    type="text"
    id="searchInput"
    name="q"
    placeholder="Please Enter the Place you want to search here"
    style={{ width: "70%", border: "5px solid black" }}
  />
  <button  type="submit" style={{ width: "20%", background:"blue",}}>
    Search
  </button>
</div>

      <MapContainer style={{width:"100%",height:"40rem"}} center={[0.0,0]} zoom={2} scrollWheelZoom={true}>
      <TileLayer 
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
      </div>
   );
}

export default Map;