import * as THREE from 'three';

let raycaster;
const intersected = [];
const tempMatrix = new THREE.Matrix4();
let controllers;
let group;
let line;
const MaxLineScale = 5;

export class ObjectDragger {
    init(scene, controllers) {
        group = initDragObjects(scene);
        raycaster = new THREE.Raycaster();

        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, - 1)]);
        line = new THREE.Line(geometry);
        line.name = 'line';
        line.scale.z = MaxLineScale;

        [controllers.left, controllers.right].forEach(controller => {
            controller.controller.addEventListener('selectstart', onSelectStart);
            controller.controller.addEventListener('selectend', onSelectEnd);
            controller.controller.add(line.clone());
        });

        return {
            render: render,
        }
    }
}

function initDragObjects(scene) {
    let group = new THREE.Group();
    scene.add(group);

    const geometries = [
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.ConeGeometry(0.2, 0.2, 64),
        new THREE.CylinderGeometry(0.2, 0.2, 0.2, 64),
        new THREE.IcosahedronGeometry(0.2, 8),
        new THREE.TorusGeometry(0.2, 0.04, 64, 32)
    ];

    for (let i = 0; i < 25; i++) {
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const material = new THREE.MeshStandardMaterial({
            color: Math.random() * 0xffffff,
            roughness: 0.7,
            metalness: 0.0
        });

        const object = new THREE.Mesh(geometry, material);

        object.position.x = Math.random() * 2 - 1;
        object.position.y = Math.random() * 2;
        object.position.z = Math.random() * 2;

        object.rotation.x = Math.random() * 2 * Math.PI;
        object.rotation.y = Math.random() * 2 * Math.PI;
        object.rotation.z = Math.random() * 2 * Math.PI;

        object.scale.setScalar(Math.random() + 0.5);

        object.castShadow = true;
        object.receiveShadow = true;

        group.add(object);
    }

    return group;
}

function onSelectStart(event) {
    const controller = event.target;
    const intersections = getIntersections(controller);

    if (intersections.length > 0) {
        const intersection = intersections[0];

        const object = intersection.object;
        object.material.emissive.b = 1;
        controller.attach(object);

        controller.userData.selected = object;
    }
}

function onSelectEnd(event) {
    const controller = event.target;

    if (controller.userData.selected !== undefined) {
        const object = controller.userData.selected;
        object.material.emissive.b = 0;
        group.attach(object);

        controller.userData.selected = undefined;
    }
}

function getIntersections(controller) {
    tempMatrix.identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, - 1).applyMatrix4(tempMatrix);

    return raycaster.intersectObjects(group.children, false);
}

function intersectObjects(controller) {
    // Do not highlight when already selected
    if (controller.userData.selected !== undefined) return;

    const intersections = getIntersections(controller);
    let lineScale = MaxLineScale;
    if (intersections.length > 0) {
        const intersection = intersections[0];

        const object = intersection.object;
        object.material.emissive.r = 1;
        intersected.push(object);

        lineScale = intersection.distance;
    }

    const line = controller.getObjectByName('line');
    line.scale.z = lineScale;
}

function cleanIntersected() {
    while (intersected.length > 0) {
        const object = intersected.pop();
        object.material.emissive.r = 0;
    }
}


export function render(controllers) {
    cleanIntersected();

    intersectObjects(controllers.left.controller);
    intersectObjects(controllers.right.controller);
}
