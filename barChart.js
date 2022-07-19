function barChart(dataURL, date, title, w, h, parseTime) {
    const margin = {top: 50, right: 30, bottom: 100, left: 30},
    width = w - margin.right - margin.left,
    height = h - margin.top - margin.bottom;
    
    const svg = d3.select("#viz")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
    
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv(dataURL).then(function (data) {
        let filteredData = data.filter(function(row) {
            const excludedGeoids = [
                'USA-60', // American Samoa 
                'USA-69', // Northern Mariana Islands 
                'USA-66', // Guam
                'USA-72', // Puerto Rico
                'USA-78'  // Virgin Islands
            ];
            for (let i = 0; i < excludedGeoids.length; i++) {
                if (row['geoid'] == excludedGeoids[i]) {
                    return false;
                }
            }
            rowDate = parseTime(row['date'])
            return rowDate.getFullYear() == date.getFullYear()
                && rowDate.getMonth() == date.getMonth()
                && rowDate.getDate() == date.getDate();
        })

        // console.log(filteredData);
        // console.log(filteredData.length);

        // filteredData.sort(function(a, b) {
        //     return d3.descending(parseFloat(a.cases_avg_per_100k), parseFloat(b.cases_avg_per_100k))
        // })

        filteredData.sort(function(a, b) {
            return d3.ascending(a.state, b.state)
        })

        // X Axis
        const x = d3.scaleBand()
            .range([ 0, width ])
            .domain(filteredData.map(function(d) { return d.state }))
            .padding(0.2);
        
        g.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
                .attr("transform", `translate(-10,0)rotate(-45)`)
                .style("text-anchor", "end");

        const y = d3.scaleLinear()
            .domain([0, 150])
            .range([ height, 0 ]);
        g.append("g")
            .call(d3.axisLeft(y));

        // Bars
        g.selectAll("bar")
            .data(filteredData)
            .enter()
            .append("rect")
                .attr("class", "bar")
                .on("mouseover", function() {
                    d3.select(this)
                        .attr("fill", "steelblue")
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .transition("colorfade")
                        .duration(250)
                        .attr("fill", "#69b3a2")
                })
                .attr("fill", "#69b3a2")
                .attr("x", function(d) {return x(d.state); })
                .attr("width", x.bandwidth())
                .attr("y", height)
                .transition("bars")
                .delay(function(d, i) {
                    return i * 50;
                })
                .duration(1000)
                .attr("y", function(d) {return y(d.cases_avg_per_100k); })
                .attr("height", function(d) { return height - y(d.cases_avg_per_100k); })
    })
}
