import * as ThreeMeshUI from "three-mesh-ui";
import * as THREE from 'three';
import { ButtonsIndices } from './controllers.js';
import VRControl from './VRControl.js';

export function setup(scene, controllers) {
    setupDebugUI(scene, controllers.left);
    setupHelpUI(scene.scene);

    // for buttons
    vrControl = VRControl(scene.renderer, scene.camera, scene.scene);
    scene.scene.add(vrControl.controllerGrips[0], vrControl.controllers[0]);
    vrControl.controllers[0].addEventListener('selectstart', () => {
        selectState = true;
    });
    vrControl.controllers[0].addEventListener('selectend', () => {
        selectState = false;
    });

    const controller = controllers.left;
    controller.events.addEventListener('button-y-up', () => {
        controller.data.menu.container.visible = !controller.data.menu.container.visible;
    });
}

function setupHelpUI(scene) {
    const container = buildTextContainer();
    container.set({
        width: 0.5,
        height: 0.3,
    });
    container.position.set(-1, 1, -1.8);
    container.rotation.y = 0.35;
    scene.add(container);

    container.add(new ThreeMeshUI.Text({
        content: "Toggle the left controller menu with Y",
        fontSize: 0.055,
    }));
}

function setupDebugUI(scene, controller) {
    const container = buildTextContainer();
    container.set({
        width: 0.4,
        height: 0.4,
        padding: 0.1,
    });
    const text = new ThreeMeshUI.Text({
        content: "controller buttons",
        fontSize: 0.01,
    });
    container.position.set(0.35, 0.15, 0);
    container.rotation.x = THREE.MathUtils.degToRad(-25);
    container.add(text);

    const buttonsContainer = setupMenuButtons();
    container.add(buttonsContainer);

    controller.data.menu = {
        container: container,
        text: text,
    }
    controller.controller.attach(container);

    // for testing purposes
    // container.position.set(0, 1, -1);
    // scene.scene.add(container);
}

function setupMenuButtons() {
    const buttonOptions = {
        width: 0.2,
        height: 0.05,
        justifyContent: 'center',
        offset: 0.03,
        margin: 0.01,
        borderRadius: 0.025
    };

    const hoveredStateAttributes = {
        state: 'hovered',
        attributes: {
            offset: 0.035,
            backgroundColor: new THREE.Color(0x999999),
            backgroundOpacity: 1,
            fontColor: new THREE.Color(0xffffff)
        },
    };

    const idleStateAttributes = {
        state: 'idle',
        attributes: {
            offset: 0.035,
            backgroundColor: new THREE.Color(0x666666),
            backgroundOpacity: 0.3,
            fontColor: new THREE.Color(0xffffff)
        },
    };

    const buttonNext = new ThreeMeshUI.Block(buttonOptions);
    const buttonPrevious = new ThreeMeshUI.Block(buttonOptions);
    buttonNext.add(
        new ThreeMeshUI.Text({ content: 'next' })
    );
    buttonPrevious.add(
        new ThreeMeshUI.Text({ content: 'previous' })
    );

    const selectedAttributes = {
        offset: 0.02,
        backgroundColor: new THREE.Color(0x777777),
        fontColor: new THREE.Color(0x222222)
    };

    buttonNext.setupState({
        state: 'selected',
        attributes: selectedAttributes,
        onSet: () => {
            // do something
        }
    });
    buttonNext.setupState(hoveredStateAttributes);
    buttonNext.setupState(idleStateAttributes);

    buttonPrevious.setupState({
        state: 'selected',
        attributes: selectedAttributes,
        onSet: () => {
            // do something
        }
    });
    buttonPrevious.setupState(hoveredStateAttributes);
    buttonPrevious.setupState(idleStateAttributes);


    // Container block, in which we put the two buttons.
    // We don't define width and height, it will be set automatically from the children's dimensions
    // Note that we set contentDirection: "row-reverse", in order to orient the buttons horizontally

    const container = new ThreeMeshUI.Block({
        justifyContent: 'center',
        contentDirection: 'row-reverse',
        fontFamily: './assets/Roboto-msdf.json',
        fontTexture: './assets/Roboto-msdf.png',
        fontSize: 0.02,
        padding: 0.01,
        borderRadius: 0.05
    });

    container.position.set(0, 0, 0);

    container.add(buttonNext, buttonPrevious);
    objsToTest.push(buttonNext, buttonPrevious);

    return container;
}

function buildTextContainer() {
    return new ThreeMeshUI.Block({
        width: 1,
        height: 0.5,
        padding: 0.05,
        borderRadius: 0.05,
        fontFamily: './assets/Roboto-msdf.json',
        fontTexture: './assets/Roboto-msdf.png',
    });
}

function updateButtonsInfo(controller) {
    if (controller.gamepad == null)
        return;

    const boolToStr = value => value ? "1" : "0";
    const oneDecimalTrunc = x => Math.trunc(x * 10) / 10;

    const info = [];
    controller.gamepad.buttons.forEach((btn, index) => {
        info.push(`btn ${index}: ` +
            `pressed:${boolToStr(btn.pressed)} ` +
            `touched:${boolToStr(btn.touched)} ` +
            `value:${oneDecimalTrunc(btn.value)}`
        );
    })
    controller.gamepad.axes.forEach((value, index) => {
        info.push(`axis ${index}: ${oneDecimalTrunc(value)}`);
    })

    controller.data.menu.text.set({ content: "left\n" + info.join("\n") });
}

export function update(scene, controllers) {
    ThreeMeshUI.update();

    updateButtonsInfo(controllers.left);
    updateButtons(scene);
}

/// buttons
const objsToTest = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
mouse.x = mouse.y = null;
let vrControl;

let selectState = false;

window.addEventListener('pointermove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('pointerdown', () => {
    selectState = true;
});

window.addEventListener('pointerup', () => {
    selectState = false;
});

window.addEventListener('touchstart', (event) => {
    selectState = true;
    mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('touchend', () => {
    selectState = false;
    mouse.x = null;
    mouse.y = null;
});

function updateButtons(scene) {
    let intersect;

    if (scene.renderer.xr.isPresenting) {
        vrControl.setFromController(0, raycaster.ray);
        intersect = raycast();

        // Position the little white dot at the end of the controller pointing ray
        if (intersect)
            vrControl.setPointerAt(0, intersect.point);
    } else if (mouse.x !== null && mouse.y !== null) {
        raycaster.setFromCamera(mouse, scene.camera);
        intersect = raycast();
    }

    // Update targeted button state (if any)
    if (intersect && intersect.object.isUI) {
        if (selectState) {
            // Component.setState internally call component.set with the options you defined in component.setupState
            intersect.object.setState('selected');
        } else {
            // Component.setState internally call component.set with the options you defined in component.setupState
            intersect.object.setState('hovered');
        }
    }

    // Update non-targeted buttons state
    objsToTest.forEach((obj) => {
        if ((!intersect || obj !== intersect.object) && obj.isUI) {
            // Component.setState internally call component.set with the options you defined in component.setupState
            obj.setState('idle');
        }
    });
}

function raycast() {
    return objsToTest.reduce((closestIntersection, obj) => {
        const intersection = raycaster.intersectObject(obj, true);
        if (!intersection[0]) return closestIntersection;

        if (!closestIntersection || intersection[0].distance < closestIntersection.distance) {
            intersection[0].object = obj;
            return intersection[0];
        }

        return closestIntersection;
    }, null);
}