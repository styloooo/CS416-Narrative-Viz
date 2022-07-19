// function lineChart(dataURL, w, h, parseTime, lineChartTitle, isGuided) {
function lineChart(dataURL, chartConfig) {
    // const chartConfig = {
    //     width: width,
    //     height: height,
    //     parseTime: parseTime,
    //     title: null,
    //     state: 0
    //     isGuided: true/false,
    // }
    const parseTime = chartConfig.parseTime;
    const bisectDate = d3.bisector(function(d) { return d.date; }).left;

    const margin = {top: 50, right: 30, bottom: 30, left: 30},
        width = chartConfig.width - margin.right - margin.left,
        height = chartConfig.height - margin.top - margin.bottom;

    // function tooltipLabelMaker (date, value) {
    //     return `On average there were ${value} average cases per 100,000 on ${date}.`
    // }

    // Append SVG object to body of the page
    const svg = d3.select("#viz")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
    const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("#viz").append("div")
        .attr("class", "tooltip")
        .style("display", "none");

    // Read data
    d3.csv(dataURL,

    // Format variables
    function(d){
        return { date: parseTime(d.date), value : parseFloat(d.cases_avg_per_100k) }
    }).then(

    // Use the dataset
    function(data) {
        // X Axis (Date)
        // console.log(data);

        const x = d3.scaleTime()
            .domain(d3.extent(data, function(d) { return d.date; }))
            .range([ 0, width ]);
        g.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        // Y Axis
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) { return +d.value; })])
            .range([ height, 0 ]);
        g.append("g")
            .call(d3.axisLeft(y));

        // Line
        g.append("path")
            .datum(data)
            // .attr("fill", "none")
            // .attr("stroke", "steelblue")
            // .attr("stroke-width", 1.5)
            .attr("class", "line")
            .attr("d", d3.line()
                .x(function(d) { return x(d.date) })
                .y(function(d) { return y(d.value) })
            );

        // Guided annotations
        if (chartConfig.isGuided === true) {
            const labels = [
                {
                    data: {
                        date: '2022-01-14',
                        cases_avg_per_100k: 243.15
                    },
                    dy: 37,
                    dx: -142
                },
                {
                    data: {
                        date: '2021-01-11',
                        cases_avg_per_100k: 75.52
                    },
                    dy: -50,
                    dx: 25
                },
                {
                    data: {
                        date: '2021-08-31',
                        cases_avg_per_100k: 48.79
                    },
                    dy: -75,
                    dx: -120
                }
            ].map(l => {
                l.note = Object.assign({}, l.note, {
                    title : l.data.date,
                    label: `Average of ${l.data.cases_avg_per_100k} cases per 100,000 people`})
                    l.subject = { radius: Math.log(l.data.cases_avg_per_100k) }
                
                return l
            })

            const timeFormat = d3.timeFormat("%Y-%m-%d")

            window.makeAnnotations = d3.annotation()
                .annotations(labels)
                .type(d3.annotationCalloutCircle)
                .accessors({ x: d => x(parseTime(d.date)),
                    y: d => y(d.cases_avg_per_100k)
                })
                .accessorsInverse({
                    date: d => timeFormat(x.invert(d.x)),
                    cases_avg_per_100k: d => y.invert(d.y)
                })
                .on('subjectover', function(annotation) {
                    annotation.type.a.selectAll("g.annotation-connector, g.annotation-note")
                        .classed("hidden", false)
                })
                .on('subjectout', function(annotation) {
                    annotation.type.a.selectAll("g.annotation-connector, g.annotation-note")
                        .classed("hidden", true)
                })

                g.append("g")
                    .attr("class", "annotation-test")
                    .call(makeAnnotations)

                g.selectAll("g.annotation-connector, g.annotation-note")
                    .classed("hidden", true)
        } else { // explore mode (free moving tooltip)
            // Mouseover tooltip example adapted
            // from https://bl.ocks.org/Qizly/5a78caaf03ed96757e72

            const focus = svg.append("g")
                .attr("class", "focus")
                .style("display", "none");

            focus.append("circle")
                .attr("r", 2);

            const tooltipDate = tooltip.append("div")
                .attr("class", "tooltip-date");

            const tooltipCases = tooltip.append("div");
            tooltipCases.append("span")
                .attr("class", "tooltip-title")
                .text("Cases: ");

            const tooltipCasesValue = tooltipCases.append("span")
                .attr("class", "tooltip-cases");

            g.append("rect")
                .attr("class", "overlay")
                .attr("width", width)
                .attr("height", height)
                .attr("transform", `translate(${margin.left},${margin.top})`)
                .on("mouseover", function() {
                    focus.style("display", null);
                    tooltip.style("display", null); 
                }).on("mouseout", function() {
                    focus.style("display", "none");
                    tooltip.style("display", "none");
                }).on("mousemove", function(event){
                    console.log(d3.pointer(event));
                    let x0 = x.invert(d3.pointer(event)[0]),
                        i = bisectDate(data, x0, 1),
                        d0 = data[i - 1],
                        d1 = data[i],
                        d = x0 - d0.date > d1.date - x0 ? d1 : d0;
                    // console.log(d);
                    focus.attr("transform", `translate(${margin.left + x(d.date)},${margin.top + y(d.value)})`);
                    focus.select("circle").attr("r", function() {
                        let value = 0;
                        if (d.value != null && d.value > 0) value = Math.log(d.value);
                        return value;
                    });
                    tooltip.attr("style", `left:${x(d.date) + 64}px; top:${y(d.value)}px;`);
                    tooltip.select(".tooltip-date").text(parseTime(d.date));
                    tooltip.select(".tooltip-cases").text(d.value);

                }); // end mousemove callback
            } // end conditional        
    }); // end d3.csv callback
    // Title
    svg.append("text")
    .attr("class", "title")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .text(chartConfig.title)
} // end lineChart(...)
