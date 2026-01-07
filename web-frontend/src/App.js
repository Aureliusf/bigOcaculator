
import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { gruvboxDark } from '@uiw/codemirror-theme-gruvbox-dark';
import './App.css';

const functionTemplate = `/**
* Paste your algorithm here.
* Function name MUST be 'functionToTest'.
*/
function functionToTest(input) {
  // Your code here
}`;

function App() {
    const [code, setCode] = useState(functionTemplate);
    const [algoName, setAlgoName] = useState('');
    const [inputMode, setInputMode] = useState('array');
    const [growthStrategy, setGrowthStrategy] = useState('powersOf10');
    const [useSuperRange, setUseSuperRange] = useState(false);
    const [powersOf10Count, setPowersOf10Count] = useState(4);
    const [doublingStart, setDoublingStart] = useState(1);
    const [doublingCount, setDoublingCount] = useState(10);
    const [linearStart, setLinearStart] = useState(100);
    const [linearEnd, setLinearEnd] = useState(1000);
    const [linearStep, setLinearStep] = useState(100);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isBigOVisible, setIsBigOVisible] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setResult(null);

        let inputSizes;
        if (useSuperRange) {
            inputSizes = Array.from({ length: 100 }, (_, i) => (i + 1) * 10);
        } else {
            switch (growthStrategy) {
                case 'powersOf10':
                    inputSizes = Array.from({ length: powersOf10Count }, (_, i) => 10 ** (i + 1));
                    break;
                case 'doubling':
                    inputSizes = Array.from({ length: doublingCount }, (_, i) => doublingStart * (2 ** i));
                    break;
                case 'linear':
                    inputSizes = [];
                    for (let i = linearStart; i <= linearEnd; i += linearStep) {
                        inputSizes.push(i);
                    }
                    break;
                default:
                    inputSizes = [10, 100, 1000, 10000];
            }
        }

        const payload = { code, algoName, inputMode, inputSizes };
        console.log('Sending payload:', payload);

        try {
            const response = await fetch('http://localhost:3001/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
                if (data.confidence >= 75) {
                    setIsBigOVisible(true);
                } else {
                    setIsBigOVisible(false);
                }
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to connect to the server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Big O Calculator</h1>
            </header>
            <main>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="algoName">Algorithm Name</label>
                        <input
                            id="algoName"
                            type="text"
                            value={algoName}
                            onChange={(e) => setAlgoName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="codeInput">Code</label>
                        <CodeMirror
                            className="code-editor-wrapper"
                            id="codeInput"
                            value={code}
                            extensions={[javascript({ jsx: true })]}
                            onChange={(value, viewUpdate) => {
                                setCode(value);
                            }}
                            theme={gruvboxDark}
                        />
                    </div>
                    <div className="form-group">
                        <fieldset>
                            <legend>Input Mode</legend>
                            <label>
                                <input
                                    type="radio"
                                    value="array"
                                    checked={inputMode === 'array'}
                                    onChange={(e) => setInputMode(e.target.value)}
                                />
                                Array
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="number"
                                    checked={inputMode === 'number'}
                                    onChange={(e) => setInputMode(e.target.value)}
                                />
                                Number
                            </label>
                        </fieldset>
                    </div>
                    <div className="form-group">
                        <label htmlFor="growthStrategy">Growth Strategy</label>
                        <select
                            id="growthStrategy"
                            value={growthStrategy}
                            onChange={(e) => setGrowthStrategy(e.target.value)}
                            disabled={useSuperRange}
                        >
                            <option value="powersOf10">Powers of 10</option>
                            <option value="doubling">Doubling</option>
                            <option value="linear">Linear</option>
                            {growthStrategy === 'custom' && <option value="custom">Custom</option>}
                        </select>
                    </div>

                    {!useSuperRange && (
                        <div className="form-group-options">
                            {growthStrategy === 'powersOf10' && (
                                <div className="form-group">
                                    <label htmlFor="powersOf10Count">Number of Powers</label>
                                    <input
                                        id="powersOf10Count"
                                        type="number"
                                        value={powersOf10Count}
                                        onChange={(e) => setPowersOf10Count(parseInt(e.target.value))}
                                    />
                                </div>
                            )}
                            {growthStrategy === 'doubling' && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="doublingStart">Start Value</label>
                                        <input
                                            id="doublingStart"
                                            type="number"
                                            value={doublingStart}
                                            onChange={(e) => setDoublingStart(parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="doublingCount">Number of Doublings</label>
                                        <input
                                            id="doublingCount"
                                            type="number"
                                            value={doublingCount}
                                            onChange={(e) => setDoublingCount(parseInt(e.target.value))}
                                        />
                                    </div>
                                </>
                            )}
                            {growthStrategy === 'linear' && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="linearStart">Start</label>
                                        <input
                                            id="linearStart"
                                            type="number"
                                            value={linearStart}
                                            onChange={(e) => setLinearStart(parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="linearEnd">End</label>
                                        <input
                                            id="linearEnd"
                                            type="number"
                                            value={linearEnd}
                                            onChange={(e) => setLinearEnd(parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="linearStep">Step</label>
                                        <input
                                            id="linearStep"
                                            type="number"
                                            value={linearStep}
                                            onChange={(e) => setLinearStep(parseInt(e.target.value))}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={useSuperRange}
                                onChange={(e) => setUseSuperRange(e.target.checked)}
                            />
                            High Precision (Super Range)
                        </label>
                    </div>
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Analyzing...' : 'Analyze'}
                    </button>
                </form>

                {error && <div className="error">{error}</div>}

                {result && (
                    <div className="results">
                        <h2>Results</h2>
                        {isBigOVisible ? (
                            <p><strong>Big O:</strong> {result.bigO}</p>
                        ) : (
                            <p className="low-confidence" onClick={() => setIsBigOVisible(true)}>
                                <strong>Big O:</strong> Low confidence in this result. Click to reveal.
                            </p>
                        )}
                        <p><strong>Confidence:</strong> {result.confidence.toFixed(2)}%</p>
                        <p><strong>RMSE:</strong> {result.rmse.toFixed(4)}</p>
                        <img src={`data:image/png;base64,${result.graphBase64}`} alt="Complexity Graph" />
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
