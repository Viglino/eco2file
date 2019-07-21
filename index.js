/* Force fullpage reload on module changes 
 * to prevent side effects on the map.
 */
if (module.hot) {
    module.hot.accept(function () {
      location.reload();
    });
  }
/* end of hot reload */
import 'babel-polyfill'

/* Polyfill for IE */
(function () {

  if ( typeof window.CustomEvent === "function" ) return false;

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

import './index.css'
import './src/jquery'

// Set preferences
import config from './src/config'
document.title = config.title;

// Create Map
import map from './src/map'
import './src/control/controls'
import './src/interaction/interactions'

// Menus
import './src/panel/menu'
import './src/dialog/dialogs'

/* DEBUG */
window.map = map;
/* */