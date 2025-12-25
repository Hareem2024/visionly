
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Cute floating shapes
const FloatingShape = ({ 
  position, 
  shape, 
  color, 
  size = 0.2 
}: { 
  position: [number, number, number], 
  shape: 'heart' | 'star' | 'cloud' | 'butterfly', 
  color: string,
  size?: number 
}) => {
  const mesh = useRef<THREE.Mesh>(null);
  const initialY = position[1];
  
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.z += 0.003;
      mesh.current.position.y = initialY + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.3;
    }
  });

  // Different geometries for different shapes
  const getGeometry = () => {
    switch (shape) {
      case 'heart':
        return <sphereGeometry args={[size, 8, 8]} />;
      case 'star':
        return <octahedronGeometry args={[size, 0]} />;
      case 'cloud':
        return <sphereGeometry args={[size * 1.5, 12, 12]} />;
      case 'butterfly':
        return <coneGeometry args={[size, size * 2, 4]} />;
      default:
        return <sphereGeometry args={[size, 8, 8]} />;
    }
  };

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh position={position} ref={mesh}>
        {getGeometry()}
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
        />
      </mesh>
    </Float>
  );
};

// Pastel color palettes for each theme
const themeColors = {
  day: {
    background: '#fff0f5',
    gradient: ['#ffb6c1', '#ffc0cb', '#dda0dd', '#e6e6fa', '#b0e0e6'],
    shapes: ['#ffb6c1', '#ffc0cb', '#dda0dd', '#87ceeb', '#98fb98', '#ffdab9'],
  },
  night: {
    background: '#1a1a2e',
    gradient: ['#16213e', '#0f3460', '#533483', '#e94560'],
    shapes: ['#dda0dd', '#9370db', '#ba55d3', '#ff69b4', '#87ceeb', '#add8e6'],
  },
  sunset: {
    background: '#fff5f5',
    gradient: ['#ffb6c1', '#ffa07a', '#ffdab9', '#ffe4e1', '#e6e6fa'],
    shapes: ['#ffb6c1', '#ff91a4', '#ffa07a', '#ffb347', '#dda0dd', '#f0e68c'],
  }
};

const BackgroundScene: React.FC<{ theme: 'day' | 'night' | 'sunset' }> = ({ theme }) => {
  const colors = themeColors[theme];

  // Generate floating shapes
  const shapes = useMemo(() => {
    const shapeTypes: ('heart' | 'star' | 'cloud' | 'butterfly')[] = ['heart', 'star', 'cloud', 'butterfly'];
    return Array.from({ length: 50 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 15 - 8,
      ] as [number, number, number],
      shape: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
      color: colors.shapes[Math.floor(Math.random() * colors.shapes.length)],
      size: 0.1 + Math.random() * 0.3,
    }));
  }, [theme]);

  return (
    <div className="fixed inset-0 z-[-1]">
      {/* CSS gradient background */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: theme === 'night' 
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
            : theme === 'sunset'
            ? 'linear-gradient(135deg, #fff5f5 0%, #ffe4e1 25%, #ffdab9 50%, #ffb6c1 75%, #e6e6fa 100%)'
            : 'linear-gradient(135deg, #fff0f5 0%, #ffe4f0 25%, #f0e6ff 50%, #e6f0ff 75%, #e6fff0 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 20s ease infinite',
        }}
      />
      
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <color attach="background" args={['transparent']} />
        <ambientLight intensity={1.2} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffb6c1" />
        <pointLight position={[-10, -10, 5]} intensity={0.5} color="#dda0dd" />
        
        {/* Floating shapes */}
        {shapes.map((shape, i) => (
          <FloatingShape key={i} {...shape} />
        ))}

        {/* Soft sparkly stars */}
        <Stars 
          radius={80} 
          depth={50} 
          count={theme === 'night' ? 3000 : 1000} 
          factor={3} 
          saturation={0.5} 
          fade 
          speed={0.5} 
        />
      </Canvas>
      
      {/* Soft overlay for dreamy effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(255,255,255,0.1) 100%)',
        }}
      />
    </div>
  );
};

export default BackgroundScene;
