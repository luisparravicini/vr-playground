import * as ThreeMeshUI from "three-mesh-ui";
import * as THREE from 'three';
import { ButtonsIndices } from './controllers.js';

let container;
let text;

export function setup(scene, controllers) {
    setupDebugUI(controllers.left.controller);
    setupHelpUI(scene);
}

function setupHelpUI(scene) {
    const container = new ThreeMeshUI.Block({
        width: 0.5,
        height: 0.3,
        padding: 0.05,
        borderRadius: 0.05,
        fontFamily: './assets/Roboto-msdf.json',
        fontTexture: './assets/Roboto-msdf.png',
    });
    container.position.set(-1, 1, -1.8);
    container.rotation.y = 0.35;
    scene.add(container);

    container.add(new ThreeMeshUI.Text({
        content: "Toggle the left controller menu with Y",
        fontSize: 0.055,
    }));
}

function setupDebugUI(controller) {
    container = new ThreeMeshUI.Block({
        width: 0.4,
        height: 0.4,
        padding: 0.1,
        borderRadius: 0.05,
        fontFamily: './assets/Roboto-msdf.json',
        fontTexture: './assets/Roboto-msdf.png',
    });
    text = new ThreeMeshUI.Text({
        content: "controller buttons",
        fontSize: 0.01,
    });
    container.position.set(0.35, 0.15, 0);
    container.rotation.x = THREE.MathUtils.degToRad(-25);
    container.add(text);

    controller.attach(container);
}

function updateButtonsInfo(controller, text) {
    if (controller.gamepad == null)
        return;

    const boolToStr = value => value ? "1" : "0";
    const oneDecimalTrunc = x => Math.trunc(x * 10) / 10;

    const buttonsValues = [];
    controller.gamepad.buttons.forEach((btn, index) => {
        buttonsValues.push(`${index}: ` +
            `pressed:${boolToStr(btn.pressed)} ` +
            `touched:${boolToStr(btn.touched)} ` +
            `value:${oneDecimalTrunc(btn.value)}`
        );
    })

    text.set({ content: "left\n" + buttonsValues.join("\n") });
}

export function update(controllers) {
    if (controllers.left.isButtonPressed(ButtonsIndices.y)) {
        container.visible = !container.visible;
    }

    updateButtonsInfo(controllers.left, text);

    ThreeMeshUI.update();
}
