import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { Box, Typography, Paper, Slider, Button, IconButton, Stack, CircularProgress } from '@mui/material';
import { Fullscreen, FullscreenExit, ZoomIn, ZoomOut, Refresh, Info } from '@mui/icons-material';

// Model component with loading
const Model = ({ modelPath, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0] }) => {
  const gltf = useLoader(GLTFLoader, modelPath);
  const modelRef = useRef();
  const { camera } = useThree();
  
  useEffect(() => {
    if (gltf) {
      // Adjust camera to fit model
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      // Position camera to see entire model
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
      cameraZ *= 1.5; // Add some padding
      
      camera.position.set(center.x, center.y, center.z + cameraZ);
      camera.lookAt(center.x, center.y, center.z);
      camera.updateProjectionMatrix();
    }
  }, [gltf, camera]);
  
  useFrame(() => {
    if (modelRef.current) {
      // Optional: Add subtle animation
      // modelRef.current.rotation.y += 0.001;
    }
  });
  
  return (
    <primitive 
      ref={modelRef}
      object={gltf.scene} 
      scale={[scale, scale, scale]} 
      position={position}
      rotation={rotation}
    />
  );
};

// Loading fallback
const Loader = () => {
  return (
    <Html center>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ mt: 1, color: 'white' }}>
          Loading 3D Model...
        </Typography>
      </div>
    </Html>
  );
};

// Main component
const ModelViewer = ({ 
  modelPath = '/models/monasteries/great-lavra.glb', 
  title = 'Monastery 3D Model',
  description = 'Explore this detailed 3D model of the monastery. Use mouse to rotate, scroll to zoom.',
  hotspots = []
}) => {
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  const resetCamera = () => {
    // Reset will be handled by OrbitControls reset
    if (containerRef.current) {
      const controls = containerRef.current.querySelector('canvas');
      if (controls) {
        // This is a simplified approach - in a real app you would
        // need to access the actual OrbitControls instance
        setScale(1);
      }
    }
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        height: isFullscreen ? '100vh' : 500,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'rgba(0, 0, 0, 0.02)',
      }}
      ref={containerRef}
    >
      <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10, maxWidth: '40%' }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Paper>
      </Box>
      
      <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 10 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ZoomOut />
          <Slider
            value={scale}
            min={0.5}
            max={2}
            step={0.1}
            onChange={(_, newValue) => setScale(newValue)}
            sx={{ mx: 2, flexGrow: 1 }}
          />
          <ZoomIn />
          
          <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
            <IconButton onClick={resetCamera} size="small">
              <Refresh />
            </IconButton>
            <IconButton onClick={handleFullscreen} size="small">
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Stack>
        </Paper>
      </Box>
      
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'linear-gradient(to bottom, #e0e0e0, #f5f5f5)' }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        
        <Suspense fallback={<Loader />}>
          <Model modelPath={modelPath} scale={scale} />
          <Environment preset="sunset" />
        </Suspense>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={20}
        />
      </Canvas>
    </Paper>
  );
};

export default ModelViewer;