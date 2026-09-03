import { useMemo, useState, Suspense, Component, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, Center, Environment, Html, OrbitControls, useGLTF } from '@react-three/drei'
import { Maximize, Minimize, RotateCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getAuthToken } from '../api/client'
import './Viewer3D.css'

// Error Boundary Component
class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('3D Model Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div style={{ 
            color: 'var(--primary-maroon)', 
            textAlign: 'center', 
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxWidth: '400px'
          }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{this.props.t('viewer3d.failedToLoad')}</p>
            <p style={{ margin: '8px 0 0', fontSize: '0.9em' }}>
              {this.state.error?.message || this.props.t('viewer3d.unknownError')}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '0.85em', color: '#666' }}>
              {this.props.t('viewer3d.checkConsole')}
            </p>
          </div>
        </Html>
      )
    }
    return this.props.children
  }
}

function Model({ src, rotationY }) {
  try {
    const { scene } = useGLTF(src, undefined, (loader) => {
      loader.crossOrigin = 'use-credentials'
    })
    return (
      <Center>
        <primitive object={scene} rotation={[0, rotationY, 0]} />
      </Center>
    )
  } catch (error) {
    console.error('useGLTF Error:', error)
    console.error('Model source:', src)
    throw error // Re-throw to be caught by ErrorBoundary
  }
}

function LoadingFallback() {
  const { t } = useTranslation()
  return (
    <Html center>
      <div className="model-loading">{t('viewer3d.loading')}</div>
    </Html>
  )
}

function ErrorFallback() {
  const { t } = useTranslation()
  return (
    <Html center>
      <div style={{ 
        color: 'var(--primary-maroon)', 
        textAlign: 'center', 
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{t('viewer3d.failedToLoad')}</p>
        <p style={{ margin: '8px 0 0', fontSize: '0.9em' }}>
          {t('viewer3d.validFormat')}<br/>
          {t('viewer3d.gltfNote')}
        </p>
      </div>
    </Html>
  )
}

function Viewer3D({ modelSrc, title, showBrightnessControl = false }) {
  const { t } = useTranslation()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [modelError, setModelError] = useState(false)
  const [brightness, setBrightness] = useState(3)
  const [protectedModelUrl, setProtectedModelUrl] = useState('')
  const [isLoadingProtectedModel, setIsLoadingProtectedModel] = useState(false)
  const rotationY = useMemo(() => (rotation * Math.PI) / 180, [rotation])

  // Validate model source
  const isValidModel = useMemo(() => {
    if (!modelSrc) return false
    const validExtensions = ['.glb', '.gltf', '.bin']
    const lowerSrc = modelSrc.toLowerCase()
    if (lowerSrc.includes('/protected-3d/')) return true

    try {
      const pathname = new URL(modelSrc, window.location.origin).pathname.toLowerCase()
      return validExtensions.some(ext => pathname.endsWith(ext))
    } catch {
      return false
    }
  }, [modelSrc])

  useEffect(() => {
    let isActive = true
    let objectUrl = ''

    const loadProtectedModel = async () => {
      if (!modelSrc || !isValidModel) {
        setProtectedModelUrl('')
        setIsLoadingProtectedModel(false)
        return
      }

      setIsLoadingProtectedModel(true)

      try {
        const response = await fetch(modelSrc, {
          credentials: 'include',
          headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {},
        })
        if (!response.ok) {
          throw new Error(`Failed to load model: ${response.status}`)
        }

        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)

        if (isActive) {
          setProtectedModelUrl(objectUrl)
        }
      } catch (error) {
        console.error('Protected model load failed:', error)
        if (isActive) {
          setProtectedModelUrl('')
        }
      } finally {
        if (isActive) {
          setIsLoadingProtectedModel(false)
        }
      }
    }

    loadProtectedModel()

    return () => {
      isActive = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [modelSrc, isValidModel])

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const rotate = () => {
    setRotation(rotation + 90)
  }

  return (
    <div className={`viewer-3d ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="viewer-header">
        <h3>{title}</h3>
        <div className="viewer-controls">
          <button onClick={rotate} aria-label={t('viewer3d.rotate')} title={t('viewer3d.rotate')}>
            <RotateCw size={20} />
          </button>
          <button onClick={toggleFullscreen} aria-label={t('viewer3d.toggleFullscreen')} title={t('viewer3d.fullscreen')}>
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          {showBrightnessControl && (
            <div className="brightness-control" style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '1em' }}>
              <label htmlFor="brightness-slider" style={{ marginRight: 6, fontSize: '0.95em' }}>{t('viewer3d.brightness')}</label>
              <input
                id="brightness-slider"
                type="range"
                min={1}
                max={5}
                step={0.1}
                value={brightness}
                onChange={e => setBrightness(Number(e.target.value))}
                style={{ width: 80 }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="viewer-canvas" onContextMenu={(e) => e.preventDefault()}>
        {protectedModelUrl && isValidModel ? (
          <Canvas 
            camera={{ position: [0, 0.5, 4], fov: 50 }}
            onCreated={({ gl }) => {
              gl.physicallyCorrectLights = true
            }}
          >
            <ambientLight intensity={brightness} />
            <directionalLight position={[4, 6, 4]} intensity={brightness * 1.8} />
            <ModelErrorBoundary t={t}>
              <Suspense fallback={<LoadingFallback />}>
                <Bounds fit clip observe margin={1.2}>
                  <Model src={protectedModelUrl} rotationY={rotationY} />
                </Bounds>
                <Environment preset="city" exposure={brightness} />
              </Suspense>
            </ModelErrorBoundary>
            <OrbitControls enablePan enableZoom makeDefault />
          </Canvas>
        ) : modelSrc && isValidModel && isLoadingProtectedModel ? (
          <div className="model-placeholder">
            <p className="placeholder-text" style={{ color: 'var(--primary-maroon)' }}>
              Preparing protected model...
            </p>
          </div>
        ) : modelSrc && !isValidModel ? (
          <div className="model-placeholder">
            <div className="model-icon">
              <svg viewBox="0 0 100 100" width="100" height="100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--primary-maroon)" strokeWidth="3" />
                <line x1="30" y1="30" x2="70" y2="70" stroke="var(--primary-maroon)" strokeWidth="3" />
                <line x1="70" y1="30" x2="30" y2="70" stroke="var(--primary-maroon)" strokeWidth="3" />
              </svg>
            </div>
            <p className="placeholder-text" style={{ color: 'var(--primary-maroon)' }}>
              Invalid 3D Model Format
            </p>
            <p className="integration-note">
              Only .glb, .gltf, or .bin files are supported.<br/>
              Please upload a valid glTF model file.
            </p>
          </div>
        ) : (
          <div className="model-placeholder">
            <div className="model-icon">
              <svg viewBox="0 0 100 100" width="100" height="100">
                <polygon points="50,10 90,70 10,70" fill="var(--primary-maroon)" opacity="0.3" />
                <polygon points="50,30 70,60 30,60" fill="var(--accent-gold)" opacity="0.5" />
                <circle cx="50" cy="50" r="20" fill="var(--primary-maroon)" opacity="0.4" />
              </svg>
            </div>
            <p className="placeholder-text">
              3D Model Unavailable
            </p>
            
          </div>
        )}
      </div>

      <div className="viewer-instructions">
        <p>
          <strong>{t('viewer3d.controls')}:</strong> {t('viewer3d.controlsHelp')}
        </p>
      </div>
    </div>
  )
}

export default Viewer3D
