// @ts-nocheck
'use client'
import { useEffect } from "react";


export default function ArchimedesMethodExhaustion() {

  useEffect(() => {
    const canvas = document.getElementById('mainCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let currentIteration = 0;
    let triangles = [];
    let autoMode = false;
    let autoInterval = null;
    const maxIterations = 10;

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

    function findVertex(x1, y1, x2, y2) {
      const xMid = (x1 + x2) / 2;
      return { x: xMid, y: f(xMid) };
    }

    function triangleArea(p1, p2, p3) {
      return (
        Math.abs(
          (p2.x - p1.x) * (p3.y - p1.y) -
            (p3.x - p1.x) * (p2.y - p1.y)
        ) / 2
      );
    }

    class ParabolicSegment {
      constructor(x1, y1, x2, y2, iteration) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.iteration = iteration;
        const vertex = findVertex(x1, y1, x2, y2);
        this.vx = vertex.x;
        this.vy = vertex.y;
        this.triangleArea = triangleArea(
          { x: x1, y: y1 },
          { x: x2, y: y2 },
          { x: this.vx, y: this.vy }
        );
      }
    }

    function initializeSegments() {
      triangles = [];
      triangles.push(new ParabolicSegment(0, 0, 1, 0, 0));
    }

    function drawParabola() {
      ctx.strokeStyle = '#e74c3c';
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

    function drawAxes() {
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(padding, canvas.height - padding - 40);
      ctx.lineTo(canvas.width - padding, canvas.height - padding - 40);
      ctx.moveTo(padding, canvas.height - padding - 40);
      ctx.lineTo(padding, padding);
      ctx.stroke();

      ctx.fillStyle = '#2c3e50';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center';

      for (let i = 0; i <= 10; i++) {
        const x = i / 10;
        const canvasX = toCanvasX(x);
        ctx.fillText(
          x.toFixed(1),
          canvasX,
          canvas.height - padding - 40 + 25
        );
      }

      ctx.textAlign = 'right';
      for (let i = 0; i <= 10; i++) {
        const y = i / 10;
        const canvasY = toCanvasY(y);
        ctx.fillText(y.toFixed(1), padding - 10, canvasY + 4);
      }

      ctx.font = 'bold 15px Arial';
      ctx.fillStyle = '#34495e';
      ctx.textAlign = 'center';
      ctx.fillText(
        'x',
        canvas.width - padding + 20,
        canvas.height - padding - 40 + 5
      );
      ctx.save();
      ctx.translate(padding - 38, canvas.height / 2 - 20);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('y', 0, 0);
      ctx.restore();
    }

    function drawTriangles() {
      triangles.forEach((seg) => {
        const isInitial = seg.iteration === 0;
        ctx.fillStyle = isInitial
          ? 'rgba(52, 152, 219, 0.3)'
          : 'rgba(46, 204, 113, 0.3)';
        ctx.strokeStyle = isInitial ? '#2980b9' : '#27ae60';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(toCanvasX(seg.x1), toCanvasY(seg.y1));
        ctx.lineTo(toCanvasX(seg.vx), toCanvasY(seg.vy));
        ctx.lineTo(toCanvasX(seg.x2), toCanvasY(seg.y2));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isInitial ? '#2980b9' : '#27ae60';
        ctx.beginPath();
        ctx.arc(
          toCanvasX(seg.vx),
          toCanvasY(seg.vy),
          5,
          0,
          2 * Math.PI
        );
        ctx.fill();
      });
    }

    function updateDisplay() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawAxes();
      drawTriangles();
      drawParabola();

      const iterationNumber = document.getElementById('iterationNumber');
      const numTriangles = document.getElementById('numTriangles');
      const totalAreaSpan = document.getElementById('totalArea');
      const errorValueSpan = document.getElementById('errorValue');
      const seriesFormula = document.getElementById('seriesFormula');
      const nextBtn = document.getElementById('nextBtn');

      if (!iterationNumber) return;

      iterationNumber.textContent = currentIteration;
      numTriangles.textContent = triangles.length;

      let totalArea = 0;
      triangles.forEach((t) => {
        totalArea += t.triangleArea;
      });

      totalAreaSpan.textContent = totalArea.toFixed(6);
      errorValueSpan.textContent = Math.abs(1 / 3 - totalArea).toFixed(6);

      const a0 = triangles[0].triangleArea;
      let seriesText = `a₀`;
      for (let i = 1; i <= currentIteration; i++) {
        seriesText += ` + (1/4)^${i} · a₀`;
      }
      if (currentIteration > 0) {
        const sum =
          (a0 * (1 - Math.pow(0.25, currentIteration + 1))) / 0.75;
        seriesText += `<br><br>≈ ${sum.toFixed(6)}<br>→ ${(a0 * (4 / 3)).toFixed(
          6
        )} (limite)`;
      }
      seriesFormula.innerHTML = seriesText;

      nextBtn.disabled = currentIteration >= maxIterations || autoMode;
    }

    function nextIteration() {
      if (currentIteration >= maxIterations) return;
      currentIteration++;
      const previousSegments = triangles.filter(
        (t) => t.iteration === currentIteration - 1
      );
      previousSegments.forEach((seg) => {
        triangles.push(
          new ParabolicSegment(
            seg.x1,
            seg.y1,
            seg.vx,
            seg.vy,
            currentIteration
          )
        );
        triangles.push(
          new ParabolicSegment(
            seg.vx,
            seg.vy,
            seg.x2,
            seg.y2,
            currentIteration
          )
        );
      });
      updateDisplay();
    }

    function reset() {
      currentIteration = 0;
      if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = null;
        autoMode = false;
        const autoBtn = document.getElementById('autoBtn');
        if (autoBtn) autoBtn.textContent = '⏯️ Auto';
      }
      initializeSegments();
      updateDisplay();
    }

    function toggleAuto() {
      const autoBtn = document.getElementById('autoBtn');
      const nextBtn = document.getElementById('nextBtn');
      autoMode = !autoMode;
      if (autoMode) {
        if (autoBtn) autoBtn.textContent = '⏸️ Pausar';
        if (nextBtn) nextBtn.disabled = true;
        autoInterval = setInterval(() => {
          if (currentIteration < maxIterations) {
            nextIteration();
          } else {
            toggleAuto();
          }
        }, 1500);
      } else {
        if (autoBtn) autoBtn.textContent = '⏯️ Auto';
        if (nextBtn) nextBtn.disabled = false;
        if (autoInterval) {
          clearInterval(autoInterval);
          autoInterval = null;
        }
      }
    }

    // Inicializa
    initializeSegments();
    updateDisplay();

    // Liga os botões
    const nextBtn = document.getElementById('nextBtn');
    const autoBtn = document.getElementById('autoBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (nextBtn) nextBtn.addEventListener('click', nextIteration);
    if (autoBtn) autoBtn.addEventListener('click', toggleAuto);
    if (resetBtn) resetBtn.addEventListener('click', reset);

    // Cleanup ao desmontar o componente
    return () => {
      if (nextBtn) nextBtn.removeEventListener('click', nextIteration);
      if (autoBtn) autoBtn.removeEventListener('click', toggleAuto);
      if (resetBtn) resetBtn.removeEventListener('click', reset);
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
          background: linear-gradient(135deg, #8e44ad 0%, #3498db 100%);
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
          background: linear-gradient(135deg, #8e44ad 0%, #3498db 100%);
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
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        
        .controls-label {
          font-weight: 600;
          color: #34495e;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .iteration-display {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 15px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .iteration-number {
          font-size: 1.6em;
          font-weight: 700;
          color: #8e44ad;
          min-width: 35px;
          text-align: center;
        }
        
        .iteration-label {
          font-size: 0.9em;
          color: #7f8c8d;
        }
        
        .btn {
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
        
        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(0,0,0,0.3);
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #8e44ad 0%, #3498db 100%);
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
        
        .stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .stats-box, .series-display {
          background: linear-gradient(135deg, #e8f4f8 0%, #d4e9f7 100%);
          padding: 15px;
          border-radius: 10px;
          border-left: 4px solid #3498db;
        }
        
        .series-display {
          background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
          border-left-color: #f39c12;
        }
        
        .stats-box h4, .series-display h4 {
          margin-bottom: 12px;
          font-size: 1.1em;
        }
        
        .stats-box h4 { color: #2980b9; }
        .series-display h4 { color: #d68910; }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          margin: 6px 0;
          background: white;
          border-radius: 6px;
        }
        
        .stat-label {
          font-weight: 600;
          color: #34495e;
        }
        
        .stat-value {
          font-family: 'Courier New', monospace;
          font-weight: 700;
          color: #8e44ad;
        }
        
        .series-formula {
          background: white;
          padding: 12px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 1em;
          line-height: 1.6;
        }
        
        .explanation-box {
          background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
          padding: 20px;
          border-radius: 12px;
          border-left: 5px solid #9b59b6;
          margin-bottom: 20px;
        }
        
        .explanation-box h3 {
          color: #8e44ad;
          margin-bottom: 12px;
          font-size: 1.3em;
        }
        
        .explanation-box ol {
          margin-left: 20px;
        }
        
        .explanation-box li {
          color: #34495e;
          margin-bottom: 10px;
          line-height: 1.6;
        }
        
        .highlight {
          background: #ffeaa7;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 600;
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
          
          .controls-bottom {
            flex-direction: column;
            gap: 10px;
          }
          
          .controls-label {
            width: 100%;
            justify-content: center;
          }
          
          .iteration-display {
            width: 100%;
            justify-content: center;
          }
          
          .btn {
            width: 100%;
            padding: 12px;
          }
          
          .stats-row {
            grid-template-columns: 1fr;
          }
          
          .explanation-box {
            padding: 15px;
          }
          
          .explanation-box li {
            font-size: 0.95em;
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
          
          .btn {
            font-size: 0.9em;
          }
        }
      `}</style>

      <div className="container">
        <div className="header">
          <h1>🏛️ Método Original de Arquimedes</h1>
          <p>Quadratura da Parábola usando Triângulos Inscritos</p>
        </div>

        <div className="content">
          <div className="legend-top">
            <div className="legend-item">
              <div
                className="legend-color"
                style={{
                  background: 'rgba(52, 152, 219, 0.3)',
                  borderColor: '#2980b9',
                }}
              ></div>
              <span>Triângulo inicial △APB</span>
            </div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{
                  background: 'rgba(46, 204, 113, 0.3)',
                  borderColor: '#27ae60',
                }}
              ></div>
              <span>Triângulos novos</span>
            </div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{
                  background: 'none',
                  border: '3px solid #e74c3c',
                }}
              ></div>
              <span>Parábola y = x²</span>
            </div>
          </div>

          <div className="canvas-container">
            <canvas id="mainCanvas" width="900" height="520"></canvas>
          </div>

          <div className="controls-bottom">
            <span className="controls-label">🎮 Controles</span>
            <div className="iteration-display">
              <span className="iteration-number" id="iterationNumber">
                0
              </span>
              <span className="iteration-label">Iteração</span>
            </div>
            <button className="btn btn-primary" id="nextBtn">
              ▶️ Próxima
            </button>
            <button className="btn btn-success" id="autoBtn">
              ⏯️ Auto
            </button>
            <button className="btn btn-secondary" id="resetBtn">
              🔄 Reiniciar
            </button>
          </div>

          <div className="stats-row">
            <div className="stats-box">
              <h4>📊 Estatísticas</h4>
              <div className="stat-item">
                <span className="stat-label">Triângulos:</span>
                <span className="stat-value" id="numTriangles">
                  1
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Área total:</span>
                <span className="stat-value" id="totalArea">
                  0.25000
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Área exata:</span>
                <span className="stat-value">0.33333</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Erro (Mₙ):</span>
                <span className="stat-value" id="errorValue">
                  0.08333
                </span>
              </div>
            </div>

            <div className="series-display">
              <h4>📐 Série Geométrica</h4>
              <div className="series-formula" id="seriesFormula">
                a₀
              </div>
            </div>
          </div>

          <div className="explanation-box">
            <h3>🎯 Como Arquimedes Raciocinou</h3>
            <ol>
              <li>
                <strong>Iteração 0:</strong> Triângulo inscrito △APB (área =
                a₀ = 1/4)
              </li>
              <li>
                <strong>Iteração 1:</strong> 2 triângulos novos (área total =
                a₁ = ¼a₀)
              </li>
              <li>
                <strong>Padrão:</strong> aₙ = ¼aₙ₋₁ (série geométrica razão
                1/4)
              </li>
              <li>
                <strong>Soma:</strong> a₀(1 + ¼ + 1/16 + ...) = a₀ · 4/3
              </li>
              <li>
                <strong>Resultado:</strong> Área = 4/3 · 1/4 ={' '}
                <span className="highlight">1/3</span>
              </li>
            </ol>
          </div>

          <div
            className="explanation-box"
            style={{
              background:
                'linear-gradient(135deg, #fff9e6 0%, #fff3cc 100%)',
              borderLeftColor: '#f39c12',
            }}
          >
            <h3>📚 Referência</h3>
            <p style={{ color: '#34495e', lineHeight: 1.7 }}>
              Animação por <strong>Rangel Freitas dos Santos</strong>{' '}
              baseada em:
              <br />
              <br />
              JOHN ABBOTT COLLEGE.{' '}
              <em>
                Archimedes&apos; quadrature of the parabola and the method of
                exhaustion
              </em>
              . Disponível em:{' '}
              <a
                href="https://www.math.mcgill.ca/rags/JAC/NYB/exhaustion2.pdf"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#3498db', textDecoration: 'none' }}
              >
                https://www.math.mcgill.ca/rags/JAC/NYB/exhaustion2.pdf
              </a>
              . Acesso em: 18 nov. 2025.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/* Example 
  <ArchimedesMethodExhaustion />
*/
