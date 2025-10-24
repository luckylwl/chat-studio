import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnalytics } from './AnalyticsProvider'
import { useAppStore } from '@/store'
import { cn } from '@/utils'

interface Vector3 {
  x: number
  y: number
  z: number
}

interface Camera {
  position: Vector3
  rotation: Vector3
  fov: number
}

interface Scene3D {
  id: string
  name: string
  description: string
  type: 'space_station' | 'library' | 'garden' | 'office' | 'cyberpunk' | 'forest' | 'beach' | 'mountain'
  environment: {
    skybox: string
    lighting: {
      ambient: string
      directional: {
        color: string
        intensity: number
        position: Vector3
      }
    }
    fog: {
      color: string
      near: number
      far: number
    }
  }
  objects: Scene3DObject[]
  sounds: {
    ambient?: string
    effects: string[]
  }
  interactive: boolean
  aiPresence: {
    position: Vector3
    avatar: string
    animation: string
  }
}

interface Scene3DObject {
  id: string
  type: 'mesh' | 'light' | 'particle' | 'text' | 'portal'
  name: string
  position: Vector3
  rotation: Vector3
  scale: Vector3
  material: {
    color: string
    texture?: string
    metallic: number
    roughness: number
    emission?: string
  }
  geometry: {
    type: 'box' | 'sphere' | 'cylinder' | 'plane' | 'custom'
    parameters: Record<string, number>
  }
  animation?: {
    type: 'rotate' | 'float' | 'pulse' | 'orbit'
    speed: number
    amplitude: number
  }
  interactive?: boolean
  onClick?: () => void
}

interface VirtualEnvironment3DProps {
  className?: string
}

const scenes3D: Scene3D[] = [
  {
    id: 'space_station',
    name: '太空站',
    description: '未来科技感的太空站环境',
    type: 'space_station',
    environment: {
      skybox: 'stars',
      lighting: {
        ambient: '#1a1a2e',
        directional: {
          color: '#ffffff',
          intensity: 1.2,
          position: { x: 10, y: 10, z: 10 }
        }
      },
      fog: {
        color: '#16213e',
        near: 50,
        far: 200
      }
    },
    objects: [
      {
        id: 'control_panel',
        type: 'mesh',
        name: '控制面板',
        position: { x: 0, y: 1, z: -2 },
        rotation: { x: -0.3, y: 0, z: 0 },
        scale: { x: 2, y: 1, z: 0.1 },
        material: {
          color: '#003366',
          metallic: 0.8,
          roughness: 0.2,
          emission: '#0066cc'
        },
        geometry: {
          type: 'box',
          parameters: { width: 1, height: 1, depth: 1 }
        },
        animation: {
          type: 'pulse',
          speed: 2,
          amplitude: 0.1
        },
        interactive: true
      }
    ],
    sounds: {
      ambient: 'space_ambience.mp3',
      effects: ['beep.wav', 'whoosh.wav']
    },
    interactive: true,
    aiPresence: {
      position: { x: -1, y: 0, z: -1 },
      avatar: 'hologram',
      animation: 'float'
    }
  },
  {
    id: 'digital_library',
    name: '数字图书馆',
    description: '充满知识氛围的现代图书馆',
    type: 'library',
    environment: {
      skybox: 'indoor',
      lighting: {
        ambient: '#f5f5dc',
        directional: {
          color: '#ffeaa7',
          intensity: 0.8,
          position: { x: 5, y: 15, z: 5 }
        }
      },
      fog: {
        color: '#f9f9f9',
        near: 30,
        far: 100
      }
    },
    objects: [
      {
        id: 'bookshelf',
        type: 'mesh',
        name: '书架',
        position: { x: -3, y: 0, z: -2 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.5, y: 3, z: 4 },
        material: {
          color: '#8b4513',
          metallic: 0.1,
          roughness: 0.9
        },
        geometry: {
          type: 'box',
          parameters: { width: 1, height: 1, depth: 1 }
        },
        interactive: true
      }
    ],
    sounds: {
      ambient: 'library_ambience.mp3',
      effects: ['page_turn.wav', 'book_close.wav']
    },
    interactive: true,
    aiPresence: {
      position: { x: 1, y: 0, z: -1 },
      avatar: 'librarian',
      animation: 'idle'
    }
  },
  {
    id: 'zen_garden',
    name: '禅意花园',
    description: '宁静祥和的日式花园',
    type: 'garden',
    environment: {
      skybox: 'sunset',
      lighting: {
        ambient: '#ffeaa7',
        directional: {
          color: '#fd79a8',
          intensity: 0.6,
          position: { x: -10, y: 20, z: 10 }
        }
      },
      fog: {
        color: '#ffeaa7',
        near: 20,
        far: 80
      }
    },
    objects: [
      {
        id: 'zen_stone',
        type: 'mesh',
        name: '禅石',
        position: { x: 0, y: 0.5, z: -1 },
        rotation: { x: 0, y: 0.3, z: 0 },
        scale: { x: 1, y: 0.8, z: 1 },
        material: {
          color: '#696969',
          metallic: 0.0,
          roughness: 0.8
        },
        geometry: {
          type: 'sphere',
          parameters: { radius: 0.5 }
        },
        animation: {
          type: 'float',
          speed: 1,
          amplitude: 0.2
        },
        interactive: true
      }
    ],
    sounds: {
      ambient: 'nature_sounds.mp3',
      effects: ['water_drop.wav', 'wind_chimes.wav']
    },
    interactive: true,
    aiPresence: {
      position: { x: 2, y: 0, z: 0 },
      avatar: 'sage',
      animation: 'meditate'
    }
  },
  {
    id: 'cyberpunk_city',
    name: '赛博朋克城市',
    description: '霓虹闪烁的未来都市',
    type: 'cyberpunk',
    environment: {
      skybox: 'neon_city',
      lighting: {
        ambient: '#0f0f23',
        directional: {
          color: '#ff006e',
          intensity: 0.8,
          position: { x: 0, y: 20, z: 0 }
        }
      },
      fog: {
        color: '#1a0033',
        near: 10,
        far: 150
      }
    },
    objects: [
      {
        id: 'neon_sign',
        type: 'mesh',
        name: '霓虹招牌',
        position: { x: -2, y: 3, z: -5 },
        rotation: { x: 0, y: 0.2, z: 0 },
        scale: { x: 3, y: 1, z: 0.1 },
        material: {
          color: '#ff006e',
          metallic: 0.0,
          roughness: 0.1,
          emission: '#ff006e'
        },
        geometry: {
          type: 'plane',
          parameters: { width: 1, height: 1 }
        },
        animation: {
          type: 'pulse',
          speed: 3,
          amplitude: 0.5
        },
        interactive: true
      }
    ],
    sounds: {
      ambient: 'cyberpunk_ambience.mp3',
      effects: ['synth_beep.wav', 'electric_hum.wav']
    },
    interactive: true,
    aiPresence: {
      position: { x: 0, y: 0, z: -2 },
      avatar: 'android',
      animation: 'digital_pulse'
    }
  }
]

export const VirtualEnvironment3D: React.FC<VirtualEnvironment3DProps> = ({ className }) => {
  const { t } = useTranslation()
  const { trackFeatureUsage, trackUserAction } = useAnalytics()
  const { currentChat, user } = useAppStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0, isDown: false })
  const keysRef = useRef<Set<string>>(new Set())

  const [currentScene, setCurrentScene] = useState<Scene3D>(scenes3D[0])
  const [camera, setCamera] = useState<Camera>({
    position: { x: 0, y: 2, z: 5 },
    rotation: { x: 0, y: 0, z: 0 },
    fov: 60
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [vrMode, setVRMode] = useState(false)
  const [selectedObject, setSelectedObject] = useState<Scene3DObject | null>(null)
  const [aiSpeaking, setAISpeaking] = useState(false)
  const [performanceStats, setPerformanceStats] = useState({
    fps: 60,
    triangles: 0,
    drawCalls: 0
  })

  const renderer = useMemo(() => {
    class WebGLRenderer {
      private gl: WebGLRenderingContext | null = null
      private programs: Map<string, WebGLProgram> = new Map()
      private meshes: Map<string, any> = new Map()

      init(canvas: HTMLCanvasElement) {
        this.gl = canvas.getContext('webgl')
        if (!this.gl) {
          throw new Error('WebGL not supported')
        }

        this.gl.enable(this.gl.DEPTH_TEST)
        this.gl.enable(this.gl.CULL_FACE)
        this.setupShaders()
      }

      private setupShaders() {
        if (!this.gl) return

        const vertexShaderSource = `
          attribute vec3 position;
          attribute vec3 normal;
          attribute vec2 uv;

          uniform mat4 modelMatrix;
          uniform mat4 viewMatrix;
          uniform mat4 projectionMatrix;
          uniform mat4 normalMatrix;

          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec3 vWorldPosition;

          void main() {
            vUv = uv;
            vNormal = normalize((normalMatrix * vec4(normal, 0.0)).xyz);

            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;

            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `

        const fragmentShaderSource = `
          precision mediump float;

          uniform vec3 color;
          uniform vec3 emissionColor;
          uniform float metallic;
          uniform float roughness;
          uniform vec3 lightDirection;
          uniform vec3 lightColor;
          uniform vec3 ambientColor;
          uniform vec3 cameraPosition;
          uniform float time;

          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec3 vWorldPosition;

          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
            vec3 lightDir = normalize(-lightDirection);

            float NdotL = max(dot(normal, lightDir), 0.0);
            vec3 diffuse = color * lightColor * NdotL;

            vec3 reflectDir = reflect(-lightDir, normal);
            float spec = pow(max(dot(viewDirection, reflectDir), 0.0), 32.0 * (1.0 - roughness));
            vec3 specular = lightColor * spec * metallic;

            vec3 ambient = ambientColor * color;
            vec3 emission = emissionColor * (0.8 + 0.2 * sin(time * 2.0));

            gl_FragColor = vec4(ambient + diffuse + specular + emission, 1.0);
          }
        `

        const program = this.createProgram(vertexShaderSource, fragmentShaderSource)
        if (program) {
          this.programs.set('standard', program)
        }
      }

      private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
        if (!this.gl) return null

        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource)
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource)

        if (!vertexShader || !fragmentShader) return null

        const program = this.gl.createProgram()
        if (!program) return null

        this.gl.attachShader(program, vertexShader)
        this.gl.attachShader(program, fragmentShader)
        this.gl.linkProgram(program)

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
          console.error('Program linking error:', this.gl.getProgramInfoLog(program))
          return null
        }

        return program
      }

      private createShader(type: number, source: string): WebGLShader | null {
        if (!this.gl) return null

        const shader = this.gl.createShader(type)
        if (!shader) return null

        this.gl.shaderSource(shader, source)
        this.gl.compileShader(shader)

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
          console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader))
          return null
        }

        return shader
      }

      render(scene: Scene3D, camera: Camera, time: number) {
        if (!this.gl || !canvasRef.current) return

        const canvas = canvasRef.current
        this.gl.viewport(0, 0, canvas.width, canvas.height)

        const bgColor = this.hexToRgb(scene.environment.lighting.ambient)
        this.gl.clearColor(bgColor.r, bgColor.g, bgColor.b, 1.0)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

        const program = this.programs.get('standard')
        if (!program) return

        this.gl.useProgram(program)

        // Set uniforms
        const projectionMatrix = this.perspective(camera.fov, canvas.width / canvas.height, 0.1, 1000)
        const viewMatrix = this.lookAt(camera.position, { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })

        this.setUniform(program, 'projectionMatrix', projectionMatrix)
        this.setUniform(program, 'viewMatrix', viewMatrix)
        this.setUniform(program, 'lightDirection', [
          scene.environment.lighting.directional.position.x,
          scene.environment.lighting.directional.position.y,
          scene.environment.lighting.directional.position.z
        ])
        this.setUniform(program, 'lightColor', this.hexToRgbArray(scene.environment.lighting.directional.color))
        this.setUniform(program, 'ambientColor', this.hexToRgbArray(scene.environment.lighting.ambient))
        this.setUniform(program, 'cameraPosition', [camera.position.x, camera.position.y, camera.position.z])
        this.setUniform(program, 'time', time)

        // Render objects
        let triangleCount = 0
        let drawCallCount = 0

        scene.objects.forEach((object) => {
          const modelMatrix = this.getModelMatrix(object, time)
          this.setUniform(program, 'modelMatrix', modelMatrix)
          this.setUniform(program, 'normalMatrix', modelMatrix) // Simplified
          this.setUniform(program, 'color', this.hexToRgbArray(object.material.color))
          this.setUniform(program, 'emissionColor', this.hexToRgbArray(object.material.emission || '#000000'))
          this.setUniform(program, 'metallic', object.material.metallic)
          this.setUniform(program, 'roughness', object.material.roughness)

          const geometry = this.getGeometry(object.geometry)
          if (geometry) {
            this.renderGeometry(program, geometry)
            triangleCount += geometry.triangles
            drawCallCount++
          }
        })

        setPerformanceStats(prev => ({ ...prev, triangles: triangleCount, drawCalls: drawCallCount }))
      }

      private hexToRgb(hex: string) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255
        } : { r: 1, g: 1, b: 1 }
      }

      private hexToRgbArray(hex: string): number[] {
        const rgb = this.hexToRgb(hex)
        return [rgb.r, rgb.g, rgb.b]
      }

      private perspective(fov: number, aspect: number, near: number, far: number): number[] {
        const f = 1.0 / Math.tan(fov * Math.PI / 360)
        const nf = 1 / (near - far)

        return [
          f / aspect, 0, 0, 0,
          0, f, 0, 0,
          0, 0, (far + near) * nf, -1,
          0, 0, 2 * far * near * nf, 0
        ]
      }

      private lookAt(eye: Vector3, target: Vector3, up: Vector3): number[] {
        const zAxis = this.normalize(this.subtract(eye, target))
        const xAxis = this.normalize(this.cross(up, zAxis))
        const yAxis = this.cross(zAxis, xAxis)

        return [
          xAxis.x, yAxis.x, zAxis.x, 0,
          xAxis.y, yAxis.y, zAxis.y, 0,
          xAxis.z, yAxis.z, zAxis.z, 0,
          -this.dot(xAxis, eye), -this.dot(yAxis, eye), -this.dot(zAxis, eye), 1
        ]
      }

      private normalize(v: Vector3): Vector3 {
        const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
        return { x: v.x / length, y: v.y / length, z: v.z / length }
      }

      private subtract(a: Vector3, b: Vector3): Vector3 {
        return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
      }

      private cross(a: Vector3, b: Vector3): Vector3 {
        return {
          x: a.y * b.z - a.z * b.y,
          y: a.z * b.x - a.x * b.z,
          z: a.x * b.y - a.y * b.x
        }
      }

      private dot(a: Vector3, b: Vector3): number {
        return a.x * b.x + a.y * b.y + a.z * b.z
      }

      private getModelMatrix(object: Scene3DObject, time: number): number[] {
        let { position, rotation, scale } = object

        // Apply animation
        if (object.animation) {
          switch (object.animation.type) {
            case 'rotate':
              rotation = {
                ...rotation,
                y: rotation.y + time * object.animation.speed * 0.001
              }
              break
            case 'float':
              position = {
                ...position,
                y: position.y + Math.sin(time * object.animation.speed * 0.001) * object.animation.amplitude
              }
              break
            case 'pulse':
              const pulseFactor = 1 + Math.sin(time * object.animation.speed * 0.001) * object.animation.amplitude
              scale = {
                x: scale.x * pulseFactor,
                y: scale.y * pulseFactor,
                z: scale.z * pulseFactor
              }
              break
          }
        }

        // Translation matrix
        const t = [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          position.x, position.y, position.z, 1
        ]

        // Rotation matrices
        const rx = [
          1, 0, 0, 0,
          0, Math.cos(rotation.x), -Math.sin(rotation.x), 0,
          0, Math.sin(rotation.x), Math.cos(rotation.x), 0,
          0, 0, 0, 1
        ]

        const ry = [
          Math.cos(rotation.y), 0, Math.sin(rotation.y), 0,
          0, 1, 0, 0,
          -Math.sin(rotation.y), 0, Math.cos(rotation.y), 0,
          0, 0, 0, 1
        ]

        const rz = [
          Math.cos(rotation.z), -Math.sin(rotation.z), 0, 0,
          Math.sin(rotation.z), Math.cos(rotation.z), 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ]

        // Scale matrix
        const s = [
          scale.x, 0, 0, 0,
          0, scale.y, 0, 0,
          0, 0, scale.z, 0,
          0, 0, 0, 1
        ]

        // Combine matrices: T * Ry * Rx * Rz * S
        return this.multiplyMatrices(t, this.multiplyMatrices(ry, this.multiplyMatrices(rx, this.multiplyMatrices(rz, s))))
      }

      private multiplyMatrices(a: number[], b: number[]): number[] {
        const result = new Array(16).fill(0)
        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 4; j++) {
            for (let k = 0; k < 4; k++) {
              result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j]
            }
          }
        }
        return result
      }

      private setUniform(program: WebGLProgram, name: string, value: any) {
        if (!this.gl) return

        const location = this.gl.getUniformLocation(program, name)
        if (!location) return

        if (Array.isArray(value)) {
          if (value.length === 16) {
            this.gl.uniformMatrix4fv(location, false, value)
          } else if (value.length === 3) {
            this.gl.uniform3fv(location, value)
          } else if (value.length === 2) {
            this.gl.uniform2fv(location, value)
          }
        } else if (typeof value === 'number') {
          this.gl.uniform1f(location, value)
        }
      }

      private getGeometry(geometry: Scene3DObject['geometry']) {
        const key = `${geometry.type}_${JSON.stringify(geometry.parameters)}`
        if (this.meshes.has(key)) {
          return this.meshes.get(key)
        }

        let vertices: number[] = []
        let normals: number[] = []
        let uvs: number[] = []
        let indices: number[] = []
        let triangles = 0

        switch (geometry.type) {
          case 'box':
            ({ vertices, normals, uvs, indices, triangles } = this.createBox(geometry.parameters))
            break
          case 'sphere':
            ({ vertices, normals, uvs, indices, triangles } = this.createSphere(geometry.parameters))
            break
          case 'plane':
            ({ vertices, normals, uvs, indices, triangles } = this.createPlane(geometry.parameters))
            break
          default:
            ({ vertices, normals, uvs, indices, triangles } = this.createBox({ width: 1, height: 1, depth: 1 }))
        }

        const mesh = { vertices, normals, uvs, indices, triangles }
        this.meshes.set(key, mesh)
        return mesh
      }

      private createBox(params: Record<string, number>) {
        const { width = 1, height = 1, depth = 1 } = params
        const w = width / 2, h = height / 2, d = depth / 2

        const vertices = [
          // Front face
          -w, -h,  d,  w, -h,  d,  w,  h,  d, -w,  h,  d,
          // Back face
          -w, -h, -d, -w,  h, -d,  w,  h, -d,  w, -h, -d,
          // Top face
          -w,  h, -d, -w,  h,  d,  w,  h,  d,  w,  h, -d,
          // Bottom face
          -w, -h, -d,  w, -h, -d,  w, -h,  d, -w, -h,  d,
          // Right face
           w, -h, -d,  w,  h, -d,  w,  h,  d,  w, -h,  d,
          // Left face
          -w, -h, -d, -w, -h,  d, -w,  h,  d, -w,  h, -d
        ]

        const normals = [
          // Front
          0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
          // Back
          0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
          // Top
          0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
          // Bottom
          0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
          // Right
          1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
          // Left
          -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0
        ]

        const uvs = [
          0, 0, 1, 0, 1, 1, 0, 1, // Front
          1, 0, 1, 1, 0, 1, 0, 0, // Back
          0, 1, 0, 0, 1, 0, 1, 1, // Top
          1, 1, 0, 1, 0, 0, 1, 0, // Bottom
          1, 0, 1, 1, 0, 1, 0, 0, // Right
          0, 0, 1, 0, 1, 1, 0, 1  // Left
        ]

        const indices = [
          0, 1, 2, 0, 2, 3,    // Front
          4, 5, 6, 4, 6, 7,    // Back
          8, 9, 10, 8, 10, 11, // Top
          12, 13, 14, 12, 14, 15, // Bottom
          16, 17, 18, 16, 18, 19, // Right
          20, 21, 22, 20, 22, 23  // Left
        ]

        return { vertices, normals, uvs, indices, triangles: 12 }
      }

      private createSphere(params: Record<string, number>) {
        const { radius = 0.5, widthSegments = 32, heightSegments = 16 } = params

        const vertices: number[] = []
        const normals: number[] = []
        const uvs: number[] = []
        const indices: number[] = []

        for (let y = 0; y <= heightSegments; y++) {
          const v = y / heightSegments
          const theta = v * Math.PI

          for (let x = 0; x <= widthSegments; x++) {
            const u = x / widthSegments
            const phi = u * Math.PI * 2

            const px = -radius * Math.cos(phi) * Math.sin(theta)
            const py = radius * Math.cos(theta)
            const pz = radius * Math.sin(phi) * Math.sin(theta)

            vertices.push(px, py, pz)
            normals.push(px / radius, py / radius, pz / radius)
            uvs.push(u, 1 - v)
          }
        }

        for (let y = 0; y < heightSegments; y++) {
          for (let x = 0; x < widthSegments; x++) {
            const a = y * (widthSegments + 1) + x
            const b = a + widthSegments + 1
            const c = a + 1
            const d = b + 1

            if (y !== 0) indices.push(a, b, c)
            if (y !== heightSegments - 1) indices.push(b, d, c)
          }
        }

        return { vertices, normals, uvs, indices, triangles: indices.length / 3 }
      }

      private createPlane(params: Record<string, number>) {
        const { width = 1, height = 1 } = params
        const w = width / 2, h = height / 2

        const vertices = [-w, -h, 0, w, -h, 0, w, h, 0, -w, h, 0]
        const normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]
        const uvs = [0, 0, 1, 0, 1, 1, 0, 1]
        const indices = [0, 1, 2, 0, 2, 3]

        return { vertices, normals, uvs, indices, triangles: 2 }
      }

      private renderGeometry(program: WebGLProgram, geometry: any) {
        if (!this.gl) return

        // Create and bind buffers
        const positionBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(geometry.vertices), this.gl.STATIC_DRAW)

        const positionAttribute = this.gl.getAttribLocation(program, 'position')
        this.gl.enableVertexAttribArray(positionAttribute)
        this.gl.vertexAttribPointer(positionAttribute, 3, this.gl.FLOAT, false, 0, 0)

        const normalBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(geometry.normals), this.gl.STATIC_DRAW)

        const normalAttribute = this.gl.getAttribLocation(program, 'normal')
        this.gl.enableVertexAttribArray(normalAttribute)
        this.gl.vertexAttribPointer(normalAttribute, 3, this.gl.FLOAT, false, 0, 0)

        const uvBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, uvBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(geometry.uvs), this.gl.STATIC_DRAW)

        const uvAttribute = this.gl.getAttribLocation(program, 'uv')
        this.gl.enableVertexAttribArray(uvAttribute)
        this.gl.vertexAttribPointer(uvAttribute, 2, this.gl.FLOAT, false, 0, 0)

        const indexBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.indices), this.gl.STATIC_DRAW)

        this.gl.drawElements(this.gl.TRIANGLES, geometry.indices.length, this.gl.UNSIGNED_SHORT, 0)
      }
    }

    return new WebGLRenderer()
  }, [])

  useEffect(() => {
    trackFeatureUsage('virtual_environment_3d')
  }, [trackFeatureUsage])

  const initializeRenderer = useCallback(async () => {
    if (!canvasRef.current) return

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      renderer.init(canvasRef.current)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to initialize 3D renderer:', error)
      setIsLoading(false)
    }
  }, [renderer])

  const updateCamera = useCallback((deltaX: number, deltaY: number, isRotation: boolean = true) => {
    setCamera(prev => {
      if (isRotation) {
        return {
          ...prev,
          rotation: {
            x: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev.rotation.x + deltaY * 0.01)),
            y: prev.rotation.y + deltaX * 0.01,
            z: prev.rotation.z
          }
        }
      } else {
        const speed = 0.1
        return {
          ...prev,
          position: {
            x: prev.position.x + deltaX * speed,
            y: Math.max(0.5, Math.min(10, prev.position.y - deltaY * speed)),
            z: prev.position.z
          }
        }
      }
    })
  }, [])

  const handleObjectClick = useCallback((object: Scene3DObject) => {
    setSelectedObject(object)
    trackUserAction('click_3d_object', 'object', { objectId: object.id, objectName: object.name })

    if (object.onClick) {
      object.onClick()
    }

    // Trigger AI response based on object interaction
    if (object.interactive) {
      setAISpeaking(true)
      setTimeout(() => setAISpeaking(false), 3000)
    }
  }, [trackUserAction])

  const switchScene = useCallback((sceneId: string) => {
    const scene = scenes3D.find(s => s.id === sceneId)
    if (scene) {
      setCurrentScene(scene)
      setSelectedObject(null)
      trackUserAction('switch_scene', 'scene', { sceneId, sceneName: scene.name })
    }
  }, [trackUserAction])

  const toggleVRMode = useCallback(() => {
    setVRMode(prev => !prev)
    trackUserAction('toggle_vr_mode', 'button', { vrMode: !vrMode })
  }, [vrMode, trackUserAction])

  // Animation loop
  useEffect(() => {
    if (isLoading) return

    let lastTime = 0
    let frameCount = 0
    let fpsTime = 0

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      // Calculate FPS
      frameCount++
      fpsTime += deltaTime
      if (fpsTime >= 1000) {
        setPerformanceStats(prev => ({ ...prev, fps: Math.round(frameCount * 1000 / fpsTime) }))
        frameCount = 0
        fpsTime = 0
      }

      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth * window.devicePixelRatio
        canvasRef.current.height = canvasRef.current.offsetHeight * window.devicePixelRatio
        renderer.render(currentScene, camera, currentTime)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isLoading, renderer, currentScene, camera])

  // Mouse controls
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDown) return

      const deltaX = e.clientX - mouseRef.current.x
      const deltaY = e.clientY - mouseRef.current.y

      updateCamera(deltaX, deltaY, !e.shiftKey)

      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }

    const handleMouseUp = () => {
      mouseRef.current.isDown = false
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      setCamera(prev => ({
        ...prev,
        position: {
          ...prev.position,
          z: Math.max(1, Math.min(20, prev.position.z + e.deltaY * 0.01))
        }
      }))
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [updateCamera])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase())
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }

    // Movement loop
    const moveInterval = setInterval(() => {
      const speed = 0.1
      let moved = false

      setCamera(prev => {
        const newPosition = { ...prev.position }

        if (keysRef.current.has('w') || keysRef.current.has('arrowup')) {
          newPosition.z -= speed
          moved = true
        }
        if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) {
          newPosition.z += speed
          moved = true
        }
        if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) {
          newPosition.x -= speed
          moved = true
        }
        if (keysRef.current.has('d') || keysRef.current.has('arrowright')) {
          newPosition.x += speed
          moved = true
        }
        if (keysRef.current.has('q')) {
          newPosition.y += speed
          moved = true
        }
        if (keysRef.current.has('e')) {
          newPosition.y = Math.max(0.5, newPosition.y - speed)
          moved = true
        }

        return moved ? { ...prev, position: newPosition } : prev
      })
    }, 16)

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      clearInterval(moveInterval)
    }
  }, [])

  useEffect(() => {
    initializeRenderer()
  }, [initializeRenderer])

  return (
    <div className={cn("bg-black rounded-xl overflow-hidden relative", className)}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-96 md:h-[600px] block"
        style={{ imageRendering: 'auto' }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>正在初始化3D环境...</p>
          </div>
        </div>
      )}

      {/* Scene selector */}
      <div className="absolute top-4 left-4 flex flex-wrap gap-2">
        {scenes3D.map((scene) => (
          <button
            key={scene.id}
            onClick={() => switchScene(scene.id)}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-all backdrop-blur-sm",
              currentScene.id === scene.id
                ? "bg-blue-500 text-white"
                : "bg-black bg-opacity-50 text-white hover:bg-opacity-70"
            )}
          >
            {scene.name}
          </button>
        ))}
      </div>

      {/* Controls panel */}
      {showControls && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-75 backdrop-blur-sm text-white p-4 rounded-lg text-sm max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">控制说明</h4>
            <button
              onClick={() => setShowControls(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 text-xs">
            <p><kbd className="bg-gray-700 px-1 rounded">鼠标拖拽</kbd> 旋转视角</p>
            <p><kbd className="bg-gray-700 px-1 rounded">Shift+拖拽</kbd> 平移视角</p>
            <p><kbd className="bg-gray-700 px-1 rounded">滚轮</kbd> 缩放</p>
            <p><kbd className="bg-gray-700 px-1 rounded">WASD</kbd> 移动</p>
            <p><kbd className="bg-gray-700 px-1 rounded">QE</kbd> 上下移动</p>
            <p><kbd className="bg-gray-700 px-1 rounded">点击物体</kbd> 交互</p>
          </div>
        </div>
      )}

      {/* Performance stats */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 backdrop-blur-sm text-white p-3 rounded-lg text-xs">
        <div className="space-y-1">
          <div>FPS: <span className="text-green-400">{performanceStats.fps}</span></div>
          <div>三角形: <span className="text-blue-400">{performanceStats.triangles}</span></div>
          <div>绘制调用: <span className="text-yellow-400">{performanceStats.drawCalls}</span></div>
        </div>
      </div>

      {/* Scene info */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 backdrop-blur-sm text-white p-3 rounded-lg max-w-sm">
        <h4 className="font-medium mb-2">{currentScene.name}</h4>
        <p className="text-sm text-gray-300 mb-2">{currentScene.description}</p>
        {aiSpeaking && (
          <div className="flex items-center gap-2 text-blue-400 animate-pulse">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
            <span className="text-xs">AI正在响应...</span>
          </div>
        )}
      </div>

      {/* VR Mode toggle */}
      {navigator.userAgent.includes('VR') && (
        <button
          onClick={toggleVRMode}
          className={cn(
            "absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg font-medium transition-all backdrop-blur-sm",
            vrMode
              ? "bg-green-500 text-white"
              : "bg-black bg-opacity-50 text-white hover:bg-opacity-70"
          )}
        >
          {vrMode ? '退出VR模式' : '进入VR模式'}
        </button>
      )}

      {/* Object info panel */}
      {selectedObject && (
        <div className="absolute inset-x-4 bottom-20 bg-black bg-opacity-90 backdrop-blur-sm text-white p-4 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-lg">{selectedObject.name}</h4>
              <p className="text-sm text-gray-300 mt-1">
                位置: ({selectedObject.position.x.toFixed(1)}, {selectedObject.position.y.toFixed(1)}, {selectedObject.position.z.toFixed(1)})
              </p>
              <p className="text-sm text-gray-300">
                材质: {selectedObject.material.color}
              </p>
              {selectedObject.animation && (
                <p className="text-sm text-blue-400">
                  动画: {selectedObject.animation.type} (速度: {selectedObject.animation.speed})
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedObject(null)}
              className="text-gray-400 hover:text-white ml-4"
            >
              ✕
            </button>
          </div>
          {selectedObject.interactive && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                点击此物体可以与AI进行互动对话
              </p>
            </div>
          )}
        </div>
      )}

      {/* Show controls button */}
      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-lg hover:bg-opacity-70 transition-all"
        >
          ❓
        </button>
      )}
    </div>
  )
}

export default VirtualEnvironment3D