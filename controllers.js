import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

export const ButtonsIndices = {
    trigger: 0,
    grab: 1,
    stickX: 2,
    stickY: 3,
    x: 4,
    y: 5,
    a: 4,
    b: 5,
};

class Controller {
    constructor(controller, grip, controllerIndex) {
        this.controller = controller;
        this.grip = grip;
        this.index = controllerIndex;
        this.gamepad = null;
        this.data = {
            buttonsPressed: {},
        };
    }

    isButtonPressed(index) {
        return this.data.buttonsPressed[index]?.pressed;
    }

    controllerConnected(event) {
        this.updateControllerData(event.data.gamepad);
    }

    controllerDisconnected(_event) {
        this.updateControllerData(null);
    }

    updateControllerData(gamepadData) {
        this.gamepad = gamepadData;
        this.data.buttonsPressed = {};
    }

    updateButtonsPressed() {
        const gamepad = this.gamepad;
        if (gamepad == null)
            return;

        gamepad.buttons.forEach((button, index) => {
            const nowPressed = button.pressed;
            const curButtonData = this.data.buttonsPressed[index];

            if (!curButtonData) {
                this.data.buttonsPressed[index] = {
                    lastValue: nowPressed,
                    pressed: false,
                };
            } else {
                curButtonData.pressed = (curButtonData.lastValue && !nowPressed);
                curButtonData.lastValue = nowPressed;
            }
        });
    }

}

export class ControllersManager {
    setup(scene) {
        const controllerModelFactory = new XRControllerModelFactory();

        const setupController = function (controllerIndex) {
            const controller = scene.renderer.xr.getController(controllerIndex);
            scene.scene.add(controller);

            const grip = scene.renderer.xr.getControllerGrip(controllerIndex);
            grip.add(controllerModelFactory.createControllerModel(grip));
            scene.scene.add(grip);

            const controllerObj = new Controller(controller, grip, controllerIndex);
            grip.addEventListener('connected', (event) => { controllerObj.controllerConnected(event) });
            grip.addEventListener('disconnected', (event) => { controllerObj.controllerDisconnected(event) });

            return controllerObj;
        }

        this.controllers = {
            right: setupController(0),
            left: setupController(1),
        }
    }

    update() {
        this.controllers.left.updateButtonsPressed();
        this.controllers.right.updateButtonsPressed();
    }

}
