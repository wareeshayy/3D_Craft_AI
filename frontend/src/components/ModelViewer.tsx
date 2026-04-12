import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ModelViewerProps {
  modelUrl?: string;
  modelData?: ArrayBuffer;
  className?: string;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ modelUrl, modelData, className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const animationIdRef = useRef<number>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add a simple cube if no model is provided
    if (!modelUrl && !modelData) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      cube.castShadow = true;
      scene.add(cube);
    }

    // Load model if provided
    if (modelUrl || modelData) {
      loadModel(modelUrl, modelData, scene);
    }

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Rotate the scene
      scene.rotation.y += 0.01;
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current) {
        mountRef.current?.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [modelUrl, modelData]);

  const loadModel = async (url?: string, data?: ArrayBuffer, scene?: THREE.Scene) => {
    if (!scene) return;

    try {
      let gltfData;
      
      if (data) {
        // Load from ArrayBuffer
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();
        gltfData = await new Promise((resolve, reject) => {
          loader.parse(data, '', resolve, reject);
        });
      } else if (url) {
        // Load from URL
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();
        gltfData = await loader.loadAsync(url);
      }

      if (gltfData) {
        // Clear existing models
        scene.clear();
        
        // Add the loaded model
        scene.add(gltfData.scene);
        
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(gltfData.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        
        gltfData.scene.scale.setScalar(scale);
        gltfData.scene.position.sub(center.multiplyScalar(scale));
        
        // Add lighting back
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
      }
    } catch (error) {
      console.error('Error loading 3D model:', error);
      
      // Add error cube
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
    }
  };

  return (
    <div 
      ref={mountRef} 
      className={`w-full h-full bg-gray-100 rounded-lg overflow-hidden ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
};

export default ModelViewer;
