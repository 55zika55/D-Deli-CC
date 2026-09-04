export const HTML_CHART_SCRIPTS = `
// ==================== SVG Charts Generator ====================
function generateDonutChartSVG(data, width=320, height=220){
  if(!data || data.length === 0) return '<div style="color:var(--mut);text-align:center;padding:20px">No data</div>';
  const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0);
  if(total <= 0) return '<div style="color:var(--mut);text-align:center;padding:20px">No data</div>';
  
  const cx = width / 2;
  const cy = height / 2 - 10;
  const radius = Math.min(cx, cy) - 20;
  const innerRadius = radius * 0.58;
  
  const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b', '#14b8a6', '#f97316'];
  let startAngle = 0;
  
  let paths = '';
  data.forEach((d, idx) => {
    if(d.value <= 0) return;
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    
    const ix1 = cx + innerRadius * Math.cos(endAngle);
    const iy1 = cy + innerRadius * Math.sin(endAngle);
    const ix2 = cx + innerRadius * Math.cos(startAngle);
    const iy2 = cy + innerRadius * Math.sin(startAngle);
    
    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    const color = colors[idx % colors.length];
    const pct = ((d.value / total) * 100).toFixed(1);
    
    const pathData = [
      'M', x1, y1,
      'A', radius, radius, 0, largeArcFlag, 1, x2, y2,
      'L', ix1, iy1,
      'A', innerRadius, innerRadius, 0, largeArcFlag, 0, ix2, iy2,
      'Z'
    ].join(' ');
    
    paths += '<path d="' + pathData + '" fill="' + color + '" stroke="var(--card)" stroke-width="2"><title>' + esc(d.label) + ': ' + money(d.value) + ' (' + pct + '%)</title></path>';
    startAngle = endAngle;
  });
  
  return '<svg viewBox="0 0 ' + width + ' ' + height + '" style="width:100%;max-width:' + width + 'px;height:auto;display:block;margin:0 auto">' +
    paths +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + innerRadius + '" fill="var(--card)" />' +
    '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" font-size="11" fill="var(--mut)">' + (currentLang==='ar'?'الإجمالي':'Total') + '</text>' +
    '<text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--navy)">' + money(total) + '</text>' +
    '</svg>';
}

function generateBarChartSVG(items, width=460, height=220){
  if(!items || items.length === 0) return '<div style="color:var(--mut);text-align:center;padding:20px">No data</div>';
  const maxVal = Math.max(...items.map(d => d.value), 1);
  const barHeight = 18;
  const gap = 8;
  const startY = 15;
  const labelWidth = 140;
  const barMaxWidth = width - labelWidth - 80;
  
  let content = '';
  items.slice(0, 7).forEach((d, idx) => {
    const y = startY + idx * (barHeight + gap);
    const barW = Math.max(4, (d.value / maxVal) * barMaxWidth);
    const color = d.color || '#2563eb';
    
    content += '<g>' +
      '<text x="' + (labelWidth - 10) + '" y="' + (y + 13) + '" text-anchor="end" font-size="11" fill="var(--txt)">' + esc(d.label).substring(0, 18) + '</text>' +
      '<rect x="' + labelWidth + '" y="' + y + '" width="' + barW + '" height="' + barHeight + '" rx="4" fill="' + color + '" class="svg-bar"><title>' + esc(d.label) + ': ' + money(d.value) + '</title></rect>' +
      '<text x="' + (labelWidth + barW + 8) + '" y="' + (y + 13) + '" text-anchor="start" font-size="11" font-weight="bold" fill="var(--navy)">' + money(d.value) + '</text>' +
      '</g>';
  });
  
  const totalH = startY + Math.min(items.length, 7) * (barHeight + gap) + 10;
  return '<svg viewBox="0 0 ' + width + ' ' + totalH + '" style="width:100%;max-width:' + width + 'px;height:auto;display:block">' + content + '</svg>';
}
`;
