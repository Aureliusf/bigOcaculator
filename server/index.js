
const express = require('express');
const cors = require('cors');
const { VM } = require('vm2');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { runAnalysis, determineComplexity } = require('../src/calculator');

const app = express();
const port = 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: 800,
    height: 600,
    chartCallback: (ChartJS) => {
        ChartJS.defaults.color = 'white';
        ChartJS.defaults.font.family = 'sans-serif';
    }
});

app.post('/api/analyze', (req, res) => {
    const { code, algoName, inputMode, inputSizes } = req.body;

    console.log('Received payload:', req.body);

    if (!code || typeof code !== 'string' ||
        !algoName || typeof algoName !== 'string' ||
        !inputMode || (inputMode !== 'array' && inputMode !== 'number') ||
        !inputSizes || !Array.isArray(inputSizes) || inputSizes.length === 0 || !inputSizes.every(n => typeof n === 'number')) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        const dataPoints = runAnalysis(code, inputSizes, 10, inputMode);

        if (dataPoints.length === 0) {
            return res.status(400).json({ error: 'Analysis produced no data points. Input sizes might be too small.' });
        }

        const { bestFit, confidence, results } = determineComplexity(dataPoints);
        const bigO = bestFit;
        const bestModelResult = results.find(r => r.type === bigO);
        const rmse = bestModelResult ? bestModelResult.rmse : 0;

        const executionTimes = dataPoints.map(p => p.time);

        const configuration = {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Execution Time (ms)',
                    data: dataPoints.map(p => ({ x: p.n, y: p.time })),
                    borderColor: 'rgb(177, 98, 134)',
                    backgroundColor: 'rgba(177, 98, 134, 0.5)',
                    tension: 0.1
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `Big O Complexity Analysis - Detected: ${bigO}`,
                        padding: {
                            top: 10,
                            bottom: 30
                        }
                    },
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'logarithmic',
                        title: {
                            display: true,
                            text: 'Input Size (n)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Time (ms)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                layout: {
                    padding: 20
                }
            },
            plugins: [{
                id: 'customCanvasBackgroundColor',
                beforeDraw: (chart, args, options) => {
                    const { ctx } = chart;
                    ctx.save();
                    ctx.globalCompositeOperation = 'destination-over';
                    ctx.fillStyle = options.color || '#1e1e1e';
                    ctx.fillRect(0, 0, chart.width, chart.height);
                    ctx.restore();
                },
                options: {
                    color: '#1e1e1e'
                }
            }]
        };

        chartJSNodeCanvas.renderToBuffer(configuration).then((imageBuffer) => {
            const graphBase64 = imageBuffer.toString('base64');
            res.json({ bigO, confidence, rmse, graphBase64 });
        }).catch(err => {
            console.error('Error generating graph:', err);
            res.status(500).json({ error: 'Error generating graph' });
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
