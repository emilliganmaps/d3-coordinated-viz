//create map when window loads
window.onload = setMap();

//function to create the map using d3
function setMap(){
    
    //size of map container
    var width = 700,
        height = 460;
    
    //svg container
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    
    //sets the projection of the map
    var projection = d3.geoAlbers()//albers USA projection
        .center([0, 40])//center of the map container
        .rotate([95, 0, 0])
        .parallels([29.5, 45.5])
        .scale(600)//where the map automatically zooms to
        .translate([width / 2, height / 2]);
    
    //path generator
    var path = d3.geoPath()
        .projection(projection);
    
    //promise function to load the csv and topojson data
    var promises = [];
    promises.push(d3.csv("data/healthproviders_d3.csv"));
    promises.push(d3.json("data/northamerica.json"));
    promises.push(d3.json("data/us_states.json"));
    Promise.all(promises).then(callback);

    function callback(data){
        //sets up a graticule
        var graticule = d3.geoGraticule()
            .step([5, 5])

        //background of the graticule
        var gratBackground = map.append("path")
            .datum(graticule.outline())
            .attr("class", "gratBackground")
            .attr("d", path)
        
        //graticule lines
        var gratLines = map.selectAll(".gratLines")
        
        csvData = data[0];
        northAmerica = data[1]
        usa = data[2];        
        //console.log(csvData);
        //console.log(northamerica);
        //console.log(usa);
        
        //translate topojson
        var namerica = topojson.feature(northAmerica, northAmerica.objects.northamerica),
            ustates = topojson.feature(usa, usa.objects.us_states).features;
        
        //console.log(namerica);
        //console.log(ustates);
        
        //uses the north american countries layer to create basemap
        var countries = map.append("path")
            .datum(namerica)
            .attr("class", "countries")
            .attr("d", path);
        
        //makes the state topojson the layer that will have the choropleth map
        var states = map.selectAll(".states")
            .data(ustates)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "states " + d.properties.adm1_code;
            })
            .attr("d", path);
            
    };
};
