import './upload.css'
import map from '../map'
import page from '../panel/menu'
import RIPart from '../control/ripart'
import ol_geom_Point from 'ol/geom/Point'
import ol_Feature from 'ol/Feature'
import {vector} from '../map'
import Button from 'ol-ext/control/Button'
import storage from './storage'

const form = $('#menu .dialog.upload form');
let valdef = storage.load();
if (valdef) {
  $(".login", form).val(valdef.login);
  $(".attribut", form).val(valdef.attribut);
  $(".limit", form).val(valdef.limit);
  $(".groupe", form).val(valdef.groupe);
  $(".valid", form).prop('checked', valdef.valid);
  $(".croquis", form).prop('checked', valdef.croquis);
}

// List des attributs a charger
const attributeList2 = ['id','dep','id_dep','commune',
  'comment','auteur','id_auteur','statut',
  'groupe','date', 'doc'];

  // Charger les donnees dans la carte
function loadCarte (ripart, r) {
  // console.log(r);
  var features = [];
  var p;
  for (var i=0, fi; fi=r[i]; i++) {
    p = new ol_geom_Point([fi.lon, fi.lat]);
    p.transform("EPSG:4326",map.getView().getProjection());
    var f = new ol_Feature(p);
    attributeList2.forEach((k) => {
      f.set(k, fi[k]);
    });
    f.set('doc', f.get('doc').replace(/[^0-9]*([0-9]*)$/,"$1"));
    var atts = fi.themes[0].attribut;
    if (atts) {
      for (var k in atts) {
        f.set(k, atts[k]);
      }
    }
    features.push(f);
    // Croquis
    if (fi.croquis) {
      //try{
      var tf = ripart.sketch2feature(fi.croquis);
      for (var k=0, f; f=tf[k]; k++) {
        f.set('auteur', "IGN");
        f.set('id_auteur', "..");
        if (f.getGeometry().getType()==='Point') {
          f.setIgnStyle({ 
            pointColor: "rgba(255, 153, 0, 0.38)",
            pointForm: "circle",
            pointGlyph: "ign-form-point",
            pointRadius: 8,
            pointStrokeColor: "rgb(255, 153, 0)",
            symbolColor: "rgba(255,255,255,0)"
          })
        }
        f.unset('empreinte');
        features.push(f);
      }
      //} catch (e){}
    }
  }

  // vector.getSource().clear();
  vector.getSource().addFeatures(features);
};

$(".cancel", form).click(()=>{
  page.hide();
});

// Go!
form.on('submit', function(e) {
  e.preventDefault();
  e.stopPropagation();
  const login = $('.login', form).val();
  const pwd = $('.pwd', form).val();

  const groupe = $(".groupe", form).val();
  const limit = $(".limit", form).val() || Infinity;
  const valid = $(".valid", form).prop('checked');
  const croquis = $(".croquis", form).prop('checked');

  storage.save({
    login: login,
    limit: limit,
    groupe: groupe,
    valid: valid,
    croquis: croquis,
  });

  const ripart = new RIPart({ user:login, pwd:pwd });
  
  var prop = { 
    offset: 0,
    limit: 20, 
    croquis: croquis
  };
  if (groupe) prop['groups[]'] = groupe;
  if (valid) prop.status = "valid";

  var nb = 0;
  $('body').addClass('loading');
  const progress = $('.wait .progress > div').width(0);
  function loadPart() {
    ripart.getGeorems(prop, 
      function(r) {
        if (!r) {
          $('body').removeClass('loading');
          alert ("Chargement impossible, vérifiez votre mot de passe...");
          return;
        };
        if (r.position > limit) {
          for (let i=limit; i<r.position; i++) r.georem.pop();
        }
        loadCarte(ripart, r.georem);
        progress.css ('width', Math.round(vector.getSource().getFeatures().length / Math.min(limit,r.total) * 100) +'%');
        // Load next
        if (r.position < limit && r.position < r.total) {
          loadPart();
        } else {
          // Finish
          page.hide();
          $('body').removeClass('loading');
          if (!vector.getSource().getFeatures().length) {
            alert ("Rien a charger...");
          } else {
            map.getView().fit(vector.getSource().getExtent());
          }
        }
      }
    );
    prop.offset += prop.limit;
  }
  vector.getSource().clear();
  loadPart();

});

const uload = new Button ({
  className: 'upload',
  html: '<i class="fa fa-cloud-upload"></i>',
  handleClick: () => page.show('upload')
});
map.addControl(uload);
