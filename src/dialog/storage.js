
let valdef = {
  login: '',
  attribut: '',
  limit: 100,
  groupe: '',
  valid: '',
  croquis: '',
};

let loaded = false;

// Gestion de valeurs par defaut
export default ({
  load: function() {
    if (!loaded) {
      // Load valdef 
      let vals = localStorage.getItem('Eco2xxx@params');
      if (vals) {
        try {
          valdef = JSON.parse(vals);
        } catch(e) {}
      }
      loaded = true;
    }
    return valdef
  }, 
  save (vals) {
    localStorage.setItem('Eco2xxx@params', JSON.stringify($.extend(valdef,vals)));
  }
})