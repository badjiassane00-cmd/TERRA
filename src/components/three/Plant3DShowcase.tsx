"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html } from "@react-three/drei";
import * as THREE from "three";

function LivingWorld() {
  const world = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (world.current) world.current.rotation.y = state.clock.elapsedTime * 0.12;
    if (ring.current) ring.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.16) * 0.08;
  });
  return (
    <group ref={world}>
      <mesh castShadow>
        <icosahedronGeometry args={[1.18, 3]} />
        <meshPhysicalMaterial color="#4e8057" roughness={0.32} metalness={0.06} clearcoat={0.8} clearcoatRoughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 1.02]} scale={[0.4, 0.18, 0.1]} rotation={[0, 0, -0.4]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color="#bed37b" roughness={0.55} />
      </mesh>
      <mesh position={[-0.55, 0.24, 0.92]} scale={[0.23, 0.12, 0.08]} rotation={[0, 0, 0.7]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color="#d2bd78" roughness={0.6} />
      </mesh>
      <mesh ref={ring} rotation={[1.05, 0.22, 0.25]}>
        <torusGeometry args={[1.68, 0.012, 8, 120]} />
        <meshStandardMaterial color="#d5c58f" transparent opacity={0.72} />
      </mesh>
      <mesh position={[1.12, 0.88, 0.12]}>
        <sphereGeometry args={[0.13, 24, 18]} />
        <meshStandardMaterial color="#f0cf72" emissive="#b18429" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[-1.32, -0.68, -0.05]}>
        <icosahedronGeometry args={[0.18, 1]} />
        <meshStandardMaterial color="#c7784d" roughness={0.48} />
      </mesh>
    </group>
  );
}

function NatureSymbols() {
  return <>
    <Html position={[-1.68, 1.03, 0.25]} center distanceFactor={5} style={{ pointerEvents: "none" }}><span className="nature-orbit-symbol">🦋</span></Html>
    <Html position={[1.55, -0.8, 0.2]} center distanceFactor={5} style={{ pointerEvents: "none" }}><span className="nature-orbit-symbol">🐦</span></Html>
    <Html position={[-0.9, -1.48, 0.1]} center distanceFactor={5} style={{ pointerEvents: "none" }}><span className="nature-orbit-symbol">🌿</span></Html>
    <Html position={[0.72, 1.5, 0.3]} center distanceFactor={5} style={{ pointerEvents: "none" }}><span className="nature-orbit-symbol">🐸</span></Html>
  </>;
}

export default function Plant3DShowcase() {
  return (
    <div className="w-full h-full min-h-[260px]" aria-label="Illustration 3D de la biodiversité mondiale" role="img">
      <Canvas camera={{ position: [0, 0.25, 6.5], fov: 35 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={1.3} />
        <directionalLight position={[4, 7, 5]} intensity={2.1} color="#fff1c8" />
        <pointLight position={[-4, 1, 2]} intensity={12} distance={10} color="#bdde9d" />
        <Suspense fallback={null}>
          <Float speed={0.8} rotationIntensity={0.025} floatIntensity={0.11}>
            <LivingWorld />
            <NatureSymbols />
          </Float>
        </Suspense>
      </Canvas>
    </div>
  );
}
