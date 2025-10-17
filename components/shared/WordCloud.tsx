import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface WordCloudProps {
    words: { text: string; value: number }[];
}

interface Tag {
    text: string;
    x: number;
    y: number;
    z: number;
    scale: number;
    opacity: number;
    fontSize: string;
    color: string;
}

const computePosition = (
    index: number,
    count: number,
    radius: number
): { x: number; y: number; z: number } => {
    const phi = Math.acos(-1 + (2 * index + 1) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    
    const x = radius * Math.cos(theta) * Math.sin(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(phi);

    return { x, y, z };
};

export const WordCloud: React.FC<WordCloudProps> = ({ words }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tags, setTags] = useState<Tag[]>([]);
    
    const mouseX = useRef(0);
    const mouseY = useRef(0);
    const angleX = useRef(0);
    const angleY = useRef(0);
    const animationFrameId = useRef<number | null>(null);
    
    const isDragging = useRef(false);
    const lastMouseX = useRef(0);
    const lastMouseY = useRef(0);

    const radius = 150;
    const rotationSpeed = 0.0005;

    const processedWords = useMemo(() => {
        const values = words.map(w => w.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const range = maxVal - minVal;

        return words.map((word, i) => {
            const normalizedValue = range > 0 ? (word.value - minVal) / range : 0.5;
            
            const position = computePosition(i, words.length, radius);

            const isPrimary = normalizedValue > 0.6;
            const colorClass = isPrimary
                ? 'text-neutral-800 dark:text-neutral-200'
                : 'text-neutral-500 dark:text-neutral-400';

            return {
                ...position,
                text: word.text,
                scale: 1, // Will be calculated dynamically
                opacity: 0, // Will be calculated dynamically
                fontSize: `${14 + normalizedValue * 12}px`,
                color: colorClass
            };
        });
    }, [words]);

    const updateTags = useCallback(() => {
        const sinX = Math.sin(angleX.current);
        const cosX = Math.cos(angleX.current);
        const sinY = Math.sin(angleY.current);
        const cosY = Math.cos(angleY.current);

        const newTags = processedWords.map(word => {
            // Rotate around Y-axis
            const rx1 = word.x * cosY + word.z * sinY;
            const rz1 = word.z * cosY - word.x * sinY;
            // Rotate around X-axis
            const ry1 = word.y * cosX + rz1 * sinX;
            const rz2 = rz1 * cosX - word.y * sinX;

            const scale = (rz2 + radius) / (2 * radius);
            const displayScale = Math.pow(scale, 2) + 0.5;

            return {
                ...word,
                x: rx1,
                y: ry1,
                z: rz2,
                scale: displayScale,
                opacity: (rz2 + radius) / (2 * radius)
            };
        });

        setTags(newTags);
    }, [processedWords]);

    const animate = useCallback(() => {
        if (!isDragging.current) {
            angleY.current += rotationSpeed;
            angleX.current += rotationSpeed;
        }
        updateTags();
        animationFrameId.current = requestAnimationFrame(animate);
    }, [updateTags]);

    useEffect(() => {
        animationFrameId.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [animate]);


    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        lastMouseX.current = e.clientX;
        lastMouseY.current = e.clientY;
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastMouseX.current;
        const dy = e.clientY - lastMouseY.current;
        angleY.current += dx * 0.005;
        angleX.current -= dy * 0.005;
        lastMouseX.current = e.clientX;
        lastMouseY.current = e.clientY;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };
    
    const handleMouseLeave = () => {
        isDragging.current = false;
    };

    if (words.length === 0) {
        return <p className="text-neutral-400">No topics to display.</p>;
    }
    
    return (
        <div 
            ref={containerRef}
            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ perspective: '1000px' }}
        >
            <div style={{ transformStyle: 'preserve-3d' }}>
                {tags.map((tag, i) => (
                    <span
                        key={i}
                        className={`absolute font-semibold transition-colors duration-200 ${tag.color}`}
                        style={{
                            transform: `translate3d(${tag.x}px, ${tag.y}px, ${tag.z}px) scale(${tag.scale})`,
                            opacity: tag.opacity,
                            fontSize: tag.fontSize,
                            willChange: 'transform, opacity',
                            pointerEvents: 'none',
                        }}
                    >
                        {tag.text}
                    </span>
                ))}
            </div>
        </div>
    );
};