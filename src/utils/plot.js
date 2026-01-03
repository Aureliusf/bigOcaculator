const fs = require('fs');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const width = 800; // px
const height = 600; // px

async function createGraph(dataPoints, bestFit, outputPath = 'graph.png') {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const nValues = dataPoints.map(d => d.n);
  const timeValues = dataPoints.map(d => d.time);

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
    }
  };

  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  fs.writeFileSync(outputPath, image);
  return outputPath;
}

module.exports = {
  createGraph
};
