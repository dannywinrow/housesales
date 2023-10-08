const position = { lat: 54.23400, lng: -4.50412  };

// The map, centered at Uluru
var map = L.map('map').setView(position, 10);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const landreg = await d3.csv("./data/iom-land-registry-with-location.csv");
console.log(landreg);
console.log(landreg[1].Acquisition_Date);
console.log(typeof landreg[1].Acquisition_Date);
var GBPFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});


var markers = L.markerClusterGroup({ chunkedLoading: true,
                                      disableClusteringAtZoom: 16,
                                      spiderfyOnMaxZoom: false,
                                    zoomToBoundsOnClick: true });
var markerList = [];

function makeSale(sale) {
  sale["marker"] = L.marker([sale.lat, sale.lon]);
  var priceString = GBPFormatter.format(sale.Market_Value);
  if (sale.Consideration != sale.Market_Value){
    priceString += " (paid "+ GBPFormatter.format(sale.Consideration)+")";
  }
  sale.marker.bindPopup(
    sale.longaddress + "<br>" + (new Date(sale.Acquisition_Date)).toLocaleDateString("en-GB")+": "+priceString
  );
  markerList.push(sale.marker);
}

landreg.forEach(makeSale);

markers.addLayers(markerList);
map.addLayer(markers);

L.Control.geocoder().addTo(map);