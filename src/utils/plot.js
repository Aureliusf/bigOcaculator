const fs = require('fs');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const width = 800; // px
const height = 600; // px

async function createGraph(dataPoints, bestFit, confidence, outputPath = 'graph.png') {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const nValues = dataPoints.map(d => d.n);
  const timeValues = dataPoints.map(d => d.time);

  const lowConfidencePlugin = {
    id: 'lowConfidenceBanner',
    afterDraw: (chart) => {
      if (confidence < 75) {
        const { ctx, chartArea: { top, bottom, left, right, width: chartWidth, height: chartHeight } } = chart;

        ctx.save();

        // Banner settings
        const text = `Warning: Low Accuracy (${confidence}%)`;
        const fontSize = 16;
        const padding = 10;

        ctx.font = `bold ${fontSize}px sans-serif`;
        const textWidth = ctx.measureText(text).width;

        // Draw background rectangle (Red)
        const rectWidth = textWidth + (padding * 2);
        const rectHeight = fontSize + (padding * 2);
        const x = right - rectWidth - 10; // 10px from right edge
        const y = top + 10; // 10px from top edge

        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.fillRect(x, y, rectWidth, rectHeight);

        // Draw text (White)
        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + padding, y + (rectHeight / 2));

        ctx.restore();
      }
    }
  };

  const configuration = {
    type: 'line',
    data: {
      labels: nValues,
      datasets: [
        {
          label: 'Execution Time (ms)',
          data: timeValues,
          borderColor: 'rgb(177, 98, 134)',
          backgroundColor: 'rgba(177, 98, 134, 0.5)',
          tension: 0.1,
          fill: false,
          pointRadius: 2
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: `Big O Complexity Analysis - Detected: ${bestFit}`
        },
        legend: {
          display: true
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Input Size (n)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Time (ms)'
          },
          beginAtZero: true
        }
      }
    },
    plugins: [lowConfidencePlugin]
  };

  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  fs.writeFileSync(outputPath, image);
  return outputPath;
}

module.exports = {
  createGraph
};
