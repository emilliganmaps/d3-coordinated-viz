(function(){

var attrArray = ["residents_per_provider", "all_pc_providers", "all_ps", "all_nps", "all_pas"];
    
var expressed = attrArray[0];

//create map when window loads
window.onload = setMap();

//function to create the map using d3
function setMap(){
    
    //size of map
    var width = window.innerWidth * 0.5,
        height = 460;
    
    //svg container
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //sets the projection of the map
    var projection = d3.geoAlbers()//albers projection
        .center([0, 40])//center of the map container
        .rotate([97, 0, 0])
        .parallels([29.5, 45.5])
        .scale(800)//where the map automatically zooms to
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
    
    //callback function
    function callback(data){
        csvData = data[0];
        northAmerica = data[1];
        usa = data[2]; 
        
        setGraticule(map, path);
        
        //translate topojson
        var namerica = topojson.feature(northAmerica, northAmerica.objects.northamerica),
            ustates = topojson.feature(usa, usa.objects.us_states).features;
        
        //uses the north american countries layer to create basemap
        var countries = map.append("path")
            .datum(namerica)
            .attr("class", "countries")
            .attr("d", path);
        
        ustates = joinData(ustates, csvData);
        
        var colorScale = makeColorScale(csvData);
        
        //adds enumeration units to map 
        setEnumerationUnits(ustates, map, path, colorScale);
        
        //adds coordinated viz to map
        setChart(csvData, colorScale);
    };
}; //set map function ends

//function to create a graticule
function setGraticule(map, path){
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
};

//function to join csv data
function joinData(ustates, csvData){
    ["residents_per_provider", "all_pc_providers", "all_ps", "all_nps", "all_pas"];

    for (var i=0; i<csvData.length; i++){
        var csvState = csvData[i];
        var csvKey = csvState.adm1_code;

        for (var a=0; a<ustates.length; a++){
            var geojsonProps = ustates[a].properties;
            var geojsonKey = geojsonProps.adm1_code;

            if (geojsonKey == csvKey){

                attrArray.forEach(function(attr){
                    var val = parseFloat(csvState[attr]);
                    geojsonProps[attr] = val;
                });
            };
        };
    };
    
    return ustates;
};

//creates enumeration units
function setEnumerationUnits(ustates, map, path, colorScale){

    //add states to map
    var states = map.selectAll(".states")
        .data(ustates)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "states " + d.properties.adm1_code;
        })
        .attr("d", path)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        });
};
    
//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};
    
//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg for chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a chart background
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //scales bars based on attribute values
    var yScale = d3.scaleLinear()
        .range([460, 0])
        .domain([200, 650]);

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.adm1_code;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 460 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });

    //create title for bar chart
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of residents per healthcare provider");

    //create a y axis
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis on chart
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
};
    
//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#fee5d9", //light red
        "#fcae91",
        "#fb6a4a",
        "#de2d26",
        "#a50f15" //dark red
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};
    
})();