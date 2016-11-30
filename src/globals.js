var username = 'julse';

module.exports = {
    api_url: {
        geonames: 'http://api.geonames.org/searchJSON',
        osm: 'http://overpass-api.de/api/interpreter'
    }
};

//OSM?
// http://overpass-api.de/api/interpreter?data=query

// fuzzy search
// http://api.geonames.org/search?q=londoz&fuzzy=0.8&username=demo

//JSON results
// http://api.geonames.org/searchJSON?q=london&maxRows=10&username=demo
