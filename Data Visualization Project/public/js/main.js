let rawData = null;

fetch("/fifa")
  .then((res) => res.json())
  .then((data) => {
    rawData = data;
    showChart("barChart");
  })
  .catch((err) => console.error("API fetch error:", err));

function showChart(type) {
  if (!rawData) return;
  d3.select("#chart-area").html("");

  switch (type) {
    case "barChart":
      drawBarChart(rawData);
      break;
    case "pie":
      drawPieChart(rawData);
      break;
    case "line":
      drawLineChart(rawData);
      break;
    case "bubble":
      drawBubbleChart(rawData);
      break;
    case "area":
      drawAreaChart(rawData);
      break;
    case "donut":
      drawDonutChart(rawData);
      break;
    case "treemap":
      drawTreemapChart(rawData);
      break;
    case "waterfall":
      drawWaterfallChart(rawData);
      break;
    default:
      alert("Chart type not recognized!");
  }
}

function drawBarChart(data) {
  const goalData = {};
  data.matches.forEach((match) => {
    const home = match.homeTeam.name;
    const away = match.awayTeam.name;
    const homeGoals = match.score.fullTime.home || 0;
    const awayGoals = match.score.fullTime.away || 0;

    goalData[home] = (goalData[home] || 0) + homeGoals;
    goalData[away] = (goalData[away] || 0) + awayGoals;
  });

  const dataset = Object.entries(goalData).map(([team, goals]) => ({
    team,
    goals,
  }));

  const width = 800,
    height = 400;
  const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3
    .scaleBand()
    .domain(dataset.map((d) => d.team))
    .range([50, width - 50])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(dataset, (d) => d.goals)])
    .range([height - 50, 50]);

  svg
    .selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.team))
    .attr("y", (d) => y(d.goals))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - 50 - y(d.goals))
    .attr("fill", "#3498db")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("fill", "#2ecc71");
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(`${d.team}: ${d.goals} goals`)
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("fill", "#3498db");
      tooltip.transition().duration(500).style("opacity", 0);
    });

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - 50})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  svg.append("g").attr("transform", "translate(50, 0)").call(d3.axisLeft(y));
}

function drawPieChart(data) {
  const outcomeData = { Win: 0, Draw: 0, Loss: 0 };

  data.matches.forEach((match) => {
    const winner = match.score.winner;
    if (winner === "HOME_TEAM") outcomeData.Win++;
    else if (winner === "AWAY_TEAM") outcomeData.Loss++;
    else outcomeData.Draw++;
  });

  const pieData = [
    { label: "Wins", value: outcomeData.Win },
    { label: "Draws", value: outcomeData.Draw },
    { label: "Losses", value: outcomeData.Loss },
  ];

  const width = 400,
    height = 400;
  const radius = Math.min(width, height) / 2;
  const color = d3
    .scaleOrdinal()
    .domain(pieData)
    .range(["#4CAF50", "#FFC107", "#F44336"]);

  const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const pie = d3.pie().value((d) => d.value);
  const arc = d3.arc().outerRadius(radius).innerRadius(0);

  svg
    .selectAll("path")
    .data(pie(pieData))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", (d) => color(d.data.label));

  svg
    .selectAll("text")
    .data(pie(pieData))
    .enter()
    .append("text")
    .attr("transform", (d) => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("fill", "white")
    .text((d) => `${d.data.label}: ${d.data.value}`);
}

function drawLineChart(data) {
  const width = 800,
    height = 400;
  const margin = 50;

  const parseTime = d3.timeParse("%Y-%m-%d");

  const matchesByDate = {};
  data.matches.forEach((match) => {
    const date = parseTime(match.utcDate.split("T")[0]);
    matchesByDate[date] = (matchesByDate[date] || 0) + 1;
  });

  const dataForLineChart = Object.entries(matchesByDate).map(
    ([date, count]) => ({
      date: new Date(date),
      count,
    })
  );

  const x = d3
    .scaleTime()
    .domain(d3.extent(dataForLineChart, (d) => d.date))
    .range([margin, width - margin]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(dataForLineChart, (d) => d.count)])
    .range([height - margin, margin]);

  const line = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.count));

  const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin})`)
    .call(d3.axisBottom(x));

  svg
    .append("g")
    .attr("transform", `translate(${margin},0)`)
    .call(d3.axisLeft(y));

  svg
    .append("path")
    .data([dataForLineChart])
    .attr("class", "line")
    .attr("d", line)
    .attr("stroke", "#3498db")
    .attr("stroke-width", 2)
    .attr("fill", "none");
}

function drawBubbleChart(data) {
  const width = 800,
    height = 500,
    margin = { top: 50, right: 50, bottom: 50, left: 150 };

  const goalData = {};
  data.matches.forEach((match) => {
    const home = match.homeTeam.name;
    const away = match.awayTeam.name;
    const homeGoals = match.score.fullTime.home || 0;
    const awayGoals = match.score.fullTime.away || 0;

    goalData[home] = (goalData[home] || 0) + homeGoals;
    goalData[away] = (goalData[away] || 0) + awayGoals;
  });

  const dataset = Object.entries(goalData).map(([team, goals]) => ({
    team,
    goals,
  }));

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(dataset, (d) => d.goals) + 2])
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleBand()
    .domain(dataset.map((d) => d.team))
    .range([margin.top, height - margin.bottom])
    .padding(0.2);

  const r = d3
    .scaleSqrt()
    .domain([0, d3.max(dataset, (d) => d.goals)])
    .range([5, 25]);

  const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("display", "block")
    .style("margin", "0 auto");

  // X Axis
  svg
    .append("g")
    .attr("transform", `translate(0,${margin.top})`)
    .call(d3.axisTop(x))
    .selectAll("text")
    .style("font-size", "12px");

  // Y Axis
  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "12px");

  // Circles
  svg
    .selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.goals))
    .attr("cy", (d) => y(d.team) + y.bandwidth() / 2)
    .attr("r", (d) => r(d.goals))
    .style("fill", "#3498db")
    .on("mouseover", function (event, d) {
      d3.select(this).style("fill", "#e74c3c");
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(`<strong>${d.team}</strong>: ${d.goals} goals`)
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      d3.select(this).style("fill", "#3498db");
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("padding", "6px")
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "white")
    .style("border-radius", "4px")
    .style("pointer-events", "none");
}

function drawAreaChart(data) {
  const width = 800,
    height = 400;
  const margin = 50;

  const goalData = {};
  data.matches.forEach((match) => {
    const home = match.homeTeam.name;
    const away = match.awayTeam.name;
    const homeGoals = match.score.fullTime.home || 0;
    const awayGoals = match.score.fullTime.away || 0;

    goalData[home] = (goalData[home] || 0) + homeGoals;
    goalData[away] = (goalData[away] || 0) + awayGoals;
  });

  const dataset = Object.entries(goalData).map(([team, goals]) => ({
    team,
    goals,
  }));

  const x = d3
    .scaleBand()
    .domain(dataset.map((d) => d.team))
    .range([50, width - 50])
    .padding(0.2);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(dataset, (d) => d.goals)])
    .range([height - margin, margin]);

  const area = d3
    .area()
    .x((d) => x(d.team))
    .y0(height - margin)
    .y1((d) => y(d.goals));

  const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("path").data([dataset]).attr("d", area).attr("fill", "#3498db");

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-0.8em")
    .attr("dy", "0.15em")
    .attr("transform", "rotate(-45)");

  svg.append("g").attr("transform", `translate(50, 0)`).call(d3.axisLeft(y));
}

function drawDonutChart(data) {
  const width = 500,
    height = 400,
    margin = 40;
  const radius = Math.min(width, height) / 2 - margin;

  const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const outcomeCount = { Win: 0, Loss: 0, Draw: 0 };

  data.matches.forEach((match) => {
    if (match.score.winner === "HOME_TEAM") outcomeCount.Win++;
    else if (match.score.winner === "AWAY_TEAM") outcomeCount.Loss++;
    else outcomeCount.Draw++;
  });

  const color = d3
    .scaleOrdinal()
    .domain(Object.keys(outcomeCount))
    .range(["#2ecc71", "#e74c3c", "#f1c40f"]);

  const pie = d3.pie().value((d) => d[1]);
  const data_ready = pie(Object.entries(outcomeCount));

  svg
    .selectAll("whatever")
    .data(data_ready)
    .join("path")
    .attr(
      "d",
      d3
        .arc()
        .innerRadius(radius * 0.5) // donut
        .outerRadius(radius)
    )
    .attr("fill", (d) => color(d.data[0]))
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .style("opacity", 0.7);

  // Add labels
  svg
    .selectAll("text")
    .data(data_ready)
    .enter()
    .append("text")
    .text((d) => `${d.data[0]}: ${d.data[1]}`)
    .attr(
      "transform",
      (d) =>
        `translate(${d3
          .arc()
          .innerRadius(radius * 0.5)
          .outerRadius(radius)
          .centroid(d)})`
    )
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "black");
}

function drawTreemapChart(data) {
  const width = 800,
    height = 400;

  const goalData = {};

  data.matches.forEach((match) => {
    const home = match.homeTeam.name;
    const away = match.awayTeam.name;
    const homeGoals = match.score.fullTime.home || 0;
    const awayGoals = match.score.fullTime.away || 0;

    goalData[home] = (goalData[home] || 0) + homeGoals;
    goalData[away] = (goalData[away] || 0) + awayGoals;
  });

  const dataset = Object.entries(goalData).map(([team, goals]) => ({
    name: team,
    value: goals,
  }));

  const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const treemap = d3.treemap().size([width, height]).padding(1);

  const root = d3.hierarchy({ children: dataset }).sum((d) => d.value);

  treemap(root);

  svg
    .selectAll(".node")
    .data(root.leaves())
    .enter()
    .append("rect")
    .attr("class", "node")
    .attr("x", (d) => d.x0)
    .attr("y", (d) => d.y0)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .style("fill", "#3498db")
    .style("stroke", "#0077b6")
    .style("stroke-width", 1);

  svg
    .selectAll(".text")
    .data(root.leaves())
    .enter()
    .append("text")
    .attr("x", (d) => (d.x0 + d.x1) / 2)
    .attr("y", (d) => (d.y0 + d.y1) / 2)
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .style("fill", "white")
    .style("font-size", "12px")
    .text((d) => `${d.data.name}: ${d.data.value}`);
}

function drawWaterfallChart(data) {
  // Sample Waterfall data (replace this with actual data as needed)
  const waterfallData = [
    { label: "Start", value: 1000 },
    { label: "Q1", value: 200 },
    { label: "Q2", value: -150 },
    { label: "Q3", value: 300 },
    { label: "Q4", value: -100 },
    { label: "End", value: 600 },
  ];

  // Set up chart dimensions and margins
  const margin = { top: 50, right: 50, bottom: 100, left: 50 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Calculate cumulative value for each step
  let cumulativeValue = 0;
  waterfallData.forEach((d) => {
    cumulativeValue += d.value;
    d.cumulative = cumulativeValue;
  });

  // Set up scales for x and y axes
  const x = d3
    .scaleBand()
    .domain(waterfallData.map((d) => d.label))
    .range([0, width])
    .padding(0.4);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(waterfallData, (d) => d.cumulative) + 100])
    .range([height, 0]);

  // Draw bars for waterfall chart
  svg
    .selectAll(".bar")
    .data(waterfallData)
    .enter()
    .append("rect")
    .attr("class", (d) => `bar ${d.value >= 0 ? "positive" : "negative"}`)
    .attr("x", (d) => x(d.label))
    .attr("y", (d) =>
      d.value >= 0 ? y(d.cumulative - d.value) : y(d.cumulative)
    )
    .attr("width", x.bandwidth())
    .attr("height", (d) =>
      Math.abs(y(d.cumulative) - y(d.cumulative - d.value))
    )
    .style("fill", (d) => (d.value >= 0 ? "#2ecc71" : "#e74c3c")); // Green for positive, Red for negative

  // Add X axis
  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // Add Y axis
  svg.append("g").attr("class", "axis").call(d3.axisLeft(y));

  // Add labels for each bar with font colors
  svg
    .selectAll(".label")
    .data(waterfallData)
    .enter()
    .append("text")
    .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
    .attr("y", (d) =>
      d.value >= 0 ? y(d.cumulative - d.value) - 10 : y(d.cumulative) + 15
    )
    .attr("text-anchor", "middle")
    .text((d) => (d.value >= 0 ? "+" + d.value : d.value))
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("fill", (d) => (d.value >= 0 ? "black" : "red")); // Black for positive, Red for negative

  // Add title for the waterfall chart
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("Waterfall Chart: Financial Performance");
}
