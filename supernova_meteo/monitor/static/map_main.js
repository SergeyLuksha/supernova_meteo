import Map from './ol/Map.js';
import OSM from './ol/source/OSM.js';
import Overlay from './ol/Overlay.js';
import TileLayer from './ol/layer/Tile.js';
import View from './ol/View.js';
import {fromLonLat, toLonLat} from './ol/proj.js';
import {toStringHDMS} from './ol/coordinate.js';

const layer = new TileLayer({
  source: new OSM(),
});
//Среднее по координатам
    var aver_lon = 0;
    var aver_lat = 0;
    var amount = 0;
    for(var x in data){
    aver_lon += Number(data[x][0]);
    aver_lat += Number(data[x][1]);
    amount += 1;
    }
    aver_lon = aver_lon / amount;
    aver_lat = aver_lat / amount;

const map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    center: fromLonLat([aver_lon, aver_lat]),
    zoom: 10,
  }),
});
    for(var x in data){
      console.log(data[x][0]);
      console.log(data[x][1]);
      var number = Number(x) + 1
      console.log('marker_'+number);
      const pos = fromLonLat([data[x][0], data[x][1]]);
//const pos = fromLonLat([48.208889, 48.208889]);
// Popup showing the position the user clicked
//const popup = new Overlay({
//  element: document.getElementById('popup'),
//});
//map.addOverlay(popup);

// Vienna marker
const marker = new Overlay({
  position: pos,
  positioning: 'center-center',
  element: document.getElementById('marker_'+number),
  stopEvent: false,
});
map.addOverlay(marker);

// Vienna label
const vienna = new Overlay({
  position: pos,
  element: document.getElementById('text_'+number),
});
map.addOverlay(vienna);
    }




//const element = popup.getElement();
//map.on('click', function (evt) {
//  const coordinate = evt.coordinate;
//  const hdms = toStringHDMS(toLonLat(coordinate));
//  popup.setPosition(coordinate);
//  let popover = bootstrap.Popover.getInstance(element);
//  if (popover) {
//    popover.dispose();
//  }
//  popover = new bootstrap.Popover(element, {
//    animation: false,
//    container: element,
//    content: '<p>The location you clicked was:</p><code>' + hdms + '</code>',
//    html: true,
//    placement: 'top',
//    title: 'Welcome to OpenLayers',
//  });
//  popover.show();
//});
