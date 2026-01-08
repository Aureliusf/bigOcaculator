# Big O Notation Calculator

A full-stack web application designed to analyze the time complexity (Big O notation) of JavaScript functions. Submit your code, choose an input growth strategy, and get back a semi-detailed analysis with a confidence score and visual representation of its performance.

![Screenshot](./Big%20O%20Calculator.png)

Pending Live Demo: 


---

Key Features
*   Secure Code Execution: User-submitted code is executed in a secure vm2 sandbox on the server without network access and package imports deactivated. Furthermore, each run has a strict 5-second timeout. With this two exceptions, we prevent infinite loops and malicious code.
*   Confidence Scoring: The analysis engine provides a confidence percentage for its Big O prediction. If confidence is below 75%, the result is hidden behind a warning, prompting the user to consider the result's limitations.
*   Dynamic UI: The frontend, built with React, dynamically adjusts input fields based on the user's chosen "Growth Strategy", making the interface intuitive and clean.
*   Data Visualization: The backend uses chartjs-node-canvas to generate a dark-themed graph visualizing the relationship between input size (n) and execution time, helping to make performance characteristics immediately obvious.
*   Gruvbox inspired Interface: A sleek and modern dark mode UI with purple accents, because gruvbox is best.
*   Interactive Code Editor: A feature-rich CodeMirror editor provides JavaScript syntax highlighting, and Gruvbox dark theme, line numbers for a superior user experience. No VIM mode, yet 👀

---

Technologies Used
*   Frontend: React, CodeMirror
*   Backend: Node.js, Express and vm2 Sandbox
*   Data Visualization: chartjs-node-canvas

---

## Getting Started
### Prerequisites
*   Node.js 
*   npm

### Installation & Running the App
1.  Clone the repository:
    ```
          git clone https://github.com/Aureliusf/bigOcalculator.git
    ```

    ```
          cd bigOcalculator
    ```
    
2.  Install all dependencies:
    This single command will install dependencies for the root, server, and web-frontend packages.
    ```
        npm install && (cd server && npm install) && (cd web-frontend && npm install)
    ```
    
3.  Start the application:
    This command will start both the backend server and the frontend React development server.
    ```
        npm run start:web
    ```
    
The application will be available at http://localhost:3000.

---

## How to Use
Once the webapp is running you can:
1.  Write Your Code: Enter the JavaScript function you want to analyze into the code editor.
2.  Select Growth Strategy: Choose how the input size (n) should grow for the test:
    *   Powers of 10: Good for a broad overview (e.g., 10, 100, 1000).
    *   Doubling: Useful for observing exponential trends (e.g., 100, 200, 400).
    *   Linear: Good for granular observation in a specific range (e.g., 1000, 2000, 3000).
    *   High Precision: Big range for testing log(n) complexity.
3.  Configure Parameters: Set the start and end points for your chosen strategy.
4.  Run Analysis: Click the "Run Analysis" button. The server will execute your code with the specified inputs, analyze the performance, and return the results.
5.  View Results: The calculated Big O notation, confidence score, and performance graph will be displayed.
