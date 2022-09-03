import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { ObjectDragger } from './drag.js';

let container;
let camera, scene, renderer;
const box = new THREE.Box3();
let stats;

const connectedControllers = [];
const oscillators = [];
let controls, group;
let audioCtx = null;
let renderCallbacks = [];


const controllers = init();
renderer.setAnimationLoop(render);
const objectDragger = new ObjectDragger();
let initData = objectDragger.init(scene, controllers, renderCallbacks);
renderCallbacks.push(initData.render);


function initAudio() {
    if (audioCtx !== null) {
        return;
    }

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function createOscillator() {
        // creates oscillator
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine'; // possible values: sine, triangle, square
        oscillator.start();
        return oscillator;
    }

    oscillators.push(createOscillator());
    oscillators.push(createOscillator());
    window.oscillators = oscillators;
}

function init() {
    container = document.createElement('div');
    document.body.appendChild(container);

    stats = new Stats();
    container.appendChild(stats.dom);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x808080);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
    camera.position.set(0, 1.6, 3);

    controls = new OrbitControls(camera, container);
    controls.target.set(0, 1.6, 0);
    controls.update();

    setupScene();

    initBars();
    loadEarth();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controllers = setupXR();

    document.getElementById('VRButton').addEventListener('click', () => {
        initAudio();
    });

    window.addEventListener('resize', onWindowResize);

    return controllers;
}

function setupXR() {
    renderer.xr.enabled = true;
    document.body.appendChild(VRButton.createButton(renderer));

    const controllerModelFactory = new XRControllerModelFactory();

    const setupController = function (controllerIndex) {
        const controller = renderer.xr.getController(controllerIndex);
        scene.add(controller);

        const grip = renderer.xr.getControllerGrip(controllerIndex);
        grip.addEventListener('connected', controllerConnected);
        grip.addEventListener('disconnected', controllerDisconnected);
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

function initBars() {
    group = new THREE.Group();
    group.position.z = - 0.5;
    scene.add(group);
    const BOXES = 10;

    for (let i = 0; i < BOXES; i++) {
        const intensity = (i + 1) / BOXES;
        const w = 0.1;
        const h = 0.1;
        const minH = 1;
        const geometry = new THREE.BoxGeometry(w, h * i + minH, w);
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(intensity, 0.1, 0.1),
            roughness: 0.7,
            metalness: 0.0
        });

        const object = new THREE.Mesh(geometry, material);
        object.position.x = (i - 5) * (w + 0.05);
        object.castShadow = true;
        object.receiveShadow = true;
        object.userData = {
            index: i + 1,
            intensity: intensity
        };

        group.add(object);
    }
}

function controllerConnected(evt) {
    connectedControllers.push({
        gamepad: evt.data.gamepad,
        grip: evt.target,
        colliding: false,
        playing: false
    });
}

function controllerDisconnected(evt) {
    const index = connectedControllers.findIndex(o => o.controller === evt.target);
    if (index !== - 1) {
        connectedControllers.splice(index, 1);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleCollisions() {
    for (let i = 0; i < group.children.length; i++) {
        group.children[i].collided = false;
    }

    for (let g = 0; g < connectedControllers.length; g++) {
        const controller = connectedControllers[g];
        controller.colliding = false;

        const { grip, gamepad } = controller;
        const sphere = {
            radius: 0.03,
            center: grip.position
        };

        const supportHaptic = 'hapticActuators' in gamepad && gamepad.hapticActuators != null && gamepad.hapticActuators.length > 0;

        // minor pentatonic scale, so whichever notes is striked would be more pleasant
        const musicScale = [0, 3, 5, 7, 10];

        for (let i = 0; i < group.children.length; i++) {
            const child = group.children[i];
            box.setFromObject(child);
            if (box.intersectsSphere(sphere)) {
                child.material.emissive.b = 1;
                const intensity = child.userData.index / group.children.length;
                child.scale.setScalar(1 + Math.random() * 0.1 * intensity);

                if (supportHaptic) {
                    gamepad.hapticActuators[0].pulse(intensity, 100);
                }

                const musicInterval = musicScale[child.userData.index % musicScale.length] + 12 * Math.floor(child.userData.index / musicScale.length);
                oscillators[g].frequency.value = 110 * Math.pow(2, musicInterval / 12);
                controller.colliding = true;
                group.children[i].collided = true;
            }
        }


        if (controller.colliding) {
            if (!controller.playing) {
                controller.playing = true;
                oscillators[g].connect(audioCtx.destination);
            }
        } else {
            if (controller.playing) {
                controller.playing = false;
                oscillators[g].disconnect(audioCtx.destination);
            }
        }
    }

    for (let i = 0; i < group.children.length; i++) {
        const child = group.children[i];
        if (!child.collided) {

            // reset uncollided boxes
            child.material.emissive.b = 0;
            child.scale.setScalar(1);
        }
    }
}

function render() {
    handleCollisions();

    renderCallbacks.forEach(r => r());

    renderer.render(scene, camera);
    stats.update();
}
