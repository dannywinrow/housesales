const myApp = Object.create(null)

//Isle of Man
const position = {lat: 54.23400, lng: -4.50412};
const zoom = 10;

function initmap(position, zoom){
  var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });
  /*var stamen = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    minZoom: 1,
    maxZoom: 16,
    ext: 'png'});*/
  return L.map('map-id', {layers: [osm]}).setView(position, zoom);
}

// ==================== ON LOAD ======================

var loaded = function(){
  console.clear()
  // Handler when the DOM is fully loaded
  myApp.map = initmap(position, zoom);
  console.log("loaded function")
};

if (document.readyState === "complete" ||
    (document.readyState !== "loading" && !document.documentElement.doScroll)
) {
  loaded();
} else {
  document.addEventListener("DOMContentLoaded", loaded);
}
// =========================================================

const landreg = await d3.csv("data/iom-land-registry-with-location.csv");
console.log(landreg);

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
  sale.marker.Market_Value = Number(sale.Market_Value, 10);
  sale.marker.bindPopup(
    sale.longaddress + "<br>" + (new Date(sale.Acquisition_Date)).toLocaleDateString("en-GB")+": "+priceString
  );
  markerList.push(sale.marker);
}

landreg.forEach(makeSale);

console.log(markerList.length);
markers.addLayers(markerList);
myApp.map.addLayer(markers);
console.log(markerList)


// FOR THE SLIDERS

function controlFromInput(fromSlider, fromInput, toInput, controlSlider) {
  const [from, to] = getParsed(fromInput, toInput);
  fillSlider(fromInput, toInput, '#C6C6C6', '#25daa5', controlSlider);
  if (from > to) {
      fromSlider.value = to;
      fromInput.value = to;
  } else {
      fromSlider.value = from;
  }
  refreshSales();
}
  
function controlToInput(toSlider, fromInput, toInput, controlSlider) {
  const [from, to] = getParsed(fromInput, toInput);
  fillSlider(fromInput, toInput, '#C6C6C6', '#25daa5', controlSlider);
  setToggleAccessible(toInput);
  if (from <= to) {
      toSlider.value = to;
      toInput.value = to;
  } else {
      toInput.value = from;
  }
  refreshSales();
}

function controlFromSlider(fromSlider, toSlider, fromInput) {
  const [from, to] = getParsed(fromSlider, toSlider);
  fillSlider(fromSlider, toSlider, '#C6C6C6', '#25daa5', toSlider);
  if (from > to) {
    fromSlider.value = to;
    fromInput.value = to;
  } else {
    fromInput.value = from;
  }
  refreshSales();
}

function controlToSlider(fromSlider, toSlider, toInput) {
  const [from, to] = getParsed(fromSlider, toSlider);
  fillSlider(fromSlider, toSlider, '#C6C6C6', '#25daa5', toSlider);
  setToggleAccessible(toSlider);
  if (from <= to) {
    toSlider.value = to;
    toInput.value = to;
  } else {
    toInput.value = from;
    toSlider.value = from;
  }
  refreshSales();
}

function getParsed(currentFrom, currentTo) {
  const from =  parseInt(currentFrom.value, 10);
  const to = parseInt(currentTo.value, 10);
  return [from, to];
}

function fillSlider(from, to, sliderColor, rangeColor, controlSlider) {
  const rangeDistance = to.max-to.min;
  const fromPosition = from.value - to.min;
  const toPosition = to.value - to.min;
  controlSlider.style.background = `linear-gradient(
    to right,
    ${sliderColor} 0%,
    ${sliderColor} ${(fromPosition)/(rangeDistance)*100}%,
    ${rangeColor} ${(fromPosition)/(rangeDistance)*100}%,
    ${rangeColor} ${(toPosition)/(rangeDistance)*100}%, 
    ${sliderColor} ${(toPosition)/(rangeDistance)*100}%, 
    ${sliderColor} 100%)`;
}

function refreshSales() {
  console.log(`Refreshing sales fromSlider.value = ${fromSlider.value} and toSlider.value = ${toSlider.value}`)
  console.log(markerList[1].Market_Value);
  markers.removeLayers(markerList);
  console.log( markerList.filter((sale) => sale.Market_Value >= fromSlider.value && sale.Market_Value <= toSlider.value));
  markers.addLayers(
    markerList.filter((sale) => sale.Market_Value >= fromSlider.value && sale.Market_Value <= toSlider.value)
  );
}
//,
//

function setToggleAccessible(currentTarget) {
const toSlider = document.querySelector('#toSlider');
if (Number(currentTarget.value) <= 0 ) {
  toSlider.style.zIndex = 2;
} else {
  toSlider.style.zIndex = 0;
}
}

const fromSlider = document.querySelector('#fromSlider');
const toSlider = document.querySelector('#toSlider');
const fromInput = document.querySelector('#fromInput');
const toInput = document.querySelector('#toInput');
fillSlider(fromSlider, toSlider, '#C6C6C6', '#25daa5', toSlider);
setToggleAccessible(toSlider);

fromSlider.oninput = () => controlFromSlider(fromSlider, toSlider, fromInput);
toSlider.oninput = () => controlToSlider(fromSlider, toSlider, toInput);
fromInput.oninput = () => controlFromInput(fromSlider, fromInput, toInput, toSlider);
toInput.oninput = () => controlToInput(toSlider, fromInput, toInput, toSlider);