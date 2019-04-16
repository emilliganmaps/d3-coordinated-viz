(function(){

var attrArray = ["residents per healthcare provider", "residents per primary care provider", "primary care physicians", "nurse practitioners", "physician assistants"];
    
var expressed = attrArray[0]; //initial attribute
    
//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 600,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([610, 0])
    .domain([0, 7000]);

//begin script when window loads
window.onload = setMap();

//function to create the map using d3
function setMap(){
    
    //size of map
    var width = window.innerWidth * 0.5,
        height = 600;
    
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
        
        //call dropdown
        createDropdown(csvData);
        
        updateChart(bars, csvData.length, colorScale);
        
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
    ["residents per healthcare provider", "residents per primary care provider", "primary care physicians", "nurse practitioners", "physician assistants"];

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
        })
        .on("mouseover", function(d){
            highlight(d.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);
    
    var desc = states.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
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
        chartHeight = 606,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 3,
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
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
    
    //add style descriptor
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

    //create title for bar chart
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of " + expressed);
    
    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([610, 0])
        .domain([0, 7000]);

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
    
    updateChart(bars, csvData.length, colorScale);
};//end of set chart function
    
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
    
//create dropdown menu
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });
    
    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });

}; 

//dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var states = d3.selectAll(".states")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });

    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition()
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);
    
    updateChart(bars, csvData.length, colorScale);
}; //end of change attribute function      

    
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 600 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
};

//highlight an individual state or bar
function highlight(props){
    var selected = d3.selectAll("." + props.adm1_code)
        .style("stroke", "black")
        .style("stroke-width", "2");
};
    
//reset element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.adm1_code)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });
    
    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();
        
        var styleObject = JSON.parse(styleText);
        
        return styleObject[styleName];
    };
};
    
//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.adm1_code + "_label")
        .html(labelAttribute);

    var stateName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};
    
//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};
    
})();