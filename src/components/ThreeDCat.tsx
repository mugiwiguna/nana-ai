"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import * as THREE from "three";

function CatHead({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftPupilRef = useRef<THREE.Mesh>(null);
  const rightPupilRef = useRef<THREE.Mesh>(null);
  const leftLidRef = useRef<THREE.Mesh>(null);
  const rightLidRef = useRef<THREE.Mesh>(null);
  const blinkTimerRef = useRef<number>(0);
  const blinkDurationRef = useRef<number>(0);
  const isBlinkingRef = useRef<boolean>(false);
  const nextBlinkRef = useRef<number>(2000 + Math.random() * 3000);
  const { viewport } = useThree();

  useFrame((_, delta) => {
    const dt = delta * 1000;
    if (!groupRef.current) return;

    // ── Cursor follow ──
    const targetX = (mouseX - 0.5) * viewport.width * 0.5;
    const targetY = -(mouseY - 0.5) * viewport.height * 0.35;
    groupRef.current.rotation.y += ((mouseX - 0.5) * 0.6 - groupRef.current.rotation.y) * 0.04;
    groupRef.current.rotation.x += (-(mouseY - 0.5) * 0.35 - groupRef.current.rotation.x) * 0.04;
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.04;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.04;

    // ── Gaze: pupils follow cursor ──
    const gazeX = (mouseX - 0.5) * 0.25;
    const gazeY = (mouseY - 0.5) * 0.15;
    const maxPupil = 0.05;
    const lx = THREE.MathUtils.clamp(gazeX, -maxPupil, maxPupil);
    const ly = THREE.MathUtils.clamp(gazeY, -maxPupil, maxPupil);
    if (leftPupilRef.current) leftPupilRef.current.position.set(lx, ly, 0.08);
    if (rightPupilRef.current) rightPupilRef.current.position.set(lx, ly, 0.08);

    // ── Blinking ──
    blinkTimerRef.current += dt;
    if (isBlinkingRef.current) {
      blinkDurationRef.current -= dt;
      if (blinkDurationRef.current <= 0) {
        isBlinkingRef.current = false;
        nextBlinkRef.current = 2000 + Math.random() * 3500;
        blinkTimerRef.current = 0;
      }
    } else if (blinkTimerRef.current >= nextBlinkRef.current) {
      isBlinkingRef.current = true;
      blinkDurationRef.current = 150;
    }

    const blink = isBlinkingRef.current
      ? (() => {
          const p = 1 - blinkDurationRef.current / 150;
          if (p < 0.15) return p / 0.15;        // 0→1 fast close
          if (p > 0.75) return 1 - (p - 0.75) / 0.25; // 1→0 slow open
          return 1;                               // hold closed
        })()
      : 0;

    if (leftLidRef.current) leftLidRef.current.scale.y = Math.max(blink, 0.01);
    if (rightLidRef.current) rightLidRef.current.scale.y = Math.max(blink, 0.01);
  });

  const mainColor = "#16a34a";
  const darkColor = "#15803d";
  const eyeColor = "#facc15";
  const noseColor = "#f472b6";
  const innerEarColor = "#fbcfe8";
  const lidColor = "#0c3d1a";

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.25, metalness: 0.15, flatShading: true }), []);
  const darkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: darkColor, roughness: 0.3, metalness: 0.05, flatShading: true }), []);
  const eyeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: eyeColor, roughness: 0.08, metalness: 0.3, emissive: eyeColor, emissiveIntensity: 0.35 }), []);
  const pupilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0a0a1a", roughness: 0.05, metalness: 0.5 }), []);
  const noseMat = useMemo(() => new THREE.MeshStandardMaterial({ color: noseColor, roughness: 0.15, metalness: 0.1 }), []);
  const innerEarMat = useMemo(() => new THREE.MeshStandardMaterial({ color: innerEarColor, roughness: 0.25, flatShading: true }), []);
  const lidMat = useMemo(() => new THREE.MeshStandardMaterial({ color: lidColor, roughness: 0.3, metalness: 0.1, flatShading: true }), []);
  const whiskerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f0f0f0", roughness: 0.3, metalness: 0.1, depthWrite: false }), []);

  return (
    <group ref={groupRef}>
      {/* ── Prismatic Head ── */}
      <mesh material={bodyMat} scale={[1.0, 1.05, 0.7]}>
        <octahedronGeometry args={[0.9, 2]} />
      </mesh>

      {/* ── Left Ear ── */}
      <group position={[-0.45, 0.75, 0.1]} rotation={[0, 0, -0.2]}>
        <mesh material={bodyMat}>
          <coneGeometry args={[0.22, 0.6, 4, 1]} />
        </mesh>
        <mesh position={[0, -0.05, 0.06]} scale={[0.65, 0.65, 0.65]} material={innerEarMat}>
          <coneGeometry args={[0.15, 0.5, 4, 1]} />
        </mesh>
      </group>

      {/* ── Right Ear ── */}
      <group position={[0.45, 0.75, 0.1]} rotation={[0, 0, 0.2]}>
        <mesh material={bodyMat}>
          <coneGeometry args={[0.22, 0.6, 4, 1]} />
        </mesh>
        <mesh position={[0, -0.05, 0.06]} scale={[0.65, 0.65, 0.65]} material={innerEarMat}>
          <coneGeometry args={[0.15, 0.5, 4, 1]} />
        </mesh>
      </group>

      {/* ── Eyes ── */}
      <group position={[-0.22, 0.15, 0.58]}>
        <mesh material={darkMat}>
          <sphereGeometry args={[0.16, 12, 12]} />
        </mesh>
        <mesh material={eyeMat} position={[0, 0, 0.03]}>
          <sphereGeometry args={[0.12, 12, 12]} />
        </mesh>
        <mesh ref={leftPupilRef} material={pupilMat} position={[0, 0, 0.08]}>
          <sphereGeometry args={[0.06, 8, 8]} />
        </mesh>
        {/* Eyelid: centered on eye, covers it when scale.y=1 */}
        <mesh ref={leftLidRef} material={lidMat} position={[0, 0, 0.05]} scale={[1.1, 0.01, 0.9]}>
          <boxGeometry args={[0.22, 0.34, 0.08]} />
        </mesh>
      </group>

      <group position={[0.22, 0.15, 0.58]}>
        <mesh material={darkMat}>
          <sphereGeometry args={[0.16, 12, 12]} />
        </mesh>
        <mesh material={eyeMat} position={[0, 0, 0.03]}>
          <sphereGeometry args={[0.12, 12, 12]} />
        </mesh>
        <mesh ref={rightPupilRef} material={pupilMat} position={[0, 0, 0.08]}>
          <sphereGeometry args={[0.06, 8, 8]} />
        </mesh>
        <mesh ref={rightLidRef} material={lidMat} position={[0, 0, 0.05]} scale={[1.1, 0.01, 0.9]}>
          <boxGeometry args={[0.22, 0.34, 0.08]} />
        </mesh>
      </group>

      {/* ── Nose ── */}
      <mesh position={[0, -0.12, 0.66]} material={noseMat}>
        <sphereGeometry args={[0.07, 8, 6]} scale={[1.2, 0.7, 1]} />
      </mesh>

      {/* ── Mouth (angled lines below nose) ── */}
      <mesh position={[-0.06, -0.22, 0.65]} rotation={[0, 0, -0.35]} material={darkMat}>
        <boxGeometry args={[0.12, 0.02, 0.03]} />
      </mesh>
      <mesh position={[0.06, -0.22, 0.65]} rotation={[0, 0, 0.35]} material={darkMat}>
        <boxGeometry args={[0.12, 0.02, 0.03]} />
      </mesh>

      {/* ── Whiskers: protruding from cheeks with renderOrder override ── */}
      {/* Left side — point outward along -X */}
      <mesh position={[-0.32, -0.02, 0.44]} rotation={[0, 0, 0.15]} material={whiskerMat} renderOrder={1}>
        <boxGeometry args={[0.5, 0.04, 0.06]} />
      </mesh>
      <mesh position={[-0.34, -0.12, 0.38]} rotation={[0.05, 0, 0.25]} material={whiskerMat} renderOrder={1}>
        <boxGeometry args={[0.45, 0.035, 0.05]} />
      </mesh>

      {/* Right side — point outward along +X */}
      <mesh position={[0.32, -0.02, 0.44]} rotation={[0, 0, -0.15]} material={whiskerMat} renderOrder={1}>
        <boxGeometry args={[0.5, 0.04, 0.06]} />
      </mesh>
      <mesh position={[0.34, -0.12, 0.38]} rotation={[0.05, 0, -0.25]} material={whiskerMat} renderOrder={1}>
        <boxGeometry args={[0.45, 0.035, 0.05]} />
      </mesh>
    </group>
  );
}

export default function ThreeDCat({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  return (
    <div className="w-28 h-28 md:w-36 md:h-36">
      <Canvas
        camera={{ position: [0, 0.2, 4.5], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.9} />
        <directionalLight position={[-3, 2, -2]} intensity={0.35} />
        <pointLight position={[0, 1.5, 3]} intensity={0.6} color="#a7f3d0" />
        <pointLight position={[2, -1, 2]} intensity={0.3} color="#bbf7d0" />
        <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.3}>
          <CatHead mouseX={mouseX} mouseY={mouseY} />
        </Float>
        <Environment preset="city" environmentIntensity={0.25} />
      </Canvas>
    </div>
  );
}
