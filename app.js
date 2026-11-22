const STATES = [
  { name: "Maharashtra", zone: "West" },
  { name: "Karnataka", zone: "South" },
  { name: "Delhi", zone: "North" },
  { name: "Tamil Nadu", zone: "South" },
  { name: "Gujarat", zone: "West" },
  { name: "Uttar Pradesh", zone: "North" },
  { name: "West Bengal", zone: "East" },
  { name: "Telangana", zone: "South" },
  { name: "Rajasthan", zone: "North" },
  { name: "Kerala", zone: "South" }
];

const PRODUCTS = [
  { name: "Everyday kurta", category: "Apparel", price: 1299, emoji: "👕" },
  { name: "Wireless earbuds", category: "Electronics", price: 2499, emoji: "🎧" },
  { name: "Steel bottle", category: "Home & Kitchen", price: 699, emoji: "🥤" },
  { name: "Face care bundle", category: "Beauty", price: 899, emoji: "🧴" },
  { name: "Cotton bedsheet", category: "Home & Kitchen", price: 1899, emoji: "🛏️" },
  { name: "Smart watch", category: "Electronics", price: 4999, emoji: "⌚" },
  { name: "Linen saree", category: "Apparel", price: 3299, emoji: "🧣" },
  { name: "Herbal hair oil", category: "Beauty", price: 449, emoji: "🌿" },
  { name: "Running shoes", category: "Footwear", price: 2799, emoji: "👟" },
  { name: "Canvas tote", category: "Apparel", price: 799, emoji: "👜" },
  { name: "Mixer grinder", category: "Home & Kitchen", price: 3499, emoji: "🍲" },
  { name: "Bluetooth speaker", category: "Electronics", price: 1999, emoji: "🔊" },
  { name: "Sunscreen SPF 50", category: "Beauty", price: 599, emoji: "☀️" },
  { name: "Casual sandals", category: "Footwear", price: 1199, emoji: "🩴" }
];

const CHANNELS = ["Online", "Store", "Marketplace"];
const CUSTOMER_TYPES = ["New", "Returning"];
const CATEGORY_COLORS = ["#37895c", "#80b38a", "#b8d2b2", "#d4ad70", "#9aaea1"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DATA = createOrders();
let activeView = "overview";

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createOrders() {
  const random = seededRandom(20260714);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const orders = [];
  for (let i = 0; i < 980; i += 1) {
    const daysAgo = Math.floor(random() * 730);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const product = PRODUCTS[Math.floor(random() * PRODUCTS.length)];
    const state = STATES[Math.floor(random() * STATES.length)];
    const units = 1 + Math.floor(random() * 3);
    const discount = [0, 0.05, 0.1, 0.15, 0.2][Math.floor(random() * 5)];
    const gross = product.price * units * (1 - discount);
    const channel = CHANNELS[Math.floor(random() * CHANNELS.length)];
    const returned = random() < (product.category === "Apparel" ? 0.105 : 0.055);
    orders.push({
      id: `IN-${String(60001 + i)}`,
      date,
      product,
      state: state.name,
      zone: state.zone,
      units,
      discount,
      sales: Math.round(gross),
      profit: Math.round(gross * (0.17 + random() * 0.24)),
      channel,
      customer: `Customer ${String(101 + Math.floor(random() * 410))}`,
      customerType: CUSTOMER_TYPES[random() < 0.28 ? 0 : 1],
      rating: Math.min(5, Math.round((3.5 + random() * 1.5) * 10) / 10),
      deliveryDays: 2 + Math.floor(random() * 9),
      returned
    });
  }
  return orders;
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});
const number = new Intl.NumberFormat("en-IN");
const compactInr = value => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return inr.format(value);
};
const percent = value => `${value.toFixed(1)}%`;
const sum = (items, getter) => items.reduce((total, item) => total + getter(item), 0);
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

function selectedFilters() {
  const days = Number(document.querySelector("#period-filter").value);
  const state = document.querySelector("#state-filter").value;
  const category = document.querySelector("#category-filter").value;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days);
  return { days, state, category, cutoff };
}

function filteredOrders() {
  const filters = selectedFilters();
  return DATA.filter(order => order.date >= filters.cutoff
    && (filters.state === "all" || order.state === filters.state)
    && (filters.category === "all" || order.product.category === filters.category));
}

function compareOrders(orders) {
  const { days, state, category, cutoff } = selectedFilters();
  const previousStart = new Date(cutoff);
  previousStart.setDate(previousStart.getDate() - days);
  return DATA.filter(order => order.date >= previousStart && order.date < cutoff
    && (state === "all" || order.state === state)
    && (category === "all" || order.product.category === category));
}

function labelForDate(date, withYear = false) {
  return `${MONTHS[date.getMonth()]}${withYear ? ` '${String(date.getFullYear()).slice(-2)}` : ""}`;
}

function ordersByMonth(orders, days) {
  const now = new Date();
  const filters = selectedFilters();
  const bucketCount = days <= 90 ? 6 : 12;
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    let start;
    if (days <= 90) {
      start = new Date(filters.cutoff);
      start.setDate(start.getDate() + Math.floor(index * (days + 1) / bucketCount));
    } else {
      start = new Date(now.getFullYear(), now.getMonth() - (bucketCount - 1) + index, 1);
    }
    return {
      label: days <= 90 ? `${start.getDate()} ${MONTHS[start.getMonth()]}` : labelForDate(start, true),
      year: start.getFullYear(),
      month: start.getMonth(),
      sales: 0,
      profit: 0,
      count: 0
    };
  });
  orders.forEach(order => {
    if (days > 90) {
      const monthIndex = buckets.findIndex(bucket => bucket.month === order.date.getMonth() && bucket.year === order.date.getFullYear());
      if (monthIndex >= 0) {
        buckets[monthIndex].sales += order.sales;
        buckets[monthIndex].profit += order.profit;
        buckets[monthIndex].count += 1;
      }
    } else {
      const index = Math.min(bucketCount - 1, Math.floor((order.date - filters.cutoff) / (86400000 * (days + 1) / bucketCount)));
      if (index < 0 || index >= buckets.length) return;
      buckets[index].sales += order.sales;
      buckets[index].profit += order.profit;
      buckets[index].count += 1;
    }
  });
  return buckets;
}

function makeLineChart(orders, days) {
  const values = ordersByMonth(orders, days);
  const width = 620;
  const height = 206;
  const left = 47;
  const right = 10;
  const top = 14;
  const bottom = 30;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  const max = Math.max(...values.map(item => item.sales), 1) * 1.18;
  const points = values.map((item, index) => ({
    ...item,
    x: left + (values.length === 1 ? 0 : index * innerW / (values.length - 1)),
    y: top + innerH - item.sales / max * innerH,
    py: top + innerH - (item.profit / max) * innerH
  }));
  const line = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const profitLine = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.py}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${top + innerH} L${points[0].x},${top + innerH} Z`;
  const grid = [0, 1, 2, 3].map(step => {
    const y = top + innerH * step / 3;
    return `<line class="chart-gridline" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/><text class="chart-label" x="${left - 7}" y="${y + 3}" text-anchor="end">${compactInr(max * (1 - step / 3))}</text>`;
  }).join("");
  const labels = points.map(point => `<text class="chart-label" x="${point.x}" y="${height - 8}" text-anchor="middle">${point.label}</text>`).join("");
  const circles = points.map(point => `<circle class="line-point" cx="${point.x}" cy="${point.y}" r="3.2"><title>${point.label}: ${inr.format(point.sales)} sales · ${point.count} orders</title></circle>`).join("");
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Sales and profit trend">${grid}<defs><linearGradient id="salesGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#7cbd91" stop-opacity=".24"/><stop offset="100%" stop-color="#7cbd91" stop-opacity="0"/></linearGradient></defs><path class="sales-area" d="${area}"/><path class="profit-line" d="${profitLine}"/><path class="sales-line" d="${line}"/>${circles}${labels}</svg>`;
}

function trendDescription(days) {
  return days <= 90 ? "Sales and profit across the selected date range" : "Monthly performance across the selected period";
}

function groupBy(orders, keyGetter, valueGetter = order => order.sales) {
  const result = new Map();
  orders.forEach(order => {
    const key = keyGetter(order);
    result.set(key, (result.get(key) || 0) + valueGetter(order));
  });
  return Array.from(result, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function categoryRows(orders) {
  const categories = groupBy(orders, order => order.product.category);
  const max = Math.max(...categories.map(item => item.value), 1);
  if (!categories.length) return '<div class="empty-state">No category sales in this selection.</div>';
  return categories.map((item, index) => `<div class="category-row"><span class="category-name">${escapeHtml(item.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${item.value / max * 100}%;background:${CATEGORY_COLORS[index % CATEGORY_COLORS.length]}"></div></div><span class="category-amount">${compactInr(item.value)}</span></div>`).join("");
}

function channelRows(orders) {
  const channels = groupBy(orders, order => order.channel);
  const max = Math.max(...channels.map(item => item.value), 1);
  if (!channels.length) return '<div class="empty-state">No channel data available.</div>';
  return channels.map((item, index) => `<div class="channel-row"><span class="category-name">${escapeHtml(item.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${item.value / max * 100}%;background:${CATEGORY_COLORS[index]}"></div></div><span class="category-amount">${percent(item.value / Math.max(sum(channels, row => row.value), 1) * 100)}</span></div>`).join("");
}

function regionRows(orders) {
  const regions = groupBy(orders, order => order.zone);
  const max = Math.max(...regions.map(item => item.value), 1);
  if (!regions.length) return '<div class="empty-state">No regional data available.</div>';
  return regions.map(item => `<div class="region-row"><span class="region-name">${escapeHtml(item.name)} India</span><div class="bar-track"><div class="bar-fill" style="width:${item.value / max * 100}%"></div></div><span class="category-amount">${compactInr(item.value)}</span></div>`).join("");
}

function donutMarkup(orders) {
  const channels = groupBy(orders, order => order.channel);
  const total = sum(channels, item => item.value);
  if (!total) return '<div class="empty-state">No channel data available.</div>';
  const colors = ["#347f55", "#86b98e", "#d6ac6c"];
  let offset = 0;
  const circles = channels.map((item, index) => {
    const dash = item.value / total * 100;
    const circle = `<circle cx="60" cy="60" r="44" stroke="${colors[index % colors.length]}" stroke-dasharray="${dash} ${100 - dash}" stroke-dashoffset="${-offset}"></circle>`;
    offset += dash;
    return circle;
  }).join("");
  const legend = channels.map((item, index) => `<div class="legend-item"><span class="legend-dot" style="background:${colors[index % colors.length]}"></span>${escapeHtml(item.name)}<strong>${percent(item.value / total * 100)}</strong></div>`).join("");
  return `<div class="donut-wrap"><div class="donut"><svg viewBox="0 0 120 120" aria-label="Sales by channel">${circles}</svg><div class="donut-center"><strong>${compactInr(total)}</strong><small>total sales</small></div></div><div class="legend-stack">${legend}</div></div>`;
}

function customerDonutMarkup(orders) {
  const segments = groupBy(orders, order => order.customerType, () => 1);
  const total = sum(segments, item => item.value);
  if (!total) return '<div class="empty-state">No customer data available.</div>';
  const colors = ["#347f55", "#d6ac6c"];
  let offset = 0;
  const circles = segments.map((item, index) => {
    const dash = item.value / total * 100;
    const circle = `<circle cx="60" cy="60" r="44" stroke="${colors[index % colors.length]}" stroke-dasharray="${dash} ${100 - dash}" stroke-dashoffset="${-offset}"></circle>`;
    offset += dash;
    return circle;
  }).join("");
  const legend = segments.map((item, index) => `<div class="legend-item"><span class="legend-dot" style="background:${colors[index % colors.length]}"></span>${escapeHtml(item.name)}<strong>${percent(item.value / total * 100)}</strong></div>`).join("");
  return `<div class="donut-wrap"><div class="donut"><svg viewBox="0 0 120 120" aria-label="New and returning customer orders">${circles}</svg><div class="donut-center"><strong>${number.format(total)}</strong><small>orders</small></div></div><div class="legend-stack">${legend}</div></div>`;
}

function productRows(orders, limit = 5) {
  const totals = new Map();
  orders.forEach(order => {
    const item = totals.get(order.product.name) || { product: order.product, sales: 0, units: 0, orders: 0, profit: 0 };
    item.sales += order.sales;
    item.units += order.units;
    item.orders += 1;
    item.profit += order.profit;
    totals.set(order.product.name, item);
  });
  return Array.from(totals.values()).sort((a, b) => b.sales - a.sales).slice(0, limit);
}

function productTable(orders, limit = 5) {
  const rows = productRows(orders, limit);
  if (!rows.length) return '<div class="empty-state">No products match these filters.</div>';
  return `<table class="product-table"><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>UNITS</th><th>SALES</th><th>MARGIN</th></tr></thead><tbody>${rows.map(item => `<tr><td class="product-name-cell"><span class="product-emoji">${item.product.emoji}</span>${escapeHtml(item.product.name)}</td><td>${escapeHtml(item.product.category)}</td><td>${number.format(item.units)}</td><td><strong>${inr.format(item.sales)}</strong></td><td><span class="trend-pill">${percent(item.profit / Math.max(item.sales, 1) * 100)}</span></td></tr>`).join("")}</tbody></table>`;
}

function kpiCards(orders, previous) {
  const sales = sum(orders, order => order.sales);
  const profit = sum(orders, order => order.profit);
  const previousSales = sum(previous, order => order.sales);
  const change = previousSales ? (sales - previousSales) / previousSales * 100 : 0;
  const customers = new Set(orders.map(order => order.customer)).size;
  const returned = orders.filter(order => order.returned).length;
  const returnRate = orders.length ? returned / orders.length * 100 : 0;
  const averageOrder = orders.length ? sales / orders.length : 0;
  return `<section class="kpi-grid" aria-label="Key performance indicators">
    <article class="kpi-card"><div class="kpi-top"><span>Sales</span><span class="kpi-icon">₹</span></div><div class="kpi-value">${compactInr(sales)}</div><div class="kpi-foot"><span class="${change >= 0 ? "positive" : "neutral"}">${change >= 0 ? "↗" : "↘"} ${Math.abs(change).toFixed(1)}%</span> vs previous period</div></article>
    <article class="kpi-card"><div class="kpi-top"><span>Orders</span><span class="kpi-icon">▤</span></div><div class="kpi-value">${number.format(orders.length)}</div><div class="kpi-foot"><span class="positive">${number.format(sum(orders, order => order.units))}</span> units sold</div></article>
    <article class="kpi-card"><div class="kpi-top"><span>Average order value</span><span class="kpi-icon">⌁</span></div><div class="kpi-value">${inr.format(averageOrder)}</div><div class="kpi-foot"><span class="neutral">${number.format(customers)} customers</span> in selected period</div></article>
    <article class="kpi-card"><div class="kpi-top"><span>Profit margin</span><span class="kpi-icon">◒</span></div><div class="kpi-value">${percent(sales ? profit / sales * 100 : 0)}</div><div class="kpi-foot"><span class="neutral">${percent(returnRate)}</span> order return rate</div></article>
  </section>`;
}

function overviewView(orders, days) {
  return `${kpiCards(orders, compareOrders(orders))}
    <section class="chart-grid">
      <article class="panel"><div class="panel-heading"><div><h2>Sales & profit trend</h2><p>${trendDescription(days)}</p></div><div class="chart-legend"><span class="legend-item"><i class="legend-dot"></i>Sales</span><span class="legend-item"><i class="legend-dot profit-key"></i>Profit</span></div></div><div class="chart-holder line-chart">${makeLineChart(orders, days)}</div></article>
      <article class="panel"><div class="panel-heading"><div><h2>Sales by category</h2><p>Category contribution to sales</p></div></div><div class="category-list">${categoryRows(orders)}</div><div class="panel-foot"><span>${new Set(orders.map(order => order.product.category)).size} active categories</span><span>Sales</span></div></article>
    </section>
    <section class="bottom-grid">
      <article class="panel"><div class="panel-heading"><div><h2>Sales by channel</h2><p>Where customers shop</p></div></div>${donutMarkup(orders)}</article>
      <article class="panel"><div class="panel-heading"><div><h2>Regional performance</h2><p>Sales across India</p></div></div><div class="region-list">${regionRows(orders)}</div><div class="panel-foot"><span>${new Set(orders.map(order => order.state)).size} states</span><span>Sales</span></div></article>
      <article class="panel"><div class="panel-heading"><div><h2>Top products</h2><p>Best performers by sales</p></div><button class="panel-action" data-go="products">View all →</button></div>${productTable(orders, 4)}</article>
    </section>
    <section class="insight-card" style="margin-top:15px"><span class="insight-icon">✦</span><div><strong>Quick insight</strong><p>${getInsight(orders)}</p></div></section>`;
}

function getInsight(orders) {
  if (!orders.length) return "Try widening your date range or clearing a filter to see more insights.";
  const categories = groupBy(orders, order => order.product.category);
  const top = categories[0];
  const profit = sum(orders, order => order.profit);
  const sales = sum(orders, order => order.sales);
  const returned = orders.filter(order => order.returned).length;
  return `${top.name} leads with ${percent(top.value / sales * 100)} of sales. Overall profit margin is ${percent(profit / sales * 100)}${orders.length ? `, with a ${percent(returned / orders.length * 100)} order return rate.` : "."}`;
}

function trendsView(orders, days) {
  const sales = sum(orders, order => order.sales);
  const profit = sum(orders, order => order.profit);
  const count = orders.length;
  return `${kpiCards(orders, compareOrders(orders))}
    <section class="panel wide-chart"><div class="panel-heading"><div><h2>Sales performance</h2><p>${trendDescription(days)} · INR</p></div><div class="chart-legend"><span class="legend-item"><i class="legend-dot"></i>Sales</span><span class="legend-item"><i class="legend-dot profit-key"></i>Profit</span></div></div><div class="line-chart">${makeLineChart(orders, days)}</div></section>
    <section class="chart-grid equal" style="margin-top:15px">
      <article class="panel"><div class="panel-heading"><div><h2>Category contribution</h2><p>Sales mix for the selected period</p></div></div><div class="category-list">${categoryRows(orders)}</div></article>
      <article class="panel"><div class="panel-heading"><div><h2>Channel mix</h2><p>Sales share by shopping channel</p></div></div><div class="category-list">${channelRows(orders)}</div></article>
    </section>
    <div class="mini-stat-grid"><div class="mini-stat"><span>Sales</span><strong>${compactInr(sales)}</strong></div><div class="mini-stat"><span>Profit earned</span><strong>${compactInr(profit)}</strong></div><div class="mini-stat"><span>Orders placed</span><strong>${number.format(count)}</strong></div></div>`;
}

function productsView(orders) {
  const items = productRows(orders, PRODUCTS.length);
  const units = sum(orders, order => order.units);
  return `${kpiCards(orders, compareOrders(orders))}
    <section class="panel table-panel"><div class="panel-heading"><div><h2>Product performance</h2><p>Ranked by sales · ${items.length} products in view</p></div></div>${productTable(orders, PRODUCTS.length)}</section>
    <section class="chart-grid equal"><article class="panel"><div class="panel-heading"><div><h2>Sales by category</h2><p>Compare category performance</p></div></div><div class="category-list">${categoryRows(orders)}</div></article><article class="panel"><div class="panel-heading"><div><h2>Product snapshot</h2><p>Summary for current filters</p></div></div><div class="mini-stat-grid" style="grid-template-columns:1fr 1fr"><div class="mini-stat"><span>Units sold</span><strong>${number.format(units)}</strong></div><div class="mini-stat"><span>Unique products</span><strong>${items.length}</strong></div><div class="mini-stat"><span>Top category</span><strong style="font-size:13px">${escapeHtml(groupBy(orders, order => order.product.category)[0]?.name || "—")}</strong></div><div class="mini-stat"><span>Average margin</span><strong>${percent(orders.length ? sum(orders, order => order.profit) / Math.max(sum(orders, order => order.sales), 1) * 100 : 0)}</strong></div></div></article></section>`;
}

function customersView(orders) {
  const customerSales = groupBy(orders, order => order.customer);
  const returning = orders.filter(order => order.customerType === "Returning").length;
  const newCustomers = orders.filter(order => order.customerType === "New").length;
  const avgRating = orders.length ? sum(orders, order => order.rating) / orders.length : 0;
  const values = customerSales.map(item => item.value).sort((a, b) => b - a);
  const topCustomersSales = values.slice(0, Math.ceil(values.length * 0.2)).reduce((a, b) => a + b, 0);
  const totalSales = sum(orders, order => order.sales);
  const topCustomers = customerSales.sort((a, b) => b.value - a.value).slice(0, 8);
  return `<section class="kpi-grid">
      <article class="kpi-card"><div class="kpi-top"><span>Unique customers</span><span class="kpi-icon">♙</span></div><div class="kpi-value">${number.format(new Set(orders.map(order => order.customer)).size)}</div><div class="kpi-foot"><span class="neutral">Across selected filters</span></div></article>
      <article class="kpi-card"><div class="kpi-top"><span>Returning orders</span><span class="kpi-icon">↻</span></div><div class="kpi-value">${percent(orders.length ? returning / orders.length * 100 : 0)}</div><div class="kpi-foot"><span class="positive">${number.format(returning)}</span> repeat-customer orders</div></article>
      <article class="kpi-card"><div class="kpi-top"><span>New-customer orders</span><span class="kpi-icon">＋</span></div><div class="kpi-value">${number.format(newCustomers)}</div><div class="kpi-foot"><span class="neutral">In the selected period</span></div></article>
      <article class="kpi-card"><div class="kpi-top"><span>Average rating</span><span class="kpi-icon">☆</span></div><div class="kpi-value">${avgRating.toFixed(1)} <span style="font-size:13px;color:#8a958e">/ 5</span></div><div class="kpi-foot"><span class="neutral">Order-level sample rating</span></div></article>
    </section>
    <section class="customer-grid">
      <article class="segment-card"><h3>Customer loyalty</h3>${customerDonutMarkup(orders)}<div class="segment-stat"><span>Returning orders</span><strong>${number.format(returning)}</strong></div><div class="segment-stat"><span>New-customer orders</span><strong>${number.format(newCustomers)}</strong></div></article>
      <article class="segment-card"><h3>Sales concentration</h3><div class="mini-stat"><span>Top 20% of customers contribute</span><strong>${percent(totalSales ? topCustomersSales / totalSales * 100 : 0)}</strong></div><div class="segment-stat"><span>Average sales per customer</span><strong>${inr.format(customerSales.length ? totalSales / customerSales.length : 0)}</strong></div><div class="segment-stat"><span>Active customers</span><strong>${number.format(customerSales.length)}</strong></div></article>
      <article class="segment-card"><h3>Customer experience</h3><div class="mini-stat"><span>Average order rating</span><strong>${avgRating.toFixed(1)} / 5</strong></div><div class="segment-stat"><span>Orders rated 4.5+</span><strong>${number.format(orders.filter(order => order.rating >= 4.5).length)}</strong></div><div class="segment-stat"><span>Average delivery</span><strong>${orders.length ? (sum(orders, order => order.deliveryDays) / orders.length).toFixed(1) : "0.0"} days</strong></div></article>
    </section>
    <section class="panel table-panel"><div class="panel-heading"><div><h2>Top customers</h2><p>Highest sales in the selected period</p></div></div><table class="product-table"><thead><tr><th>CUSTOMER</th><th>ORDERS</th><th>SALES</th><th>SHARE</th></tr></thead><tbody>${topCustomers.map(item => { const customerOrders = orders.filter(order => order.customer === item.name); return `<tr><td class="product-name-cell"><span class="product-emoji">♙</span>${escapeHtml(item.name)}</td><td>${number.format(customerOrders.length)}</td><td><strong>${inr.format(item.value)}</strong></td><td>${percent(totalSales ? item.value / totalSales * 100 : 0)}</td></tr>`; }).join("") || '<tr><td colspan="4" class="empty-state">No customer data for this selection.</td></tr>'}</tbody></table></section>`;
}

const VIEWS = {
  overview: { title: "Good morning, Aditi", subtitle: "Here’s what’s happening across your stores today.", render: overviewView },
  trends: { title: "Sales trends", subtitle: "Track revenue, profit and channel mix over time.", render: trendsView },
  products: { title: "Product performance", subtitle: "Explore what customers are buying across your catalog.", render: productsView },
  customers: { title: "Customer insights", subtitle: "Understand loyalty, experience and customer value.", render: customersView }
};

function render() {
  const orders = filteredOrders();
  const { days, state, category } = selectedFilters();
  const view = VIEWS[activeView];
  document.querySelector("#page-title").innerHTML = `${view.title}${activeView === "overview" ? ' <span class="wave">✦</span>' : ""}`;
  document.querySelector("#page-subtitle").textContent = view.subtitle;
  document.querySelector("#breadcrumb-current").textContent = activeView === "overview" ? "Overview" : view.title;
  document.querySelector("#view-content").innerHTML = view.render(orders, days);
  const descriptions = [];
  if (state !== "all") descriptions.push(state);
  if (category !== "all") descriptions.push(category);
  document.querySelector("#filter-summary").textContent = descriptions.length ? `Showing ${number.format(orders.length)} orders · ${descriptions.join(" · ")}` : `${number.format(orders.length)} orders in the selected period`;
}

function downloadCsv() {
  const orders = filteredOrders();
  const columns = ["Order ID", "Date", "State", "Zone", "Product", "Category", "Units", "Sales (INR)", "Profit (INR)", "Channel", "Customer", "Returned"];
  const rows = orders.map(order => [
    order.id, order.date.toISOString().slice(0, 10), order.state, order.zone,
    order.product.name, order.product.category, order.units, order.sales,
    order.profit, order.channel, order.customer, order.returned ? "Yes" : "No"
  ]);
  const csv = [columns, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  link.download = "india-retail-pulse-orders.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function initialize() {
  const stateFilter = document.querySelector("#state-filter");
  STATES.map(state => state.name).sort().forEach(state => {
    stateFilter.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(state)}">${escapeHtml(state)}</option>`);
  });
  Array.from(new Set(PRODUCTS.map(product => product.category))).sort().forEach(category => {
    document.querySelector("#category-filter").insertAdjacentHTML("beforeend", `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`);
  });
  document.querySelectorAll(".nav-link").forEach(button => button.addEventListener("click", () => {
    activeView = button.dataset.view;
    document.querySelectorAll(".nav-link").forEach(link => link.classList.toggle("active", link === button));
    render();
  }));
  document.querySelector("#view-content").addEventListener("click", event => {
    const button = event.target.closest("[data-go]");
    if (button) {
      activeView = button.dataset.go;
      document.querySelectorAll(".nav-link").forEach(link => link.classList.toggle("active", link.dataset.view === activeView));
      render();
    }
  });
  ["#period-filter", "#state-filter", "#category-filter"].forEach(selector => document.querySelector(selector).addEventListener("change", render));
  document.querySelector("#export-button").addEventListener("click", downloadCsv);
  render();
}

initialize();
