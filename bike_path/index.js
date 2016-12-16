
var mapboxAccessToken = 'pk.eyJ1IjoicG1hY2siLCJhIjoiY2l0cTJkN3N3MDA4ZTJvbnhoeG12MDM5ZyJ9.ISJHx3VHMvhQade2UQAIZg';
var map = L.map('map').setView([41.8781, -87.6298], 14);
// default radius is 500 meters
var userRadius = 500;


L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken, {
    id: 'mapbox.light',
}).addTo(map);

// load node information from plenario
var nodes = new Array();

function node(name,coordinates,sensors)
{
   this.name=name;
   this.coordinates=coordinates;
   this.sensors=sensors;
};

$.ajax({
  type: 'GET',
  url: "http://plenar.io/v1/api/sensor-networks/plenario_development/nodes/",
  async: false,
  dataType: 'json',
  success: function (data) {
    var json_data = data.data;
    for (var i = 0; i < json_data.length; i++) {
    var node = json_data[i];
    var each = {name:node.properties.id, coordinates:node.geometry.coordinates, sensors:node.properties.sensors};
    nodes.push(each);
}
  }
});

// add nodes as markers to map. Flip coordinates for leaflet marker object
for (var i = 0; i < nodes.length; i++) {
var node = nodes[i];
var marker = L.marker([node.coordinates[1], node.coordinates[0]]).addTo(map);
marker.bindPopup('<b>' + node.name + '</b>' ).openPopup();

}


// Create slider to allow users to dynamically adjust buffer of node
$( function() {
  $( "#slider" ).slider({
    orientation: "vertical",
    range: "min",
    min: 100,
    max: 1000,
    value: 500,
    slide: function( event, ui ) {
      $( "#amount" ).val( ui.value );
      userRadius = Number($( "#amount" ).val());
      sensor1 = turf.circle(center1, userRadius, steps, units);
    }
  });

  $( "#amount" ).val( $( "#slider" ).slider( "value" ) );
} );


// add draw interface for route
var drawnItems = new L.LayerGroup();
L.drawLocal.draw.toolbar.buttons.polyline = 'Draw your route!';

     map.addLayer(drawnItems);
     var drawControl = new L.Control.Draw({
         position: 'topright',
         draw: {
          circle: false,
          rectangle: false,
          marker: false,
          polygon: false,
          polyline: {
           shapeOptions: {
            color: 'steelblue'
           },
          },
         },
     });
     map.addControl(drawControl);

    var route_geojson;
    map.on("draw:created", function (e) {
      if (drawnItems.getLayers().length > 0){
        drawnItems.clearLayers();

        };

      var type = e.layerType,
         route = e.layer;

      drawnItems.addLayer(route);
      route_geojson = route.toGeoJSON();
      $('#calculate').removeAttr("disabled");
      $('#deleteRoute').removeAttr("disabled");
});

document.getElementById("deleteRoute").onclick = function () {
  drawnItems.clearLayers();
  $('#calculate').attr("disabled","disabled");
  $('#deleteRoute').attr("disabled","disabled");
 };

 document.getElementById("calculate").onclick = function () {
   var small_polygon_route = turf.buffer(route_geojson, 0.001, 'kilometers');
   for (var i = 0; i < nodes.length; i++) {
     var node = nodes[i];
     var coordinates = node.coordinates;
     var node_center = {
       "type": "Feature",
       "properties": {
         "marker-color": "#0f0"
       },
       "geometry": {
         "type": "Point",
         "coordinates": coordinates
       }
     };

     var steps = 10;
     var units = 'meters';

     var node_circle = turf.circle(node_center, userRadius, steps, units);


     var intersection = turf.intersect(small_polygon_route, node_circle);
     if (intersection == null){
      //  console.log(node.name)
      //  console.log("no intersect")
       node.intersect = false;
     }
     else{
      //  console.log(node.name)
      //  console.log("intersection")
       node.intersects = true;
     }


  };

  var end = new Date()
  // take date as of 10 minutes ago for start date query
  var diff = -10;
  var start = new Date(end.getTime() + diff*60000);

  var start_string = start.getUTCFullYear().toString() + "-" + start.getUTCMonth().toString() + "-" + start.getUTCDate().toString() + "T" + start.getUTCHours().toString() + ":" + start.getUTCMinutes().toString();
  var end_string = end.getUTCFullYear().toString() + "-" + end.getUTCMonth().toString() + "-" + end.getUTCDate().toString() + "T" + end.getUTCHours().toString() + ":" + end.getUTCMinutes().toString();
  for (var i = 0; i < nodes.length; i++) {
    var node_name_string = nodes[i].name.toString()
    console.log(node_name_string)


  var request_url =  "http://plenar.io/v1/api/sensor-networks/plenario_development/query?feature=temperature&nodes=" + node_name_string + "&limit=3&start_datetime=" + start_string + "&end_datetime=" + end_string;
  $.ajax({
    type: 'GET',
    url: request_url,
    async: false,
    dataType: 'json',
    success: function (data) {
      var response = data.data;
      var i = response.length - 1
      var last = response[i]
      var temp = last['results'].temperature

    }
  });
  };


};
