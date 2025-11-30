/* eslint-disable */
/* @ts-nocheck */
"use client";
import { useEffect } from "react";

export default function ArchimedesMethodExhaustionRieman() {
  useEffect(() => {
    const canvas = document.getElementById("mainCanvas");
    const chartCanvas = document.getElementById("chartCanvas");

    if (!canvas || !chartCanvas) return;

    const ctx = canvas.getContext("2d");
    const chartCtx = chartCanvas.getContext("2d");
    if (!ctx || !chartCtx) return;

    let n = 10;
    let autoInterval = null;
    let isAnimating = false;

    const padding = 55;
    const graphWidth = canvas.width - 2 * padding;
    const graphHeight = canvas.height - 2 * padding - 40;

    function f(x) {
      return x * x;
    }

    function toCanvasX(x) {
      return padding + x * graphWidth;
    }

    function toCanvasY(y) {
      return canvas.height - padding - 40 - y * graphHeight;
    }

    function drawAxes() {
      ctx.strokeStyle = "#2c3e50";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(padding, canvas.height - padding - 40);
      ctx.lineTo(canvas.width - padding, canvas.height - padding - 40);
      ctx.moveTo(padding, canvas.height - padding - 40);
      ctx.lineTo(padding, padding);
      ctx.stroke();

      ctx.fillStyle = "#2c3e50";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "center";

      for (let i = 0; i <= 10; i++) {
        const x = i / 10;
        const canvasX = toCanvasX(x);
        ctx.fillText(x.toFixed(1), canvasX, canvas.height - padding - 40 + 25);
      }

      ctx.textAlign = "right";
      for (let i = 0; i <= 10; i++) {
        const y = i / 10;
        const canvasY = toCanvasY(y);
        ctx.fillText(y.toFixed(1), padding - 10, canvasY + 4);
      }

      ctx.font = "bold 15px Arial";
      ctx.fillStyle = "#34495e";
      ctx.textAlign = "center";
      ctx.fillText(
        "x",
        canvas.width - padding + 20,
        canvas.height - padding - 40 + 5
      );
      ctx.save();
      ctx.translate(padding - 38, canvas.height / 2 - 20);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("y", 0, 0);
      ctx.restore();
    }

    function drawParabola() {
      ctx.strokeStyle = "#e74c3c";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let i = 0; i <= 400; i++) {
        const x = i / 400;
        const y = f(x);
        const canvasX = toCanvasX(x);
        const canvasY = toCanvasY(y);
        if (i === 0) ctx.moveTo(canvasX, canvasY);
        else ctx.lineTo(canvasX, canvasY);
      }
      ctx.stroke();
    }

    function drawRectangles(nLocal) {
      const dx = 1 / nLocal;

      for (let k = 1; k <= nLocal; k++) {
        const x1 = (k - 1) / nLocal;
        const x2 = k / nLocal;
        const h = f(x1);

        ctx.fillStyle = "rgba(102, 126, 234, 0.3)";
        ctx.strokeStyle = "#667eea";
        ctx.lineWidth = 1.5;

        const canvasX1 = toCanvasX(x1);
        const canvasX2 = toCanvasX(x2);
        const canvasY0 = toCanvasY(0);
        const canvasYh = toCanvasY(h);

        ctx.fillRect(
          canvasX1,
          canvasYh,
          canvasX2 - canvasX1,
          canvasY0 - canvasYh
        );
        ctx.strokeRect(
          canvasX1,
          canvasYh,
          canvasX2 - canvasX1,
          canvasY0 - canvasYh
        );
      }
    }

    function drawExactArea() {
      ctx.fillStyle = "rgba(46, 204, 113, 0.1)";
      ctx.strokeStyle = "#27ae60";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      const exactY = toCanvasY(1 / 3);
      ctx.beginPath();
      ctx.moveTo(padding, exactY);
      ctx.lineTo(canvas.width - padding, exactY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#27ae60";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Área exata = 1/3", padding + 5, exactY - 5);
    }

    function calculateArea(nLocal) {
      return 1 / 3 - 1 / (2 * nLocal) + 1 / (6 * nLocal * nLocal);
    }

    function drawChart() {
      chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

      const chartPadding = 50;
      const chartWidth = chartCanvas.width - 2 * chartPadding;
      const chartHeight = chartCanvas.height - 2 * chartPadding;

      // Eixos
      chartCtx.strokeStyle = "#2c3e50";
      chartCtx.lineWidth = 2;
      chartCtx.beginPath();
      chartCtx.moveTo(chartPadding, chartPadding);
      chartCtx.lineTo(chartPadding, chartCanvas.height - chartPadding);
      chartCtx.lineTo(
        chartCanvas.width - chartPadding,
        chartCanvas.height - chartPadding
      );
      chartCtx.stroke();

      // Linha de área exata
      chartCtx.strokeStyle = "#27ae60";
      chartCtx.lineWidth = 2;
      chartCtx.setLineDash([5, 5]);
      const exactY =
        chartCanvas.height - chartPadding - (1 / 3) * (chartHeight / 0.35);
      chartCtx.beginPath();
      chartCtx.moveTo(chartPadding, exactY);
      chartCtx.lineTo(chartCanvas.width - chartPadding, exactY);
      chartCtx.stroke();
      chartCtx.setLineDash([]);

      // Curva de convergência
      chartCtx.strokeStyle = "#667eea";
      chartCtx.lineWidth = 3;
      chartCtx.beginPath();

      const maxN = Math.max(n, 20);
      for (let i = 1; i <= maxN; i++) {
        const area = calculateArea(i);
        const x = chartPadding + (i / maxN) * chartWidth;
        const y =
          chartCanvas.height - chartPadding - (area * chartHeight) / 0.35;

        if (i === 1) chartCtx.moveTo(x, y);
        else chartCtx.lineTo(x, y);
      }
      chartCtx.stroke();

      // Ponto atual
      const currentArea = calculateArea(n);
      const currentX = chartPadding + (n / maxN) * chartWidth;
      const currentY =
        chartCanvas.height - chartPadding - (currentArea * chartHeight) / 0.35;

      chartCtx.fillStyle = "#e74c3c";
      chartCtx.beginPath();
      chartCtx.arc(currentX, currentY, 6, 0, 2 * Math.PI);
      chartCtx.fill();

      // Labels
      chartCtx.fillStyle = "#2c3e50";
      chartCtx.font = "bold 12px Arial";
      chartCtx.textAlign = "center";
      chartCtx.fillText(
        "n",
        chartCanvas.width - chartPadding / 2,
        chartCanvas.height - chartPadding + 30
      );
      chartCtx.save();
      chartCtx.translate(chartPadding - 30, chartCanvas.height / 2);
      chartCtx.rotate(-Math.PI / 2);
      chartCtx.fillText("Área", 0, 0);
      chartCtx.restore();
    }

    function updateDisplay() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawAxes();
      drawRectangles(n);
      drawParabola();
      drawExactArea();

      const area = calculateArea(n);
      const error = Math.abs(1 / 3 - area);

      const nValue = document.getElementById("nValue");
      const areaValue = document.getElementById("areaValue");
      const errorValue = document.getElementById("errorValue");
      const formulaDisplay = document.getElementById("formulaDisplay");

      if (nValue) nValue.textContent = String(n);
      if (areaValue) areaValue.textContent = area.toFixed(6);
      if (errorValue) errorValue.textContent = error.toFixed(6);
      if (formulaDisplay)
        formulaDisplay.textContent = `1/3 - 1/${2 * n} + 1/${6 * n * n}`;

      drawChart();
    }

    const slider = document.getElementById("nSlider");

    function onSliderInput(e) {
      n = parseInt(e.target.value, 10);
      updateDisplay();
    }

    if (slider) {
      slider.addEventListener("input", onSliderInput);
      slider.value = String(n);
    }

    function animateIncrease() {
      if (isAnimating) return;
      isAnimating = true;

      const startN = n;
      const endN = Math.min(startN + 20, 100);
      let current = startN;

      const interval = setInterval(() => {
        if (current >= endN) {
          clearInterval(interval);
          isAnimating = false;
          return;
        }
        current++;
        n = current;
        if (slider) slider.value = String(n);
        updateDisplay();
      }, 100);
    }

    function toggleAuto() {
      if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = null;
        return;
      }

      autoInterval = setInterval(() => {
        n = (n % 100) + 1;
        if (slider) slider.value = String(n);
        updateDisplay();
      }, 200);
    }

    function reset() {
      if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = null;
      }
      n = 10;
      if (slider) slider.value = String(n);
      updateDisplay();
    }

    const animateBtn = document.getElementById("animateBtn");
    const autoBtn = document.getElementById("autoBtn");
    const resetBtn = document.getElementById("resetBtn");

    if (animateBtn) animateBtn.addEventListener("click", animateIncrease);
    if (autoBtn) autoBtn.addEventListener("click", toggleAuto);
    if (resetBtn) resetBtn.addEventListener("click", reset);

    // Inicializa
    updateDisplay();

    // Cleanup ao desmontar
    return () => {
      if (slider) slider.removeEventListener("input", onSliderInput);
      if (animateBtn) animateBtn.removeEventListener("click", animateIncrease);
      if (autoBtn) autoBtn.removeEventListener("click", toggleAuto);
      if (resetBtn) resetBtn.removeEventListener("click", reset);
      if (autoInterval) clearInterval(autoInterval);
    };
  }, []);

  return (
    <main>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 15px;
        }
        
        .container {
          max-width: 1100px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 70px rgba(0,0,0,0.4);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 2em;
          margin-bottom: 8px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
          font-size: 1.1em;
          opacity: 0.95;
        }
        
        .content {
          padding: 20px;
        }
        
        .legend-top {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 15px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 10px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          font-size: 0.95em;
        }
        
        .legend-color {
          width: 28px;
          height: 28px;
          border-radius: 5px;
          border: 2px solid #34495e;
          flex-shrink: 0;
        }
        
        .canvas-container {
          background: #fafafa;
          border: 3px solid #ecf0f1;
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 15px;
          text-align: center;
        }
        
        canvas {
          max-width: 100%;
          height: auto;
          display: inline-block;
          background: white;
          border-radius: 8px;
        }
        
        .controls-bottom {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        
        .control-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .control-row:last-child {
          margin-bottom: 0;
        }
        
        label {
          font-weight: 600;
          color: #34495e;
          min-width: 180px;
          font-size: 0.95em;
        }
        
        input[type="range"] {
          flex: 1;
          height: 8px;
          border-radius: 4px;
          background: #e0e0e0;
          outline: none;
          -webkit-appearance: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        
        .value-display {
          min-width: 70px;
          text-align: center;
          font-weight: 700;
          color: #667eea;
          font-size: 1.2em;
          background: white;
          padding: 6px 12px;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .button-group {
          display: flex;
          gap: 10px;
          margin-top: 15px;
          flex-wrap: wrap;
        }
        
        .btn {
          flex: 1;
          min-width: 120px;
          padding: 10px 18px;
          border: none;
          border-radius: 8px;
          font-size: 0.95em;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 3px 8px rgba(0,0,0,0.2);
          white-space: nowrap;
        }
        
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(0,0,0,0.3);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-secondary {
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          color: white;
        }
        
        .btn-success {
          background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
          color: white;
        }
        
        .info-boxes {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .info-box {
          padding: 15px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .info-box.blue {
          background: linear-gradient(135deg, #e8f4f8 0%, #d4e9f7 100%);
          border-left: 4px solid #3498db;
        }
        
        .info-box.green {
          background: linear-gradient(135deg, #e8f8f5 0%, #d4f1e8 100%);
          border-left: 4px solid #2ecc71;
        }
        
        .info-box.orange {
          background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
          border-left: 4px solid #f39c12;
        }
        
        .info-box.purple {
          background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
          border-left: 4px solid #9b59b6;
        }
        
        .info-box h3 {
          margin-bottom: 8px;
          font-size: 1em;
        }
        
        .info-box.blue h3 { color: #2980b9; }
        .info-box.green h3 { color: #27ae60; }
        .info-box.orange h3 { color: #d68910; }
        .info-box.purple h3 { color: #8e44ad; }
        
        .info-box p {
          color: #34495e;
          font-size: 0.95em;
          line-height: 1.5;
        }
        
        .formula {
          font-family: 'Courier New', monospace;
          background: white;
          padding: 8px 12px;
          border-radius: 6px;
          display: inline-block;
          margin: 5px 0;
          font-size: 0.9em;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .convergence-chart {
          background: linear-gradient(135deg, #fff9e6 0%, #fff3cc 100%);
          padding: 20px;
          border-radius: 10px;
          border-left: 4px solid #f39c12;
          margin-bottom: 20px;
        }
        
        .convergence-chart h3 {
          color: #d68910;
          margin-bottom: 12px;
        }
        
        .chart-container {
          background: white;
          padding: 15px;
          border-radius: 8px;
          overflow-x: auto;
        }
        
        @media (max-width: 768px) {
          body { padding: 10px; }
          
          .header {
            padding: 20px 15px;
          }
          
          .header h1 {
            font-size: 1.5em;
          }
          
          .header p {
            font-size: 0.95em;
          }
          
          .content {
            padding: 15px;
          }
          
          .legend-top {
            flex-direction: column;
            gap: 10px;
          }
          
          .control-row {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
          
          label {
            min-width: auto;
            text-align: left;
          }
          
          .value-display {
            width: 100%;
          }
          
          .button-group {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
            min-width: auto;
          }
          
          .info-boxes {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 480px) {
          .header h1 {
            font-size: 1.3em;
          }
          
          .legend-item {
            font-size: 0.9em;
          }
          
          .legend-color {
            width: 24px;
            height: 24px;
          }
        }
      `}</style>

      <div className="container">
        <div className="header">
          <h1>🏛️ Método de Arquimedes</h1>
          <p>Aproximação por Retângulos Inscritos (Método Moderno)</p>
        </div>

        <div className="content">
          <div className="legend-top">
            <div className="legend-item">
              <div
                className="legend-color"
                style={{
                  background: "rgba(102, 126, 234, 0.3)",
                  borderColor: "#667eea",
                }}
              ></div>
              <span>Retângulos inscritos</span>
            </div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{
                  background: "none",
                  border: "3px solid #e74c3c",
                }}
              ></div>
              <span>Parábola y = x²</span>
            </div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{
                  background: "rgba(46, 204, 113, 0.2)",
                  borderColor: "#27ae60",
                }}
              ></div>
              <span>Área exata = 1/3</span>
            </div>
          </div>

          <div className="canvas-container">
            <canvas id="mainCanvas" width={900} height={520} />
          </div>

          <div className="controls-bottom">
            <div className="control-row">
              <label htmlFor="nSlider">🎮 Número de retângulos (n):</label>
              <input
                type="range"
                id="nSlider"
                min={1}
                max={100}
                defaultValue={10}
                step={1}
              />
              <span className="value-display" id="nValue">
                10
              </span>
            </div>

            <div className="button-group">
              <button className="btn btn-primary" id="animateBtn">
                ▶️ Animar
              </button>
              <button className="btn btn-success" id="autoBtn">
                ⏯️ Auto
              </button>
              <button className="btn btn-secondary" id="resetBtn">
                🔄 Reiniciar
              </button>
            </div>
          </div>

          <div className="info-boxes">
            <div className="info-box blue">
              <h3>📊 Área Aproximada (Sₙ)</h3>
              <p className="formula" id="areaValue">
                0.28333
              </p>
            </div>

            <div className="info-box green">
              <h3>🎯 Área Exata</h3>
              <p className="formula">0.33333 (1/3)</p>
            </div>

            <div className="info-box orange">
              <h3>⚠️ Erro Absoluto</h3>
              <p className="formula" id="errorValue">
                0.05000
              </p>
            </div>

            <div className="info-box purple">
              <h3>📐 Fórmula</h3>
              <p className="formula" id="formulaDisplay">
                1/3 - 1/20 + 1/600
              </p>
            </div>
          </div>

          <div className="convergence-chart">
            <h3>📈 Gráfico de Convergência</h3>
            <div className="chart-container">
              <canvas id="chartCanvas" width={800} height={300} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* Example 
  <ArchimedesMethodExhaustion />
*/
