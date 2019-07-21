import './controls.css'
import './layerswitcher.css'
import map from '../map'
import SearchBAN from 'ol-ext/control/SearchBAN'
import Switcher from 'ol-ext/control/LayerSwitcher'

const search = new SearchBAN ();
map.addControl(search);
search.on('select', (e) => {
    map.getView().setCenter(e.coordinate);
});

const switcher = new Switcher ();
map.addControl(switcher);