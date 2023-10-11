const myApp = Object.create(null)

myApp.priceMin = 0;
myApp.priceMax = 6000000;
myApp.priceFrom = myApp.priceMin;
myApp.priceTo = myApp.priceMax;

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
};

if (document.readyState === "complete" ||
    (document.readyState !== "loading" && !document.documentElement.doScroll)
) {
  loaded();
} else {
  document.addEventListener("DOMContentLoaded", loaded);
}
// =========================================================

const GBPFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const landreg = await d3.csv("data/iom-land-registry-with-location.csv",
  function(d) {
    return {
      longaddress: d.longaddress,
      shortaddress: d.shortaddress,
      Acquisition_Date: new Date(d.Acquisition_Date),
      Completion_Date: new Date(d.Completion_Date),
      Consideration: Number(d.Consideration),
      Market_Value: Number(d.Market_Value),
      lat: Number(d.lat),
      lon: Number(d.lon)
    }
  }
);

myApp.dateMax = monthOnly(getMax(landreg,"Completion_Date"));
myApp.dateMin = monthOnly(getMin(landreg,"Completion_Date"));
myApp.dateFromNum = 0;
myApp.dateToNum = (myApp.dateMax.getFullYear()-myApp.dateMin.getFullYear())*12 + myApp.dateMax.getMonth() - myApp.dateMin.getMonth();


var markers = L.markerClusterGroup({ chunkedLoading: true,
                                      disableClusteringAtZoom: 16,
                                      spiderfyOnMaxZoom: false,
                                    zoomToBoundsOnClick: true });
var markerList = [];


landreg.forEach(makeSale);
markers.addLayers(markerList);
myApp.map.addLayer(markers);






function getMax(arr, prop) {
  var max;
  for (var i=0 ; i<arr.length ; i++) {
      if (max == null || arr[i][prop] > max)
          max = arr[i][prop];
  }
  return max;
}

function getMin(arr, prop) {
  var min;
  for (var i=0 ; i<arr.length ; i++) {
      if (min == null || arr[i][prop] < min)
          min = arr[i][prop];
  }
  return min;
}

function monthOnly(date) {
  return new Date(date.getFullYear(),date.getMonth())
}

function addMonths(date, months) {
  var d = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() != d) {
    date.setDate(0);
  }
  return date;
}

function makeSale(sale) {
  sale["marker"] = L.marker([sale.lat, sale.lon]);
  var priceString = GBPFormatter.format(sale.Market_Value);
  if (sale.Consideration != sale.Market_Value){
    priceString += " (paid "+ GBPFormatter.format(sale.Consideration)+")";
  }
  sale.marker.Market_Value = sale.Market_Value;
  sale.marker.Completion_Date = sale.Completion_Date;
  sale.marker.bindPopup(
    sale.longaddress + "<br>" + (new Date(sale.Acquisition_Date)).toLocaleDateString("en-GB")+": "+priceString
  );
  markerList.push(sale.marker);
}

// FOR THE SLIDERS

function updateDateFrom(newDateFromNum) {
  myApp.dateFromNum = Math.min(newDateFromNum,myApp.dateToNum);
  updateDates();
}

function updateDateTo(newDateToNum) {
  myApp.dateToNum = Math.max(newDateToNum,myApp.dateFromNum);
  updateDates();
}

function updateDateSlider(slider,dateNum) {
  slider.value = dateNum;
}
function updateDateLabel(label,date) {
  label.innerHTML = formatStringDate(date);
}

function updateDates() {
  updateDateSlider(dateSliderFrom,myApp.dateFromNum);
  updateDateLabel(dateLabelFrom,getDateFrom());
  updateDateSlider(dateSliderTo,myApp.dateToNum);
  updateDateLabel(dateLabelTo,getDateTo());
  fillSlider(dateSliderFrom, dateSliderTo, '#C6C6C6', '#25daa5');
  //Set toSlider on top if price is zero
  if (myApp.dateToNum <= 0 ) {
    dateSliderTo.style.zIndex = 2;
  } else {
    dateSliderTo.style.zIndex = 0;
  }
  refreshSales();
}

function updatePriceFrom(newPriceFrom) {
  myApp.priceFrom = Math.min(newPriceFrom,myApp.priceTo);
  updatePrices();
}

function updatePriceTo(newPriceTo) {
  myApp.priceTo = Math.max(newPriceTo,myApp.priceFrom);
  updatePrices();
}

function updatePriceSlider(slider,price) {
  slider.value = price;
}
function updatePriceInput(input,price) {
  input.value = formatStringCurrency(price);
}
function updatePrices() {
  updatePriceSlider(priceSliderFrom,myApp.priceFrom);
  updatePriceInput(priceInputFrom,myApp.priceFrom);
  updatePriceSlider(priceSliderTo,myApp.priceTo);
  updatePriceInput(priceInputTo,myApp.priceTo);
  fillSlider(priceSliderFrom, priceSliderTo, '#C6C6C6', '#25daa5');
  //Set toSlider on top if price is zero
  if (myApp.priceTo <= 0 ) {
    priceSliderTo.style.zIndex = 2;
  } else {
    priceSliderTo.style.zIndex = 0;
  }
  refreshSales();
}

function fillSlider(from, to, sliderColor, rangeColor) {
  const rangeDistance = to.max-to.min;
  const fromPosition = from.value - to.min;
  const toPosition = to.value - to.min;
  to.style.background = `linear-gradient(
    to right,
    ${sliderColor} 0%,
    ${sliderColor} ${(fromPosition)/(rangeDistance)*100}%,
    ${rangeColor} ${(fromPosition)/(rangeDistance)*100}%,
    ${rangeColor} ${(toPosition)/(rangeDistance)*100}%, 
    ${sliderColor} ${(toPosition)/(rangeDistance)*100}%, 
    ${sliderColor} 100%)`;
}

function refreshSales() {
  markers.removeLayers(markerList);
  markers.addLayers(
    markerList.filter((sale) =>
      sale.Market_Value >= myApp.priceFrom &&
      sale.Market_Value <= myApp.priceTo &&
      sale.Completion_Date >= getDateFrom() &&
      sale.Completion_Date < addMonths(getDateTo(),1))
  );
}

const dateSliderFrom = document.querySelector("#dateSliderFrom");
const dateSliderTo = document.querySelector("#dateSliderTo");
const dateLabelFrom = document.querySelector("#dateLabelFrom");
const dateLabelTo = document.querySelector("#dateLabelTo");

[dateSliderFrom, dateSliderTo].forEach((x) => {
  x.max = myApp.dateToNum;
  x.min = myApp.dateFromNum;
});

const priceSliderFrom = document.querySelector('#priceSliderFrom');
const priceSliderTo = document.querySelector('#priceSliderTo');
const priceInputFrom = document.querySelector('#priceInputFrom');
const priceInputTo = document.querySelector('#priceInputTo');

updatePrices();
updateDates();

dateSliderFrom.oninput = () => updateDateFrom(dateSliderFrom.value);
dateSliderTo.oninput = () => updateDateTo(dateSliderTo.value);

priceSliderFrom.oninput = () => updatePriceFrom(priceSliderFrom.value);
priceSliderTo.oninput = () => updatePriceTo(priceSliderTo.value);
priceInputFrom.oninput = () => updatePriceFrom(currStringToValue(priceInputFrom.value));
priceInputTo.oninput = () => updatePriceTo(currStringToValue(priceInputTo.value));

document.querySelectorAll("input[data-type='currency']").forEach((i)=>{
  i.keyup = formatCurrency(i)
})

function formatNumber(n) {
// format number 1000000 to 1,234,567
return n.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function currStringToValue(currStr) {
  return parseInt(currStr.replace(/\D/g, ""),10)
}

function formatCurrency(input,blur) {
  // get input value
  var input_val = input.value;

  // don't validate empty input
  if (input_val === "") { return; }

  
  // original length
  var original_len = input_val.length;

  // initial caret position 
  var caret_pos = input.selectionStart;

  var output_val = formatStringCurrency(input_val,blur);

  // send updated string to input
  input.value = output_val;

  // put caret back in the right position
  var updated_len = output_val.length;
  caret_pos = updated_len - original_len + caret_pos;
  input.setSelectionRange(caret_pos, caret_pos);

}

function formatStringDate(date) {
  return date.toLocaleDateString('en-gb', {  year:"numeric", month:"long"})
}

function getDateFrom() {
  return addMonths(new Date(myApp.dateMin),myApp.dateFromNum)
}
function getDateTo() {
  return addMonths(new Date(myApp.dateMin),myApp.dateToNum)
}
function formatStringCurrency(input_val, blur) {
  // appends $ to value, validates decimal side
  // and puts cursor back in right position.
  
  input_val = input_val.toString()
  // check for decimal
  if (input_val.indexOf(".") >= 0) {

    // get position of first decimal
    // this prevents multiple decimals from
    // being entered
    var decimal_pos = input_val.indexOf(".");

    // split number by decimal point
    var left_side = input_val.substring(0, decimal_pos);
    var right_side = input_val.substring(decimal_pos);

    // add commas to left side of number
    left_side = formatNumber(left_side);

    // validate right side
    right_side = formatNumber(right_side);
    
    // On blur make sure 2 numbers after decimal
    if (blur === "blur") {
      right_side += "00";
    }
    
    // Limit decimal to only 2 digits
    right_side = right_side.substring(0, 2);

    // join number by .
    input_val = "£" + left_side + "." + right_side;

  } else {
    // no decimal entered
    // add commas to number
    // remove all non-digits
    input_val = formatNumber(input_val);
    input_val = "£" + input_val;
    
    // final formatting
    if (blur === "blur") {
      input_val += ".00";
    }
  }

  return input_val;

}
