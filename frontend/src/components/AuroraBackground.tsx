import React, { useEffect, useRef } from 'react';

export const AuroraBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Array<{x:number, y:number, size:number, vx:number, vy:number, alpha:number}>>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Init Particles
    for(let i=0; i<30; i++) {
        particlesRef.current.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            alpha: Math.random()
        });
    }

    let time = 0;

    const animate = () => {
        if (!canvas || !ctx) return;
        
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        }

        ctx.clearRect(0, 0, width, height);
        time += 0.003;

        // --- 1. Deep Space Gradient ---
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#020202'); 
        gradient.addColorStop(1, '#0c0a09'); // Dark warm grey
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // --- 2. Interactive Aurora Blobs ---
        const drawBlob = (x: number, y: number, r: number, color: string) => {
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, color);
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        };

        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;

        // Follower Blob (Blue)
        drawBlob(
            mx + Math.sin(time) * 50,
            my + Math.cos(time) * 50,
            400,
            'rgba(6, 182, 212, 0.08)' // Cyan
        );

        // Counter Blob (Purple)
        drawBlob(
            width - mx * 0.5,
            height - my * 0.5,
            500,
            'rgba(147, 51, 234, 0.06)' // Purple
        );
        
        // Ambient Blob (Green/Teal)
        drawBlob(
            width * 0.5 + Math.sin(time * 0.5) * 200,
            height * 0.5 + Math.cos(time * 0.7) * 100,
            600,
            'rgba(16, 185, 129, 0.04)' // Emerald
        );

        // --- 3. Interactive Particles ---
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        particlesRef.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Wrap
            if(p.x < 0) p.x = width;
            if(p.x > width) p.x = 0;
            if(p.y < 0) p.y = height;
            if(p.y > height) p.y = 0;

            // Mouse Repel/Attract
            const dx = mx - p.x;
            const dy = my - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < 200) {
                p.x -= dx * 0.01;
                p.y -= dy * 0.01;
            }

            ctx.globalAlpha = p.alpha * 0.5 + Math.sin(time * 5 + p.x) * 0.2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Grid Overlay (Subtle)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
        ctx.lineWidth = 1;
        const gridSize = 100;
        const offsetX = (time * 10) % gridSize;
        const offsetY = (time * 10) % gridSize;
        
        // Only draw a few lines for performance/aesthetic
        /*
        for(let x=0; x<width; x+=gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        */

        requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none w-full h-full" />;
};