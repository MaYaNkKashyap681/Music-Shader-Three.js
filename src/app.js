import * as THREE from 'three'
import {
  addPass,
  useCamera,
  useGui,
  useRenderSize,
  useScene,
  useTick
} from './render/init.js'
// import postprocessing passes
import { SavePass } from 'three/examples/jsm/postprocessing/SavePass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { BlendShader } from 'three/examples/jsm/shaders/BlendShader.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'

import vertexShader from './shaders/vertex.js' 
import fragmentShader from './shaders/fragment.js' 


import TRACK from './sounds/song.mp3';

class Visualizer {
  constructor(mesh, frequencyUniformName) {
    this.mesh = mesh;
    this.frequencyUniformName = frequencyUniformName;
    this.mesh.material.uniforms[this.frequencyUniformName] = {value: 0};

    this.listener = new THREE.AudioListener();
    this.mesh.add(this.listener);

    this.sound = new THREE.Audio(this.listener);
    this.loader = new THREE.AudioLoader();

    this.analyzer = new THREE.AudioAnalyser(this.sound, 32);
  }

  load(path) {
    this.loader.load(path, (buffer) => {
      this.sound.setBuffer(buffer);
      this.sound.setLoop(true)
      this.sound.setVolume(0.5)
      this.sound.play();
    })
  }

  getFrequency() {
    return this.analyzer.getAverageFrequency();
  }

  update() {
    const freq = this.getFrequency() / 50.0;
    this.mesh.material.uniforms[this.frequencyUniformName].value = freq;
    console.log(freq);
  }
}



const startApp = () => {
  const scene = useScene()
  const camera = useCamera()
  const gui = useGui()
  const { width, height } = useRenderSize()

  const ROTATION_SPEED = 0.02
  const MOTION_BLUR_AMOUNT = 0.725

  const dirLight = new THREE.DirectionalLight('#ffffff', 1)
  const ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
  scene.add(dirLight, ambientLight)














  // meshes
  const geometry = new THREE.IcosahedronGeometry(2 , 200)
  const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  })

  material.uniforms.uTime = { value: 0 };

  const ico = new THREE.Mesh(geometry, material)

  const visualizer = new Visualizer(ico, 'uAudioFrequency');

  // Assuming the 'sounds' folder is in the same directory as your JavaScript file
  visualizer.load(TRACK);
  scene.add(ico)


















  // GUI
  // const cameraFolder = gui.addFolder('Camera')
  // cameraFolder.add(camera.position, 'z', 0, 10)
  // cameraFolder.open()

  // postprocessing
  const renderTargetParameters = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    stencilBuffer: false,
  }

  // save pass
  const savePass = new SavePass(new THREE.WebGLRenderTarget(width, height, renderTargetParameters))

  // blend pass
  const blendPass = new ShaderPass(BlendShader, 'tDiffuse1')
  blendPass.uniforms['tDiffuse2'].value = savePass.renderTarget.texture
  blendPass.uniforms['mixRatio'].value = MOTION_BLUR_AMOUNT

  // output pass
  const outputPass = new ShaderPass(CopyShader)
  outputPass.renderToScreen = true

  // adding passes to composer
  // addPass(blendPass)
  // addPass(savePass)
  // addPass(outputPass)

  ico.rotation.z+=1.0;

  // adding passes to composer
  addPass(blendPass)
  addPass(savePass)
  addPass(outputPass)

  useTick(({ timestamp, timeDiff }) => {
   
    visualizer.update();

    ico.rotation.z+=0.05;
    ico.rotation.x+=0.05;
    ico.rotation.y+=0.05;

    

    const time = timestamp / 1000;
    material.uniforms.uTime.value = time;
  })
}

export default startApp;
