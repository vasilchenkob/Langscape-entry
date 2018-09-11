var map;
var llOffset;			//size of grid squares (in degrees)

var countryOff = 1.6;
var provinceOff = 0.2;
var cityOff = 0.007
var countryZoom = 4;
var provinceZoom = 8;
var cityZoom = 13;

var drawGridBox = true;
var gridline;
var polylinesquare;
var latPolylines = [];
var lngPolylines = [];
var bounds = new google.maps.LatLngBounds();

var gridSquares = [];

var infoWindow;


function init() {
	
	var markers = [];
   map = new google.maps.Map(document.getElementById('map'), {
     center: {
       lat: 40,
       lng: 30
     },
	 mapTypeControl: false,
	 streetViewControl: false,
     zoom: 4
   });
   		//map.setOptions({draggable: false});
		setllOffset(countryOff);
   
   		//Get user's location
		infoWindow = new google.maps.InfoWindow;
		if (navigator.geolocation) {
        	navigator.geolocation.getCurrentPosition(function(position) {
        		var pos = {
            	lat: position.coords.latitude,
            	lng: position.coords.longitude
          		};

            	infoWindow.setPosition(pos);
            	infoWindow.setContent('Location found.');
            	infoWindow.open(map);
            	map.setCenter(pos);
        	}, function() {
            	//handleLocationError(true, infoWindow, map.getCenter());
          	});
        } else {
          // Browser doesn't support Geolocation
          //handleLocationError(false, infoWindow, map.getCenter());
        }


	//location search
   var searchBox = new google.maps.places.SearchBox(document.getElementById('pac-input'));
   map.controls[google.maps.ControlPosition.TOP_CENTER].push(document.getElementById('pac-input'));
   google.maps.event.addListener(searchBox, 'places_changed', function() {
     searchBox.set('map', null);
	 clearSquares();

     var places = searchBox.getPlaces();

     var bounds = new google.maps.LatLngBounds();
     var i, place;
     for (i = 0; place = places[i]; i++) {
       (function(place) {
         bounds.extend(place.geometry.location);
       }(place));
     }
	 
     map.fitBounds(bounds);
     searchBox.set('map', map);
	 
	 //this doesn't quite work the way I want it to
	 var newZoom = countryZoom;
	 setllOffset(countryOff);
	 if (map.getZoom()>countryZoom) {newZoom = provinceZoom; setllOffset(provinceOff);}
	 if (map.getZoom()>provinceZoom) {newZoom = cityZoom; setllOffset(cityOff);}
     map.setZoom(newZoom);
	 createGridLines(map.getBounds());


   });
   //end location search
   
        // Create the DIV to hold the control and call the CenterControl()
        // constructor passing in this DIV.
        var zoomControlDiv = document.createElement('div');
        var zoomControl = new ZoomControl(zoomControlDiv, map);

        zoomControlDiv.index = 1;
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(zoomControlDiv);
		
		
		
		//creating grid
		var oLat = 0.00;
    	var oLon = 0.00;
		var gridlocator = [new google.maps.LatLng(oLat, oLon)];

		//on click, create filled in grid square
    	google.maps.event.addListener(map, 'click', function (event) {
        	createGridBox(event.latLng);
    	});
		
	    //create grid square when 'shift' is pressed
	    google.maps.event.addListener(map, 'mousemove', function (event) {
		//console.log(event.latLng.toString())
		if (event.va.shiftKey == true){
		    //console.log ("bingo");
		    createGridBox(event.latLng);
		}
	    });
		
    	DrawGridOn();
		google.maps.event.addListener(map, 'bounds_changed', function () {
        	createGridLines(map.getBounds());
    	});
		
		
		//highlighting countries
		/**
		var world_geometry = new google.maps.FusionTablesLayer({
		  query: {
		    select: 'geometry',
		    from: '1N2LBk4JHwWpOY4d9fobIn27lfnZ5MDy-NoqqRpk',
			where: "ISO_2DIGIT IN ('US')"
		  },
		  map: map,
		  suppressInfoWindows: true
		});
		**/
   		
}
 
google.maps.event.addDomListener(window, 'load', init);

/**
* The CenterControl adds a control to the map that recenters the map on
* Chicago.
* This constructor takes the control DIV as an argument.
* @constructor
*/
function ZoomControl(controlDiv, map) {
	
	var control = this;
	
	//set CSS for the control border
	var countryZoomUI = document.createElement('div');
	countryZoomUI.id = 'countryZoomUI';
	countryZoomUI.title = 'Click to zoom to country level';
	controlDiv.appendChild(countryZoomUI);
	//set CSS for the control interior
	var countryZoomText = document.createElement('div');
	countryZoomText.id = 'countryZoomText';
	countryZoomText.innerHTML = 'Country Level';
	countryZoomUI.appendChild(countryZoomText);
	
		//set CSS for the control border
	var provinceZoomUI = document.createElement('div');
	provinceZoomUI.id = 'provinceZoomUI';
	provinceZoomUI.title = 'Click to zoom to province/state level';
	controlDiv.appendChild(provinceZoomUI);
	//set CSS for the control interior
	var provinceZoomText = document.createElement('div');
	provinceZoomText.id = 'provinceZoomText';
	provinceZoomText.innerHTML = 'Province Level';
	provinceZoomUI.appendChild(provinceZoomText);
	
		//set CSS for the control border
	var cityZoomUI = document.createElement('div');
	cityZoomUI.id = 'cityZoomUI';
	cityZoomUI.title = 'Click to zoom to city/town level';
	controlDiv.appendChild(cityZoomUI);
	//set CSS for the control interior
	var cityZoomText = document.createElement('div');
	cityZoomText.id = 'cityZoomText';
	cityZoomText.innerHTML = 'City Level';
	cityZoomUI.appendChild(cityZoomText);
	

    // Setup the click event listeners: set zoom level to country level.
    countryZoomUI.addEventListener('click', function() {
    	clearSquares();
		setllOffset(countryOff);
    	map.setZoom(countryZoom);
    });
	
	// Setup the click event listeners: set zoom level to province level.
    provinceZoomUI.addEventListener('click', function() {
    	clearSquares();
		setllOffset(provinceOff);
    	map.setZoom(provinceZoom);
    });
	
	// Setup the click event listeners: set zoom level to city level.
    cityZoomUI.addEventListener('click', function() {
    	clearSquares();
		setllOffset(cityOff);
    	map.setZoom(cityZoom);
    });
}
 
function DrawGridOn() {
    drawGridBox = true;
}

function DrawGridOff() {
    drawGridBox = false;
}


function ClearLastGrid() {
    polyline.setMap(null);
}

function setllOffset(offset){
	llOffset = offset;
}

function clearSquares(){
    for (var i=0; i< gridSquares.length; i++) {
        gridSquares[i].setMap(null);
    }
	gridSquares = [];
}

/**
Draw grid
**/
function createGridLines(bounds) {
    for (var i=0; i< latPolylines.length; i++) {
            latPolylines[i].setMap(null);
    }
    latPolylines = [];
    for (var i=0; i< lngPolylines.length; i++) {
            lngPolylines[i].setMap(null);
    }
    lngPolylines = [];
    if (map.getZoom() <= 2) return; 
    var north = bounds.getNorthEast().lat();
    var east = bounds.getNorthEast().lng();
    var south = bounds.getSouthWest().lat();
    var west = bounds.getSouthWest().lng();

    // define the size of the grid
    var topLat = Math.ceil(north / llOffset) * llOffset;
    var rightLong = Math.ceil(east / llOffset) * llOffset;

    var bottomLat = Math.floor(south / llOffset) * llOffset;
    var leftLong = Math.floor(west / llOffset) * llOffset;

    for (var latitude = bottomLat; latitude <= topLat; latitude += llOffset) {
        // lines of latitude
        latPolylines.push(new google.maps.Polyline({
            path: [
            new google.maps.LatLng(latitude, leftLong),
            new google.maps.LatLng(latitude, rightLong)],
            map: map,
            geodesic: false,
            strokeColor: '#0000FF',
            strokeOpacity: 0.5,
            strokeWeight: 1
        }));
    }
    for (var longitude = leftLong; longitude <= rightLong; longitude += llOffset) {
        // lines of longitude
        lngPolylines.push(new google.maps.Polyline({
            path: [
            new google.maps.LatLng(topLat, longitude),
            new google.maps.LatLng(bottomLat, longitude)],
            map: map,
            geodesic: true,
            strokeColor: '#0000FF',
            strokeOpacity: 0.5,
            strokeWeight: 1
        }));
    }
}

/**
Does highlighted grid square already exist at this point?
**/
function squareOnMap(point){
	for(var i=0; i<gridSquares.length; i++){
		if(gridSquares[i].getBounds().contains(point)) return true;
	}
	return false;
}

/**
Create filled in rectangle in grid (when clicked)
**/
function createGridBox(point) {
	
	if(squareOnMap(point)){ return;}
	
	var rectangle = new google.maps.Rectangle({
          strokeColor: '#0000FF',
          strokeOpacity: 0.7,
          strokeWeight: 2,
          fillColor: '#0000FF',
          fillOpacity: 0.25,
          map: map,
          bounds: {
            north: Math.floor(point.lat() / llOffset) * llOffset + llOffset,
            south: Math.floor(point.lat() / llOffset) * llOffset,
            east: Math.floor(point.lng() / llOffset) * llOffset + llOffset,
            west: Math.floor(point.lng() / llOffset) * llOffset
          }
     });
	 google.maps.event.addListener(rectangle, 'click', function( event ){
		 var index = gridSquares.indexOf(rectangle);
		if (index > -1) {
  			gridSquares.splice(index, 1);
		}
		rectangle.setMap(null); 
	});
	
	gridSquares.push(rectangle);
}	

/*Get array of coordinates of grid squares*/
function getGridSquares(){

	var toReturn=[];
		
    for (var i=0; i< gridSquares.length; i++) {
        toReturn.push(gridSquares[i].bounds);
    }
	
	return toReturn;
	
}


/* Languages search bar*/

function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function(e) {
      var a, b, i, val = this.value;
      /*close any already open lists of autocompleted values*/
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;
      /*create a DIV element that will contain the items (values):*/
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      /*append the DIV element as a child of the autocomplete container:*/
      this.parentNode.appendChild(a);
      /*for each item in the array...*/
      for (i = 0; i < arr.length; i++) {
        /*check if the item starts with the same letters as the text field value:*/
        if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          /*create a DIV element for each matching element:*/
          b = document.createElement("DIV");
          /*make the matching letters bold:*/
          b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
          b.innerHTML += arr[i].substr(val.length);
          /*insert a input field that will hold the current array item's value:*/
          b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
          /*execute a function when someone clicks on the item value (DIV element):*/
          b.addEventListener("click", function(e) {
              /*insert the value for the autocomplete text field:*/
              inp.value = this.getElementsByTagName("input")[0].value;
              /*close the list of autocompleted values,
              (or any other open lists of autocompleted values:*/
              closeAllLists();
          });
          a.appendChild(b);
		}
      }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 38) { //up
        /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 13) {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x) x[currentFocus].click();
        }
      }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
      closeAllLists(e.target);
      });
}

/*An array containing all the language names in the world:*/
var langs = [];
/*Get all the language names from convertcsv.json*/
$(document).ready(function () {
 
 $.ajax({
	 type: "GET",
	 url: "convertcsv.json",
	 "dataType" : "JSON",
	 success: function(result) {
		 for(var i in result){
			langs[i] = result[i].name; 
		 }
	 }
 });
});


/*initiate the autocomplete function on the "myInput" element, and pass along the countries array as possible autocomplete values:*/
autocomplete(document.getElementById("myInput"), langs);

/**Language Questions form popup*/
$('#wrapper').dialog({
        autoOpen: false,
        title: 'Language Questions',
		modal: true,
	    draggable: false,
	    resizable: false,
	    position: ['center', 'top'],
	    show: 'blind',
	    //hide: 'blind',
	    width: 700,
		
});
	
$("#submit").click(function(e) {
	
});

/*Continue to language questions*/
function submitData() {
	if(gridSquares.length==0){
	    alert("Highlight area on map to continue.");
	}
	else if(document.getElementById('myInput').value == ""){
		alert("Please select a language to continue.");
	}
    else{
		$(wrapper).dialog('open');
	}
}

//////////////////////

var createStatement = "CREATE TABLE IF NOT EXISTS Contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, language TEXTs)";
var insertStatement = "INSERT INTO Contacts (language) VALUES (?)";
var db = openDatabase("LanguageData", "1.0", "Language Data", 200000);  // Open SQLite Database
 
var dataset;
 
var DataType;
 
function initDatabase()  // Function Call When Page is ready.
{
	try {
        if (!window.openDatabase)  // Check browser is supported SQLite or not.
        {
            alert('Databases are not supported in this browser.');
        }
        else {
            createTable();  // If supported then call Function for create table in SQLite
        }
    }
    catch (e) {
        return;
    }
}
 
function createTable()  // Function for Create Table in SQLite.
{
    db.transaction(function (tx) { tx.executeSql(createStatement, [], showRecords, onError); });
}
 
function insertRecord() // Get value from Input and insert record . Function Call when Save/Submit Button Click..
{
        var langtemp = $('input:text[id=myInput]').val();
        db.transaction(function (tx) { tx.executeSql(insertStatement, [langtemp], loadRecord, onError); });
 
        //tx.executeSql(SQL Query Statement,[ Parameters ] , Sucess Result Handler Function, Error Result Handler Function );
}
 
function loadRecord(i) // Function for display records which are retrived from database.
{
    var item = dataset.item(i);
    $("#myInput").val((item['myInput']).toString());

}
 
function onError(tx, error) // Function for Hendeling Error...
{
    alert(error.message);
}
 
function showRecords() // Function For Retrive data from Database Display records as list
{
 
 /**
    $("#results").html('')
    db.transaction(function (tx) {
        tx.executeSql(selectAllStatement, [], function (tx, result) {
 
            dataset = result.rows;
            for (var i = 0, item = null; i < dataset.length; i++) {
                item = dataset.item(i);
                var linkeditdelete = '<li>' + item['myInput'] + '    ' + '<a href="#" onclick="loadRecord(' + i + ');">edit</a>' + '    ' +
 
                                            '<a href="#" onclick="deleteRecord(' + item['id'] + ');">delete</a></li>';
                $("#results").append(linkeditdelete);
            }
        });
    });
	**/
}
 
$(document).ready(function () // Call function when page is ready for load..
{
;
    initDatabase();
    $("#submit").click(insertRecord);  // Register Event Listener when button click.
 
});

////////////////////

/*Save data from language questions*/
function saveData() {
  document.cookie="Language="+document.getElementById('myInput').value;
  document.cookie="Grid Squares="+getGridSquares().toString();


  var radios = document.getElementsByName('gender');
  for (var i = 0, length = radios.length; i < length; i++) {
    if (radios[i].checked) {
        document.cookie="Gender="+radios[i].value;
        break;
    }
  }
  
  alert('Data Saved!');
  alert('SAVED DATA: '+document.cookie);
}

