import {ALERTING_STATES, DEFAULT_CLUSTER_BK_COLOR} from '../../components/defaults';

function svgToDataURL(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// SVG donut chart from feature properties

function createDonutChart({colorCounts, annotStateCounts, allTotal, allStTotal}) {
  const bkColor = DEFAULT_CLUSTER_BK_COLOR
  const stOffsets: number[] = []
  const offsets: number[] = [];
  let total = 0
  let stTotal = 0
  const hasAnnots = allStTotal //(allStTotal - allTotal) > 0
  if (hasAnnots) {
 // console.log('annotStateCounts', annotStateCounts, colorCounts)
    }
  const counts: any[] = Object.values(colorCounts)
  const colors: string[] = Object.keys(colorCounts)


  if (counts.length) {
    counts.forEach((item, i)=> {
      offsets.push(total);
      total += item.count;
    })
  }


  if (hasAnnots) {
    annotStateCounts[bkColor] =
        {
          count: allTotal,
          label: 'Unknown'
        }
  }

  const desiredOrder = [
    bkColor,
    ALERTING_STATES.Alerting,
    ALERTING_STATES.Pending,
    ALERTING_STATES.Normal,
  ];

  const stCounts: any[] = [];
  const stColors: string[] = [];

  desiredOrder.forEach(key => {
    const count = annotStateCounts[key];
    if (count !== undefined) {
      stCounts.push(count);
      stColors.push(key);
    }
  });
  // const stCounts: any[] = Object.values(annotStateCounts)
  // const stColors: string[] = Object.keys(annotStateCounts)


  if (hasAnnots) {
    stCounts.forEach((item, i)=> {
      stOffsets.push(stTotal);
      stTotal += item.count;
    })

    // stTotal += allTotal

  }

  const fontSize =
    total >= 1000 ? 70 : total >= 100 ? 42 : total >= 10 ? 34 : 30;
  const r = total >= 1000 ? 100 : total >= 100 ? 64 : total >= 10 ? 48 : 36;
  const r0 = Math.round(r * 0.73);
  let w = r * 2;
  w = total === 1 ? w * 3 : w; // single point

  let svg = `
  <svg width="${w}" height="${w}" stroke-width="1" viewBox="0 0 ${w} ${w}" 
  xmlns="http://www.w3.org/2000/svg"
  text-anchor="middle" style="font: ${fontSize}px arial; font-weight: lighter; display: block">`;

  // Mask definition
  svg += `<defs>
            <mask id="donutMask">
              <circle cx="${r}" cy="${r}" r="${r0}" fill="white"/>
            </mask>
          </defs>`;

  // Drawing outer segments
  let startAngle = 0;

    for (let i = 0; i < counts.length; i++) {
      const endAngle = startAngle + (counts[i].count / total) * 360;
      svg += donutSegment(
          startAngle / 360,
          endAngle / 360,
          r,
          r0,
          colors[i]
      );
      startAngle = endAngle;
    }

  //Drawing central circle filled with default color when no annotations in cluster

    let fillColor = bkColor //total > 1 ? bkColor : colors[0]; // singleColor
    svg += `<circle cx="${total === 1 ? r * 3 : r}" cy="${total === 1 ? r * 3 : r}" r="${total === 1 ? r0 * 1.35 : r0}" fill="${fillColor}"  />`


    // Drawing horizontal stripes inside the donut chart
    let revertOffset = r - r0;
    let stripeOffset = revertOffset
    for (let i = 0; i < stOffsets.length; i++) {
      const stripeHeight = (stCounts[i].count / stTotal) * (w - revertOffset * 2);
      svg += `<rect x="0" y="${stripeOffset}" width="${w}" height="${stripeHeight}" fill="${stColors[i]}" mask="url(#donutMask)"/>`;
      stripeOffset += stripeHeight;
    }

    svg += `<text dominant-baseline="central" transform="translate(${r}, ${r})" >
    ${allTotal + allStTotal === 1 ? '' : allTotal + allStTotal}
    </text>`



  svg += `</svg>`;

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
