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

export const AxesIndices = {
    leftX: 2,
    leftY: 3,
    rightX: 0,
    rightY: 1,
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
        this.events = new EventTarget();
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
                };
            } else {
                if (!curButtonData.lastValue && nowPressed) {
                    this.dispatchEvent(index, 'button-$name-down', null);
                }
                if (curButtonData.lastValue && !nowPressed) {
                    this.dispatchEvent(index, 'button-$name-up', null);
                }

                curButtonData.lastValue = nowPressed;
            }
        });
    }

    dispatchEvent(buttonIndex, eventNameTemplate, detail) {
        let button = Object.keys(ButtonsIndices).find(name => ButtonsIndices[name] == buttonIndex);
        if (!button) {
            // This shouldn't happen
            console.log(`button ${buttonIndex} not found`);
            return;
        }
        const eventName = eventNameTemplate.replace('$name', button);
        const event = new CustomEvent(eventName, { detail: detail });
        console.log(event.type + ' fired');
        this.events.dispatchEvent(event);

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
