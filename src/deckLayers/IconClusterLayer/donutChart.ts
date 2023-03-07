import {DEFAULT_CLUSTER_BK_COLOR} from '../../components/defaults';

function svgToDataURL(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// SVG donut chart from feature properties

function createDonutChart(colorCounts) {
  const offsets: number[] = [];

  const bkColor = DEFAULT_CLUSTER_BK_COLOR

  const counts: Array<{count: number, label: string}> = Object.values(colorCounts)
  const colors: string[] = Object.keys(colorCounts)
  let total = 0;

  if (counts.length) {
    counts.forEach((item, i)=> {
      offsets.push(total);
      total += item.count;
    })
  }

  const fontSize =
    total >= 1000 ? 70 : total >= 100 ? 42 : total >= 10 ? 34 : 30;
  const r = total >= 1000 ? 100 : total >= 100 ? 64 : total >= 10 ? 48 : 36;
  const r0 = Math.round(r * 0.73);
  let w = r * 2;
  w = total === 1 ? w * 3 : w; // single point

  let svg = `
  <svg width="${w}" height="${w}" stroke-width="1" viewbox="0 0 ${w} ${w}" 
  xmlns="http://www.w3.org/2000/svg"
  text-anchor="middle" style="font: ${fontSize}px arial; font-weight: lighter; display: block">`;

  if (total > 1) {
    for (let i = 0; i < counts.length; i++) {
      svg += donutSegment(
        offsets[i] / total,
        (offsets[i] + counts[i].count) / total,
        r,
        r0,
          colors[i],
      );
    }
  }

  let fillColor = total > 1 ? bkColor : colors[0] // singleColor
  svg += `<circle cx="${total === 1 ? r * 3 : r}" cy="${
    total === 1 ? r * 3 : r
  }" r="${total === 1 ? r0 * 1.35 : r0}" fill="${fillColor}"  />
  <text dominant-baseline="central" transform="translate(${r}, ${r})" >
  ${total === 1 ? '' : total}
  </text>
  </svg>
  `;

  return svg;
}

function donutSegment(start, end, r, r0, color) {
  if (end - start === 1) {end -= 0.00001;}
  const a0 = 2 * Math.PI * (start - 0.25);
  const a1 = 2 * Math.PI * (end - 0.25);
  const x0 = Math.cos(a0),
    y0 = Math.sin(a0);
  const x1 = Math.cos(a1),
    y1 = Math.sin(a1);
  const largeArc = end - start > 0.5 ? 1 : 0;

  // draw an SVG path
  return `<path d="M ${r + r0 * x0} ${r + r0 * y0} L ${r + r * x0} ${
    r + r * y0
  } A ${r} ${r} 0 ${largeArc} 1 ${r + r * x1} ${r + r * y1} L ${r + r0 * x1} ${
    r + r0 * y1
  } A ${r0} ${r0} 0 ${largeArc} 0 ${r + r0 * x0} ${
    r + r0 * y0
  }" fill="${color}" />`;
}

export { svgToDataURL, createDonutChart };
