import map from '../map'
import FileSaver from 'file-saver'
import Button from 'ol-ext/control/Button'
import page from '../panel/menu'
import GeoJSON from 'ol/format/GeoJSON'
import { toLonLat } from 'ol/proj'
import { unparse } from 'papaparse';
import {vector} from '../map'
import storage from './storage'

// Current form
const form = $('#menu .dialog.download form');


let valdef = storage.load();
if (valdef) {
  $(".attribut", form).val(valdef.attribut);
}

// Download map
function download (type) {
  const features = vector.getSource().getFeatures();
  if (!features.length) return;

  let file = '';

  switch (type) {
    case 'geojson': {
      file = (new GeoJSON()).writeFeatures(features, { featureProjection:'EPSG:3857', dataProjection:'EPSG:4326' })
      break;
    }
    case 'csv':
    default: {
      let prop = Object.keys(features[0].getProperties());
      if (valdef.attribut) {
        prop = valdef.attribut.split(',');
        prop.push('geometry');
      }
      const csv = [];
      features.forEach((f) => {
        const item = [];
        prop.forEach ((p) => {
          if (p==='geometry') {
            const c = toLonLat(f.getGeometry().getCoordinates());
            item.push(Math.round(c[0]*100000000)/100000000);
            item.push(Math.round(c[1]*100000000)/100000000);
          } else {
            item.push(f.get(p));
          }
        });
        csv.push(item);
      });
      let cols = [];
      prop.forEach ((p) => {
        if (p==='geometry') {
          cols.push('lon');
          cols.push('lat');
        } else {
          cols.push(p);
        }
      });
      csv.unshift(cols);
      file = unparse(csv, { delimiter: ';' });
      break;
    }
  }

  // Export
  FileSaver.saveAs(
    new Blob([file],
    { type: "text/plain;charset=utf-8" }),
    'signalement.'+(type||'csv')
  );
}

//
$("input[type=button]", form).click(()=>{
  valdef.attribut = $(".attribut", form).val();
  storage.save(valdef);
  page.hide();
});

$(".csv", form).click(() => {
  download('csv');
});
$(".geojson", form).click(() => {
  download('geojson');
});

// Button
const dload = new Button ({
  className: 'download',
  html: '<i class="fa fa-download"></i>',
  handleClick: () => page.show('download')
});
map.addControl(dload);
