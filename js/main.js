window.onload = setMap();

function setMap(){
    
    var width = 960,
        height = 460;
    
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    
    var projection = d3.geoAlbersUsa()
        .center([0, 33.6])
        .rotate([97.24, -3.64, 0])
        .parallels([29.5, 45.5])
        .scale(553.54)
        .translate([width / 2, height / 2]);
    
    var  path = d3.geoPath()
        .projection(projection);
    
    var promises = [];
    promises.push(d3.csv("data/healthproviders_d3.csv"));
    promises.push(d3.json("data/northamerica.json"));
    promises.push(d3.json("data/us_states.json"));
    Promise.all(promises).then(callback);
    
    function callback(data){
        csvData = data[0];
        northamerica = data[1]
        us = data[2];        
        console.log(csvData);
        console.log(northamerica);
        console.log(us);
        
        var northAmerica = topojson.feature(northamerica, northamerica.objects.NorthAmerica),
            usStates = topojson.feature(us, us.objects.USStates).features;
        
        var countries = map.append("path")
            .data(northamerica)
            .attr("class", "countries")
            .attr("d", path);
        
        var states = map.selectAll(".states")
            .data(us)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "states " + d.properties.adm1_code;
            })
            .attr("d", path);
        
        var graticule = d3.geoGraticule()
            .step([5, 5]);
        
        var gratBackground = map.append("path")
            .datum(graticule.outline())
            .attr("class", "gratBackground")
            .attr("d", path)
        
        var gratLines = map.selectAll(".gratLines")
            .data(graticule.lines())
            .enter()
            .append("path")
            .attr("class", "gratLines")
            .attr("d", path);
            
    };
};
