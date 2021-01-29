/** Create a default map
 */
import 'ol/ol.css';
import 'ol-ext/dist/ol-ext.css';
import 'ol-ext/dist/ol-ext.min.css'
import './map.css'

import {Map,View} from 'ol'
import {defaults as defaultControls} from 'ol/control.js';
import {defaults as defaultInteractions} from 'ol/interaction.js';
import Permalink from 'ol-ext/control/Permalink'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import Style from 'ol/style/Style'
import Circle from 'ol/style/Circle'
import Stroke from 'ol/style/Stroke'
import Fill from 'ol/style/Fill'

// New map
$('<div>').attr('id','map').appendTo('body');

const map = new Map({
  target: 'map',
  view: new View({
    center: [273746, 5850095],
    zoom: 7
  }),
  interactions: defaultInteractions({
    altShiftDragRotate:false, 
    pinchRotate:false
  }),
  controls: defaultControls().extend([
    new Permalink()
  ])
});

// Add Geoportail layers 
import config from './config'
import TileLayer from 'ol/layer/Tile';
import XYZSource from 'ol/source/XYZ';

import logoign from '../img/ign.png'
import logogeo from '../img/geo.jpg'

// Create layer
function createLayer(options) {
  return new TileLayer({
    name: options.name,
    source: new XYZSource({
      maxZoom: options.maxZoom || 18,
      url: 
        'https://wxs.ign.fr/' + config.apiKey + '/geoportail/wmts?' +
        'layer=' + options.layer +
        '&style='+ (options.style || 'normal')+
        '&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0'+
        '&Format=image%2F' + (options.format || 'jpeg') +
        '&TileMatrix={z}&TileCol={x}}&TileRow={y}',
      attributions: '<a href="https://www.geoportail.gouv.fr/carte"><img src="'+logoign+'"/><img src="'+logogeo+'"/></a>'
    })
  });
}

const layers = {
  photo: createLayer ({
    name: 'Photographies aériennes', 
    layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
    maxZoom: 20
  }),
  map: createLayer ({
    name: 'Carte IGN', 
    layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
    format: 'png'
  })
};

layers.photo.setVisible(false);

for (let i in layers) {
  map.addLayer(layers[i]);
};

// Add vector source
const vector = new VectorLayer({
  name:"Signalements",
  source: new VectorSource(),
  style: new Style ({
    image: new Circle({ 
      radius: 5,
      stroke: new Stroke ({ width: 1.5, color: '#fff' }),
      fill: new Fill ({ color: '#f00' })
    })
  })
});
map.addLayer(vector);

/* DEBUG */
window.vector = vector;
window.source = vector.getSource();
/* */

export {vector}

export default map