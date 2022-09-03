import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { ObjectDragger } from './drag.js';
import { HapticsSample } from './haptics.js';

let stats;
let camera, scene, renderer;
let renderCallbacks = [];
let enterVRCallbacks = [];


const controllers = init();
renderer.setAnimationLoop(render);

setupSample(new ObjectDragger());
setupSample(new HapticsSample());


function setupSample(obj) {
    let initData = obj.init(scene, controllers);
    if (initData.render)
        renderCallbacks.push(initData.render);
    if (initData.enterVR)
        enterVRCallbacks.push(initData.enterVR);
}

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    stats = new Stats();
    container.appendChild(stats.dom);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x808080);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
    camera.position.set(0, 1.6, 3);

    const controls = new OrbitControls(camera, container);
    controls.target.set(0, 1.6, 0);
    controls.update();

    setupScene();

    loadEarth();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);

    return setupXR();
}

function setupXR() {
    renderer.xr.enabled = true;
    document.body.appendChild(VRButton.createButton(renderer));

    document.getElementById('VRButton').addEventListener('click', () => {
        enterVRCallbacks.forEach(callback => callback());
    });

    const controllerModelFactory = new XRControllerModelFactory();

    const setupController = function (controllerIndex) {
        const controller = renderer.xr.getController(controllerIndex);
        scene.add(controller);

        const grip = renderer.xr.getControllerGrip(controllerIndex);
        grip.add(controllerModelFactory.createControllerModel(grip));
        scene.add(grip);

        return {
            controller: controller,
            grip: grip,
            index: controllerIndex,
        }
    }

    return {
        left: setupController(0),
        right: setupController(1),
    }
}

function setupScene() {
    const floorGeometry = new THREE.PlaneGeometry(4, 4);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        roughness: 1.0,
        metalness: 0.0
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = - Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    scene.add(new THREE.HemisphereLight(0x808080, 0x606060));

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 6, 0);
    light.castShadow = true;
    light.shadow.camera.top = 2;
    light.shadow.camera.bottom = - 2;
    light.shadow.camera.right = 2;
    light.shadow.camera.left = - 2;
    light.shadow.mapSize.set(4096, 4096);
    scene.add(light);
}

function loadEarth() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('js/libs/draco/gltf/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.load('models/earth.glb', function (gltf) {
        const model = gltf.scene;
        model.position.set(0, 0, -5);
        model.scale.set(0.01, 0.01, 0.01);
        scene.add(model);

        // TODO: play cloud animations
        // mixer = new THREE.AnimationMixer( model );
        // mixer.clipAction( gltf.animations[ 0 ] ).play();

        // animate();
    }, undefined, function (e) {
        console.error(e);
    });
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}


function render() {
    renderCallbacks.forEach(r => r());

    renderer.render(scene, camera);
    stats.update();
}
