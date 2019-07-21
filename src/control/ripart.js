﻿import ol_geom_Point from 'ol/geom/Point'
import ol_geom_LineString from 'ol/geom/LineString'
import ol_geom_Polygon from 'ol/geom/Polygon'
import ol_Feature from 'ol/Feature'
import {transform as ol_proj_transform} from 'ol/proj'

/** Recuperation des signalements de l'espace collaboratif.
@constructor
*/
var RIPart = function(options)
{	options = options || {};
	// 
	var secret = "Espace Collaboratif IGN";
	// Url du service
	var url = options.url || "https://espacecollaboratif.ign.fr/api/";
	var user, pwd;
	this.param = {};

	/** Changement de l'url du service
	* @param {String} url du service
	*/
	this.setServiceUrl = function(u)
	{	url = u;
	};

	/** Recupere l'url du service
	* @return {String} url du service
	*/
	this.getServiceUrl = function()
	{	return url;
	};
	
	/** Changement d'utilisateur
	* @param {String} user user name
	* @param {String} password user pwd
	* @param {boolean} crypt encrypt password or not
	*/
	this.setUser = function(u, p, cryp)
	{	user = u;
		pwd = p;
	};
	this.setUser (options.user, options.pwd, true);

	/** Get the user name or pass
	 * @param {boolean} b tru to get the pass
	 */
	this.getUser = function(b)
	{	if (b) return pwd;
		else return user;
	};

	/* Decode l'erreur */
	function responseError (d)
	{	var error = d.find("REPONSE ERREUR");
		var status = error.attr("code");
		// console.log(status+" : "+error.text())
		return ( status=="OK" ? false : { error:true, status: status, statusText: error.text() } );
	}

	/* Attributs a decoder */
	var georemAttr = { id:"ID_GEOREM", autorisation:"AUTORISATION", url:"LIEN", source:"SOURCE", version:"VERSION",
		date:"DATE", valid:"DATE_VALID", maj:"MAJ", 
		lon:"LON", lat:"LAT", statut:"STATUT",
		id_dep:"ID_DEP", dep:"DEPARTEMENT", commune:"COMMUNE", comment:"COMMENTAIRE", 
		auteur:"AUTEUR", id_auteur:"ID_AUTEUR", groupe:"GROUPE", id_groupe:"ID_GEOGROUPE",
		doc:"DOC" };
	var themeAttr = { groupe:"ID_GEOGROUPE", nom:"NOM" };
	var georepAttr = { id:"ID_GEOREP", auteur:"AUTEUR", id_auteur:"ID_AUTEUR", 
		titre:"TITRE", date:"DATE", statut:"STATUT", comment:"REPONSE" };

	/* Formater les attributs en texte (pour affichage)
	* @param {Object} vals a list of key/values
	* @return {string} formated attributes
	*/
	var formatAttributString = this.formatAttributString = function(vals)
	{	var v = "";
		if (vals) for (var i in vals)
		{	if (vals[i] || vals[i]===false) v += i+": "+(vals[i]===false ? "0" : (vals[i]===true ? "1":vals[i]))+"\n"
		}
		return v;
	};

	/** Get a georem 
	 * @param {XMLNode} rem signalement (XML) a decoder
	 * @param {any} options 
	 * 	@param {boolean} options.croquis extraire les croquis
	 * @return {} le signalement en json
	 */
	function getGeorem (rem, options)
	{	var r = {};
		for (var i in georemAttr)
		{	r[i] = rem.find("> "+georemAttr[i]).first().text();
		}
		r.lon = Number(r.lon);
		r.lat = Number(r.lat);
		r.croquis = rem.find('CROQUIS');
		if (options && options.croquis) r.croquis = r.croquis.html();
		else r.croquis = (r.croquis.length>0);
		r.themes = [];
		r.attText="";
		rem.find("THEME").each(function()
		{	var th = {};
			th.nom = $(this).find("NOM").text();
			th.id_groupe = $(this).find("ID_GEOGROUPE").text();
			th.groupe = $(this).attr("groupe");
			var attribut = {};
			var nb = 0;
			$(this).find("ATTRIBUT").each(function()
			{	attribut[$(this).attr('nom')] = $(this).text();
				nb++;
			});
			if (nb) th.attribut = attribut;
			r.attText += formatAttributString(attribut);
			r.themes.push(th);
		});
		r.rep = [];
		rem.find("GEOREP").each(function()
		{	var rep = {};
			for (var i in georepAttr)
			{	rep[i] = $(this).find(georepAttr[i]).first().text();
			}
			r.rep.push(rep);
		});
		//console.log(r);
		return r;
	};

	/* Requete sur l'espace collaboratif
	* @param {String} action a realiser
	* @param {Object} liste des parametres a envoyer lors de l'action
	* @param {function} fonction de decodage xml => json
	* @param {function} callback (response, error)
	*/
	function sendRequest (action, options, decode, cback)
	{	if (!user || !pwd) 
		{	if (cback) cback(null, { error:true, status: 401, statusText: "Unauthorized" });
			return false;
		}
		var format = options.format || 'xml';
		delete options.format;

		// Transfert OK
		function win (resp)
		{	var r={};
			var error;
			if (format === "xml")
			{	error = responseError($(resp));
				if (!error) r = decode($(resp));
			}
			else
			{	r = resp;
			}
			// Callback
			if (cback) cback(r,error);
			else console.log(r);
		};
		// Ooops
		function fail (resp)
		{	// Callback
			if (cback) cback( null, { error: true, status: resp.status, statusText: resp.statusText });
			else console.log("ERROR: "+resp.status);
		};

		// Envoyer avec fichier joint (via FileTransfer)
		if (options.photo)
		{	CordovApp.File.getFile(options.photo,
				function(fileEntry)
				{	// Options
					var trOptions = new FileUploadOptions();
					trOptions.fileKey = "file-0";
					trOptions.fileName = "image_"+new Date().getTime()+".jpg";
					delete options.photo;
					trOptions.params = options;
					// Authentification
					var hash = btoa(user+":"+pwd);
					trOptions.headers = { 'Authorization': "Basic "+hash };
					// Transfert
					var ft = new FileTransfer();
					ft.upload
					(	fileEntry.toURL(), 
						url+"georem/"+action+".xml", 
						function(r)
						{	win(r.response); 
						},
						function(r)
						{	r.status = r.http_status;
							if (r.status == 401)
							{	r.statusText = "Unauthenticated"; 
							}
							else 
							{	switch (r.code)
								{	case FileTransferError.FILE_NOT_FOUND_ERR: 
										r.statusText = "File not found"; 
										break;
									case FileTransferError.INVALID_URL_ERR: 
										r.statusText = "Invalid URL"; 
										break;
									case FileTransferError.CONNECTION_ERR: 
										r.statusText = "Connection error"; 
										break;
									case FileTransferError.ABORT_ERR: 
										r.statusText = "Operation aborted"; 
										break;
									case FileTransferError.NOT_MODIFIED_ERR: 
										r.statusText = "Not modified"; 
										break;
									default: 
										r.statusText = "Unknown error"; 
										break;
								}
							}
							fail(r);
						},
						trOptions
					);		
				},
				function() 
				{	fail({ status:0, statusText: "File not found" });
				}
			);
		}
		// Sans fichier joint
		else
		{	$.ajax
			({	type: /post/.test(action) ? "POST" : "GET",
				url: url+"georem/"+action+"."+(format || "xml"),
				dataType: (format || "xml"),
				cache: false,
				// Bug with user/pwd in Android 4.1
				beforeSend: function(xhr){ xhr.setRequestHeader("Authorization", "Basic " + btoa(user + ":" + pwd)); },
				/*
				username: user,
				password: pwd,
				statusCode: 
				{	401: function (data) 
					{	// alert('401: Unauthenticated');
					}
				},
				*/
				data: options,
				success: win,
				error: fail,
				timeout: 30000
			});
		}
		return true;
	}

	/** Recuperer les info de l'utilisateur connecte
	* @param {function} callback function (response, error)
	*/
	this.getUserInfo = function (cback)
	{	// Decodage de la reponse
		function decode(resp)
		{	var r = {};
			r.auteur =
				{	nom: resp.find("AUTEUR NOM").text(),
					statut: resp.find("AUTEUR STATUTXT").text()
				};
			r.profil = 
				{	id: Number(resp.find("PROFIL ID_GEOPROFIL").text()),
					titre: resp.find("PROFIL TITRE").text(),
					id_groupe: Number(resp.find("PROFIL ID_GEOGROUPE").text()),
					groupe: resp.find("PROFIL GROUPE").text(),
					logo: resp.find("PROFIL LOGO").text(),
					filtre: resp.find("PROFIL FILTRE").text()
				};
			r.groupes = [];
			resp.find("GEOGROUPE").each(function()
			{	var att = $(this);
				var filter = [];
				try
				{	filter = JSON.parse(att.find("FILTER").first().text());
				} catch(e){};
				var g = 
				{	nom: att.find("NOM").first().text(),
					id_groupe: Number(att.find("ID_GEOGROUPE").text()),
					global: (att.find("STATUS").first().text() == "global"),
					status: att.find("STATUS").first().text(),
					//filter: filter,
					logo: att.find("LOGO").text(),
					lonlat: [ Number(att.find("LON").text()), Number(att.find("LAT").text()) ],
					filter: att.find("FILTER").last().text(),
					layers:[]
				};
				att.find("LAYER").each(function()
				{	g.layers.push(
					{	nom: $(this).find("NOM").text(),
						type: $(this).find("TYPE").text(),
						description: $(this).find("DESCRIPTION").text(),
						url: $(this).find("URL").text()
					});
				});
				var th={attributs: []}
				var att, themes = [];
				$(this).find("THEMES >").each(function()
				{	switch ($(this).prop("tagName"))
					{	case "THEME":
							th = {
								nom: $(this).find('NOM').text(),
								id_groupe: g.id_groupe,
								global: ($(this).find('GLOBAL') == 1),
								aide: $(this).find('AIDE').text(),
								attributs: []
							};
							themes.push(th);
							break;
						case "ATTRIBUT":
							att = {
								nom: $(this).find('NOM').text(),
								att: $(this).find('ATT').text(),
								type: $(this).find('TYPE').text(),
								val: []
							};
							$(this).find('VAL').each(function()
							{	att.val.push($(this).text());
							});
							switch(att.type)
							{	case 'list': 
								break;
								case 'checkbox':
									att.val = (att.val[0] == 1);
								break;
								default:
									att.val = att.val[0];
								break;
							}
							th.attributs.push(att);
							break;
						default: break;
					}
				});
				g.themes = themes;
				r.groupes.push(g);
			});
			r.themes = [];
			var t, th = {};
			var themes = resp.find("THEMES").first();
			themes.find("THEME").each(function()
			{	var att = $(this);
				t = 
				{	nom: att.find("NOM").text(),
					id_groupe: Number(att.find("ID_GEOGROUPE").text()),
					attributs: []
				};
				r.themes.push(t);
				th[t.id_groupe+":"+t.nom] = t;
			});
			themes.find("ATTRIBUT").each(function()
			{	var att = $(this);
				var vals = att.find("VAL");
				for (var i=0; i<vals.length; i++) vals[i] = $(vals[i]).text();
				var id = att.find("ID_GEOGROUPE").text()+":"+att.find("NOM").text();
				if (th[id]) th[id].attributs.push(
					{	att: att.find("ATT").text(),
						type: att.find("TYPE").text(),
						val: vals
					});
			});
			return r;
		}

		// Demander au serveur
		return sendRequest ("geoaut_get", {}, decode, cback);
		/*
		return sendRequest ("geoaut_get", {}, decode, function(auth, error)
		{	if (error) cback(auth, error); 
			else
			{	sendRequest ("geoaut_get", { format:'json' }, null, function(resp) 
				{	console.log(auth, resp);
					cback(auth);
				});
			}
		});
		*/
	};

	/** Recuperer les info d'un signalement
	* @param {String} id du signalement
	* @param {function} callback function (response, error)
	* @param {any} options 
	* 	@param {boolean} options.croquis extraire les croquis
	*/
	this.getGeorem = function (id, cback, options)
	{	// Decodage de la reponse
		function decode(resp)
		{	return getGeorem (resp.find("GEOREM"), options);
		}
		// Demander au serveur
		return sendRequest ("georem_get/"+id, {}, decode, cback);
	};

	/** Recuperer un ensemble des signalements
	* @param {Object} params de la requete { offset, limit, territory, departement, group, status, box, ... }
	* 	@param {boolean} params.croquis extraire les croquis
	* @param {function} callback function (response, error)
	*/
	this.getGeorems = function (params, cback)
	{	if (!params) params = {};
		var croquis = params.croquis;
		delete params.croquis;
		// Decodage de la reponse
		function decode(resp)
		{	var r = [];
			resp.find("GEOREM").each(function()
			{	r.push (getGeorem($(this), { croquis: croquis }));
			});
			return r;
		}
		// Demander au serveur
		return sendRequest ("georems_get", params, decode, cback);
	};

	/** Envoyer un signalement
	* @param {Object} list des parametres a envoyer { comment, geometry, lon,lat, territory, attributes, sketch, features, proj, insee, protocol, version, photo }
	* @param {function} callback function (response, error)
	*/
	this.postGeorem = function (params, cback)
	{	// Bad command
		if (!params || !params.comment) return false;
		if (!params.hasOwnProperty('geometry') && (!params.hasOwnProperty('lon') || !params.hasOwnProperty('lat'))) return false;
		// Post parameters
		var post = 
		{	comment: params.comment,
			geometry: params.geometry || "POINT("+params.lon+" "+params.lat+")",
			territory: params.territory || "FXX",
		};
		// Optional attributes
		if (params.sketch) post.sketch = params.sketch;
		else if (params.features)
		{	post.sketch = this.feature2sketch(params.features, params.proj);
		}
		if (params.id_groupe>0) post.group = params.id_groupe;
		if (params.themes)
		{	post.attributes = params.themes;
			if (params.attributes) post.attributes += params.attributes;
		}
		if (params.insee) post.insee = params.insee;
		if (params.protocol) post.protocol = params.protocol;
		if (params.version) post.version = params.version;
		if (params.photo) post.photo = params.photo;
		// Decode response
		function decode(resp)
		{	return getGeorem (resp.find("GEOREM"));
		}
		// Send request
		return sendRequest ("georem_post", post, decode, cback);
	};


	/** Write feature(s) to sketch
	* @param {String} the sketch
	* @param {ol.proj.ProjectionLike} projection of the features, default EPSG:3857
	* @return {Array<ol.feature>} the feature(s)
	*/
	this.sketch2feature = function(sketch , proj)
	{	var features = [];
		sketch = "<CROQUIS>"+sketch+"</CROQUIS>";
		var xml = $.parseXML(sketch.replace(/gml:|xmlns:/g,""));
		var objects = $(xml).find("objet");
		for (var i=0, f; f=objects[i]; i++)
		{	var atts = $(f).find("attribut");
			var prop = {};
			for (var j=0, a; a=atts[j]; j++)
			{	prop[$(a).attr("name")] = $(a).text();
			}
			var g = $(f).find("coordinates").text().split(" ");
			for (var k=0; k<g.length; k++)
			{	g[k] = g[k].split(',');
				g[k][0] = Number(g[k][0]);
				g[k][1] = Number(g[k][1]);
			}
			switch ($(f).attr('type'))
			{	case "Point":
				case "Texte":
					prop.geometry = new ol_geom_Point(g[0]);
				break;
				case "LineString":
				case "Ligne":
					prop.geometry = new ol_geom_LineString(g);
				break;
				case "Polygon":
				case "Polygone":
					prop.geometry = new ol_geom_Polygon([g]);
				break;
				default: continue;
			}
			prop.geometry.transform("EPSG:4326", proj||"EPSG:3857")
			features.push (new ol_Feature(prop));
		}
		return features;
	};
	
	/** Write feature(s) to sketch
	* @param {ol.feature|Array<ol.feature>} the feature(s) to write
	* @param {ol.proj.ProjectionLike} projection of the features
	* @return {String} the sketch
	*/
	this.feature2sketch = function(f , proj)
	{	if (!f) return "";
		if (!(f instanceof Array)) f = [f];
		var croquis = "";
		var symb = "<symbole><graphicName>circle</graphicName><diam>2</diam><frontcolor>#FFAA00;1</frontcolor><backcolor>#FFAA00;0.5</backcolor></symbole>";
		var pt = f[0].getGeometry().getFirstCoordinate();
		if (proj)
		{	pt = ol_proj_transform(pt, proj, 'EPSG:4326')
		}
		croquis += "<contexte><lon>"+pt[0].toFixed(7)+"</lon><lat>"+pt[1].toFixed(7)+"</lat><zoom>15</zoom><layers><layer>GEOGRAPHICALGRIDSYSTEMS.MAPS</layer></layers></contexte>";
		//var format = new ol.format.GML({ featureNS:'', featurePrefix: 'gml', extractAttributes: false });
		for (var i=0; i<f.length; i++)
		{	var t=""; 
			var geo="", g = f[i].getGeometry().clone();
			if (proj)
			{	g.transform(proj, 'EPSG:4326');
				g = g.getCoordinates();
			}
			// Geometry
			switch (f[i].getGeometry().getType())
			{	case 'Point': 
					t = 'Point'; 
					g = [g];
					geo = "<geometrie><gml:Point><gml:coordinates>COORDS</gml:coordinates></gml:Point></geometrie>";
					break;
				case 'LineString': 
					t = 'Ligne'; 
					geo = "<geometrie><gml:LineString><gml:coordinates>COORDS</gml:coordinates></gml:LineString></geometrie>";
					break;
				case 'MultiPolygon': 
					g = g[0];
				case 'Polygon': 
					t = 'Polygone'; 
					g = g[0];
					geo = "<geometrie><gml:Polygon><gml:outerBoundaryIs><gml:LinearRing><gml:coordinates>COORDS</gml:coordinates></gml:LinearRing></gml:outerBoundaryIs></gml:Polygon></geometrie>";
					break;
			}
			// Attributes
			var att = f[i].getProperties();
			var attr = "";
			delete att.geometry;
			for (a  in att) 
			{	attr += '<attribut name="'+a.replace('"',"_")+'">'
					+ String(att[a]).replace(/\&/g,"&amp;").replace(/</g,"&inf;").replace(/>/g,"&sup;") 
					+'</attribut>';
			}
			attr = "<attributs>"+attr+"</attributs>";
			// Write!
			if (t)
			{	var coords="";
				for (var k=0; k<g.length; k++) coords += (k>0?" ":"") + g[k][0].toFixed(7) +","+ g[k][1].toFixed(7);
				croquis += "<objet type='"+t+"'><nom></nom>" + symb + attr + geo.replace('COORDS', coords) + "</objet>";
			}
		}
		croquis = "<CROQUIS xmlns:gml='http://www.opengis.net/gml' version='1.0'>"+croquis+"</CROQUIS>";
		return croquis;
	};

	/** Save connection parameters to localstorage
	*/
	this.saveParam = function()
	{	var pwd = this.param.pwd;
		if (!window.cordova) delete this.param.pwd;
		localStorage['WebApp@ripart'] = JSON.stringify(this.param);
		this.param.pwd = pwd;
		this.onUpdate();
	};

	if (localStorage['WebApp@ripart']) this.param = JSON.parse(localStorage['WebApp@ripart']);
	else this.param = { georems:[], nbrem:0 };

	this.initialize(options);
};

/** Initialize function 
* @api
*/
RIPart.prototype.initialize = function(options) {};

/** Samething has changed
* @api
*/
RIPart.prototype.onUpdate = function() {};

export default RIPart