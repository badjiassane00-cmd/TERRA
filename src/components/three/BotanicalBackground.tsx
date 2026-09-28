"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

// Seeded random for deterministic particle placement
let randomSeed = 0;
function seededRandom() {
  randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296;
  return randomSeed / 4294967296;
}

function FloatingLeaf({ position, color, speed }: { position: [number, number, number]; color: string; speed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.3;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
    </Float>
  );
}

function ParticleField() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 300;

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (seededRandom() - 0.5) * 15;
      positions[i * 3 + 1] = (seededRandom() - 0.5) * 15;
      positions[i * 3 + 2] = (seededRandom() - 0.5) * 15;

      const color = new THREE.Color();
      color.setHSL(0.25 + seededRandom() * 0.15, 0.7, 0.4 + seededRandom() * 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return [positions, colors];
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export default function BotanicalBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#0a1a0f"]} />
        <fog attach="fog" args={["#0a1a0f", 5, 20]} />

        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#2d6a4f" />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#40916c" />

        <ParticleField />

        <FloatingLeaf position={[-3, 2, -2]} color="#2d6a4f" speed={0.8} />
        <FloatingLeaf position={[3, -1, -3]} color="#40916c" speed={1.2} />
        <FloatingLeaf position={[2, 3, -1]} color="#52b788" speed={0.6} />
        <FloatingLeaf position={[-2, -2, -2]} color="#74c69d" speed={1.0} />
        <FloatingLeaf position={[0, 0, -4]} color="#1b4332" speed={0.9} />
        <FloatingLeaf position={[4, 1, -3]} color="#95d5b2" speed={1.1} />
        <FloatingLeaf position={[-4, -1, -2]} color="#d8f3dc" speed={0.7} />

        <mesh position={[0, 0, -5]}>
          <sphereGeometry args={[3, 32, 32]} />
          <MeshDistortMaterial
            color="#1b4332"
            attach="material"
            distort={0.2}
            speed={1.5}
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>
      </Canvas>
    </div>
  );
}
