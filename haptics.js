import * as THREE from 'three';

const connectedControllers = [];
let controllers;
let group;
const box = new THREE.Box3();
const oscillators = [];
let audioCtx = null;

export class HapticsSample {
    init(scene, curControllers) {
        controllers = curControllers;
        group = initBars(scene);

        [controllers.left, controllers.right].forEach(controller => {
            controller.grip.addEventListener('connected', controllerConnected);
            controller.grip.addEventListener('disconnected', controllerDisconnected);
        });

        return {
            render: handleCollisions,
            enterVR: initAudio,
        }
    }
}

function initBars(scene) {
    const group = new THREE.Group();
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

    return group;
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
