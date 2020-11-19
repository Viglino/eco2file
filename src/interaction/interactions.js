import map from '../map'
import Select from 'ol/interaction/Select'
import Popup from 'ol-ext/overlay/Popup'
import {click} from 'ol/events/condition'

const popup = new Popup({	
  popupClass: "default", //"tooltips", "warning" "black" "default", "tips", "shadow",
  closeBox: true,
  positioning: 'bottom-center',
  autoPan: true,
  autoPanAnimation: { duration: 250 }
});
map.addOverlay(popup);

const select = new Select({
  hitTolerance: 5,
  condition: click
});

select.on('select', (e) => {
  const f = e.selected[0]
  if (f) {
    let info = '';
    for (let i in f.getProperties()) {
      if (i!=='geometry') {
        info += (info ? '<br/>' : '') + '* '+i+': '+f.get(i);
      }
    }
    popup.show(
      f.getGeometry().getFirstCoordinate(), 
      info
    );
  } else {
    popup.hide();
  }
});

map.addInteraction(select);

/* Clear selection */
export default () => {
  select.getFeatures().clear();
  popup.hide();
}
