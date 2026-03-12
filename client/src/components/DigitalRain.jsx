import React, { useEffect, useRef } from 'react';

const DigitalRain = ({ fallSpeed = 1.0, columnDensity = 0.7 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let lastTime = 0;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Characters
    const katakana = '\u30A2\u30A4\u30A6\u30A8\u30AA\u30AB\u30AD\u30AF\u30B1\u30B3\u30B5\u30B7\u30B9\u30BB\u30BD\u30BF\u30C1\u30C4\u30C6\u30C8\u30CA\u30CB\u30CC\u30CD\u30CE\u30CF\u30D2\u30D5\u30D8\u30DB\u30DE\u30DF\u30E0\u30E1\u30E2\u30E4\u30E6\u30E8\u30E9\u30EA\u30EB\u30EC\u30ED\u30EF\u30F2\u30F3';
    const numbers = '0123456789';
    const mathSymbols = '\u00D7\u00F7\u2206\u03A3\u03A0\u221A\u221E\u2248\u2260\u2264\u2265\u222B\u2202\u03B1\u03B2\u03B3\u03B8\u03C6\u03C8\u03C9';
    const allChars = katakana + numbers + mathSymbols;

    const randomChar = () => allChars[Math.floor(Math.random() * allChars.length)];

    let width, height, dpr;
    let FONT_SIZE = 16;
    let columns = [];
    let waterSurface;
    let ripples = [];
    const MAX_RIPPLES = 40;
    let wavePoints = [];
    const WAVE_RESOLUTION = 4;
    let waveCount = 0;

    const createColumn = (index, scatter) => {
      const trailLen = 12 + Math.floor(Math.random() * 20);
      const maxChars = trailLen + 5;
      const chars = [];
      for (let j = 0; j < maxChars; j++) {
        chars.push({
          char: randomChar(),
          cycleTimer: Math.random() * 3,
          cycleRate: 0.5 + Math.random() * 2
        });
      }

      let startY;
      if (scatter) {
        if (Math.random() < columnDensity) {
          startY = Math.random() * (waterSurface + trailLen * FONT_SIZE) - trailLen * FONT_SIZE * 0.3;
        } else {
          startY = -trailLen * FONT_SIZE - Math.random() * height * 0.5;
        }
      } else {
        startY = -trailLen * FONT_SIZE * Math.random() * 0.3;
      }

      return {
        x: index * FONT_SIZE,
        y: startY,
        speed: 1.2 + Math.random() * 2.5,
        length: trailLen,
        chars: chars,
        active: scatter ? Math.random() < (columnDensity + 0.2) : Math.random() < columnDensity,
        restartDelay: 0,
        opacity: 0.6 + Math.random() * 0.4,
        hitWater: false
      };
    };

    const initColumns = () => {
      waterSurface = height * 0.78;
      const colWidth = FONT_SIZE;
      const colCount = Math.floor(width / colWidth);
      const newColumns = [];

      for (let i = 0; i < colCount; i++) {
        newColumns.push(createColumn(i, true));
      }
      columns = newColumns;

      waveCount = Math.ceil(width / WAVE_RESOLUTION) + 1;
      const newWave = [];
      for (let w = 0; w < waveCount; w++) {
        newWave.push({ y: 0, vy: 0 });
      }
      wavePoints = newWave;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initColumns();
    };

    const spawnRipple = (x, y) => {
      if (ripples.length >= MAX_RIPPLES) {
        ripples.shift();
      }
      ripples.push({
        x: x,
        y: y,
        radius: 0,
        maxRadius: 30 + Math.random() * 50,
        speed: 20 + Math.random() * 30,
        life: 1.0,
        decay: 0.3 + Math.random() * 0.2
      });
    };

    const disturbWave = (x, force) => {
      const idx = Math.floor(x / WAVE_RESOLUTION);
      const spread = 3;
      for (let i = -spread; i <= spread; i++) {
        const wi = idx + i;
        if (wi >= 0 && wi < wavePoints.length) {
          const influence = 1 - Math.abs(i) / (spread + 1);
          wavePoints[wi].vy += force * influence;
        }
      }
    };

    const updateColumns = (dt) => {
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];

        if (!col.active) {
          col.restartDelay -= dt;
          if (col.restartDelay <= 0) {
            if (Math.random() < columnDensity) {
              const newCol = createColumn(i, false);
              Object.assign(col, newCol);
            } else {
              col.restartDelay = 0.3 + Math.random() * 1.5;
            }
          }
          continue;
        }

        const prevY = col.y;
        col.y += col.speed * fallSpeed * dt * 60;

        for (let j = 0; j < col.chars.length; j++) {
          col.chars[j].cycleTimer -= dt;
          if (col.chars[j].cycleTimer <= 0) {
            col.chars[j].char = randomChar();
            col.chars[j].cycleTimer = col.chars[j].cycleRate;
          }
        }

        if (!col.hitWater && col.y >= waterSurface && prevY < waterSurface) {
          col.hitWater = true;
          spawnRipple(col.x + FONT_SIZE * 0.5, waterSurface);
          disturbWave(col.x + FONT_SIZE * 0.5, -2 - Math.random() * 3);
        }

        const tailY = col.y - col.length * FONT_SIZE;
        if (tailY > waterSurface + 30) {
          col.active = false;
          col.restartDelay = 0.2 + Math.random() * 2;
        }
      }
    };

    const drawColumns = () => {
      ctx.font = `${FONT_SIZE}px "SF Mono", "Fira Code", "Cascadia Code", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (!col.active) continue;

        for (let j = 0; j < col.length; j++) {
          const charY = col.y - j * FONT_SIZE;
          if (charY > waterSurface) continue;
          if (charY < -FONT_SIZE) continue;

          const charIndex = j % col.chars.length;
          const trailFraction = j / col.length;
          let brightness;

          if (j === 0) {
            brightness = 1.0;
          } else if (j === 1) {
            brightness = 0.9;
          } else if (j < 4) {
            brightness = 0.75 - (j - 2) * 0.08;
          } else {
            brightness = Math.max(0, 0.6 * (1 - trailFraction));
          }

          const distToWater = waterSurface - charY;
          if (distToWater < FONT_SIZE * 3) {
            brightness *= Math.max(0, distToWater / (FONT_SIZE * 3));
          }

          brightness *= col.opacity;
          if (brightness < 0.02) continue;

          let r, g, b;
          if (j === 0) {
            r = 255; g = 245; b = 220;
          } else if (j < 3) {
            r = 240; g = 200; b = 140;
          } else {
            r = 200; g = 149; b = 108;
          }

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${brightness})`;

          if (j === 0) {
            ctx.shadowColor = 'rgba(255, 220, 160, 0.6)';
            ctx.shadowBlur = 8;
          }

          ctx.fillText(col.chars[charIndex].char, col.x + FONT_SIZE * 0.5, charY);

          if (j === 0) {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          }
        }
      }
    };

    const drawReflections = () => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, waterSurface, width, height - waterSurface);
      ctx.clip();

      ctx.font = `${FONT_SIZE}px "SF Mono", "Fira Code", "Cascadia Code", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (!col.active) continue;

        for (let j = 0; j < Math.min(col.length, 8); j++) {
          const charY = col.y - j * FONT_SIZE;
          if (charY > waterSurface || charY < waterSurface - FONT_SIZE * 8) continue;

          const charIndex = j % col.chars.length;
          const reflectY = waterSurface + (waterSurface - charY);
          const depthBelow = reflectY - waterSurface;
          const reflectAlpha = Math.max(0, 0.12 * (1 - depthBelow / (height * 0.2)));

          const waveIdx = Math.floor(col.x / WAVE_RESOLUTION);
          let waveOffset = 0;
          if (waveIdx >= 0 && waveIdx < wavePoints.length) {
            waveOffset = wavePoints[waveIdx].y * 2;
          }

          if (reflectAlpha < 0.01) continue;

          ctx.fillStyle = `rgba(200, 149, 108, ${reflectAlpha})`;
          ctx.fillText(
            col.chars[charIndex].char,
            col.x + FONT_SIZE * 0.5 + Math.sin(depthBelow * 0.05) * 3,
            reflectY + waveOffset
          );
        }
      }
      ctx.restore();
    };

    const updateRipples = (dt) => {
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed * dt;
        r.life -= r.decay * dt;
        if (r.life <= 0 || r.radius > r.maxRadius) {
          ripples.splice(i, 1);
        }
      }
    };

    const drawRipples = () => {
      for (let i = 0; i < ripples.length; i++) {
        const r = ripples[i];
        const alpha = r.life * 0.3;

        for (let ring = 0; ring < 3; ring++) {
          const ringRadius = r.radius - ring * 8;
          if (ringRadius <= 0) continue;
          const ringAlpha = alpha * (1 - ring * 0.3);

          ctx.beginPath();
          ctx.ellipse(r.x, r.y + ring * 2, ringRadius, ringRadius * 0.3, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(200, 170, 130, ${ringAlpha})`;
          ctx.lineWidth = 1 - ring * 0.2;
          ctx.stroke();
        }
      }
    };

    const updateWaves = (dt) => {
      const damping = 0.97;
      const tension = 0.03;
      const spread = 0.25;

      for (let i = 0; i < wavePoints.length; i++) {
        const p = wavePoints[i];
        p.vy += -tension * p.y;
        p.vy *= damping;
        p.y += p.vy;
      }

      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < wavePoints.length; i++) {
          if (i > 0) {
            wavePoints[i].vy += spread * (wavePoints[i - 1].y - wavePoints[i].y);
          }
          if (i < wavePoints.length - 1) {
            wavePoints[i].vy += spread * (wavePoints[i + 1].y - wavePoints[i].y);
          }
        }
      }
    };

    const drawWaterSurface = (time) => {
      const waterGrad = ctx.createLinearGradient(0, waterSurface, 0, height);
      waterGrad.addColorStop(0, 'rgba(15, 13, 11, 0.6)');
      waterGrad.addColorStop(0.3, 'rgba(12, 11, 10, 0.85)');
      waterGrad.addColorStop(1, 'rgba(10, 10, 10, 0.95)');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, waterSurface - 2, width, height - waterSurface + 2);

      ctx.beginPath();
      for (let x = 0; x <= width; x += WAVE_RESOLUTION) {
        const idx = Math.floor(x / WAVE_RESOLUTION);
        const waveY = idx < wavePoints.length ? wavePoints[idx].y : 0;
        const ambient = Math.sin(x * 0.01 + time * 0.8) * 1.5
                      + Math.sin(x * 0.023 + time * 0.5) * 1.0
                      + Math.sin(x * 0.007 + time * 0.3) * 2.0;
        const py = waterSurface + waveY + ambient;

        if (x === 0) {
          ctx.moveTo(x, py);
        } else {
          ctx.lineTo(x, py);
        }
      }
      ctx.strokeStyle = 'rgba(200, 170, 130, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const surfGlow = ctx.createLinearGradient(0, waterSurface - 10, 0, waterSurface + 20);
      surfGlow.addColorStop(0, 'rgba(200, 149, 108, 0)');
      surfGlow.addColorStop(0.4, 'rgba(200, 149, 108, 0.06)');
      surfGlow.addColorStop(0.6, 'rgba(200, 149, 108, 0.04)');
      surfGlow.addColorStop(1, 'rgba(200, 149, 108, 0)');
      ctx.fillStyle = surfGlow;
      ctx.fillRect(0, waterSurface - 10, width, 30);

      drawZenRipples(time);
    };

    const drawZenRipples = (time) => {
      const zenPoints = [
        { x: width * 0.3, y: waterSurface + (height - waterSurface) * 0.4 },
        { x: width * 0.7, y: waterSurface + (height - waterSurface) * 0.5 },
        { x: width * 0.5, y: waterSurface + (height - waterSurface) * 0.7 }
      ];

      for (let z = 0; z < zenPoints.length; z++) {
        const zp = zenPoints[z];
        for (let ring = 0; ring < 4; ring++) {
          const phase = time * 0.4 + ring * 1.5 + z * 2.0;
          const radius = 20 + (phase % 6) * 15;
          const alpha = 0.06 * Math.max(0, 1 - (phase % 6) / 6);
          if (alpha < 0.005) continue;

          ctx.beginPath();
          ctx.ellipse(zp.x, zp.y, radius, radius * 0.3, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(200, 170, 130, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    };

    const drawVignette = () => {
      const cx = width / 2;
      const cy = height / 2;
      const maxDim = Math.max(width, height);
      const vignette = ctx.createRadialGradient(cx, cy, maxDim * 0.25, cx, cy, maxDim * 0.8);
      vignette.addColorStop(0, 'rgba(10, 10, 10, 0)');
      vignette.addColorStop(1, 'rgba(10, 10, 10, 0.45)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    };

    const drawWaterParticles = (time) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, waterSurface, width, height - waterSurface);
      ctx.clip();

      for (let i = 0; i < 30; i++) {
        const px = (Math.sin(i * 73.1 + time * 0.07) * 0.5 + 0.5) * width;
        const py = waterSurface + (Math.cos(i * 127.3 + time * 0.05) * 0.5 + 0.5) * (height - waterSurface);
        const alpha = 0.04 + 0.03 * Math.sin(time * 0.5 + i * 1.7);

        ctx.fillStyle = `rgba(200, 149, 108, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      disturbWave(x, -4 - Math.random() * 3);
      spawnRipple(x, waterSurface);
      const colIdx = Math.floor(x / FONT_SIZE);
      for (let di = -1; di <= 1; di++) {
        const ci = colIdx + di;
        if (ci >= 0 && ci < columns.length) {
          columns[ci].active = true;
          columns[ci].y = y;
          columns[ci].speed = 2.5 + Math.random() * 2;
          columns[ci].opacity = 0.8 + Math.random() * 0.2;
          columns[ci].hitWater = false;
        }
      }
    };

    const handleTouch = (e) => {
      // e.preventDefault(); // Removed to avoid issues with scrolling if component is not full screen
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      disturbWave(x, -4 - Math.random() * 3);
      spawnRipple(x, waterSurface);
      const colIdx = Math.floor(x / FONT_SIZE);
      for (let di = -1; di <= 1; di++) {
        const ci = colIdx + di;
        if (ci >= 0 && ci < columns.length) {
          columns[ci].active = true;
          columns[ci].y = y;
          columns[ci].speed = 2.5 + Math.random() * 2;
          columns[ci].opacity = 0.8 + Math.random() * 0.2;
          columns[ci].hitWater = false;
        }
      }
    };

    const render = (timestamp) => {
      if (!lastTime) lastTime = timestamp;
      let dt = Math.min((timestamp - lastTime) / 1000, 0.05);
      lastTime = timestamp;

      if (prefersReduced) dt = 0;
      const time = timestamp / 1000;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      updateColumns(dt);
      updateRipples(dt);
      updateWaves(dt);

      drawColumns();
      drawWaterSurface(time);
      drawReflections();
      drawRipples();
      drawWaterParticles(time);
      drawVignette();

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', resize);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch, { passive: true });

    resize();
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouch);
      cancelAnimationFrame(animationFrameId);
    };
  }, [fallSpeed, columnDensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 bg-[#0a0a0a]"
      style={{ display: 'block', pointerEvents: 'auto' }}
    />
  );
};

export default DigitalRain;
