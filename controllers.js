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
    x: 2,
    y: 3,
};

class Controller {
    constructor(scene, controller, grip, name, controllerIndex) {
        this.scene = scene;
        this.controller = controller;
        this.grip = grip;
        this.index = controllerIndex;
        this.name = name;
        this.gamepad = null;
        this.data = {
            buttons: {},
            axes: {},
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
        this.data.buttons = {};
        this.data.axes = {};
    }

    updateButtonsPressed() {
        const gamepad = this.gamepad;
        if (gamepad == null)
            return;

        gamepad.buttons.forEach((button, index) => {
            const nowPressed = button.pressed;
            const buttonsPressed = this.data.buttons;

            if (buttonsPressed[index] === undefined) {
                buttonsPressed[index] = nowPressed;
                return;
            }

            const buttonPressed = buttonsPressed[index];
            if (!buttonPressed && nowPressed) {
                this.dispatchButtonEvent(index, 'button-$name-down', null);
            }
            if (buttonPressed && !nowPressed) {
                this.dispatchButtonEvent(index, 'button-$name-up', null);
            }

            buttonsPressed[index] = nowPressed;
        });

        const axes = this.data.axes;
        gamepad.axes.forEach((value, index) => {
            if (axes[index] === undefined) {
                axes[index] = value;
                return;
            }

            if (value == axes[index]) {
                return;
            }

            this.dispatchAxisEvent(index, "axes-$name-move", { value: value });

            if (axes[index] === 0) {
                this.dispatchAxisEvent(index, "axes-$name-moveStart", { value: value });
            }
            if (Math.abs(axes[index]) < 0.5 && Math.abs(value) > 0.5) {
                this.dispatchAxisEvent(index, "axes-$name-moveMiddle", { value: value });
            }
            if (value === 0) {
                this.dispatchAxisEvent(index, "axes-$name-moveEnd", { value: value });
            }

            axes[index] = value;
        });
    }

    dispatchAxisEvent(index, eventNameTemplate, detail) {
        this.dispatchEvent('axis', AxesIndices, index, eventNameTemplate, detail);
    }

    dispatchButtonEvent(index, eventNameTemplate, detail) {
        this.dispatchEvent('button', ButtonsIndices, index, eventNameTemplate, detail);
    }

    dispatchEvent(eventType, objects, index, eventNameTemplate, detail) {
        let name = Object.keys(objects).find(name => objects[name] == index);
        if (!name) {
            // This shouldn't happen
            console.log(`${eventType} ${index} not found`);
            return;
        }
        const eventName = eventNameTemplate.replace('$name', name);
        const event = new CustomEvent(eventName, { detail: detail });

        console.log(`${this.name}:${event.type} fired`, detail);
        this.scene.logger.info(`${this.name}:${event.type} fired`, detail);

        this.events.dispatchEvent(event);
    }

}

export class ControllersManager {
    setup(scene) {
        const controllerModelFactory = new XRControllerModelFactory();

        const setupController = function (controllerIndex, name) {
            const controller = scene.renderer.xr.getController(controllerIndex);
            scene.scene.add(controller);

            const grip = scene.renderer.xr.getControllerGrip(controllerIndex);
            grip.add(controllerModelFactory.createControllerModel(grip));
            scene.scene.add(grip);

            const controllerObj = new Controller(scene, controller, grip, name, controllerIndex);
            grip.addEventListener('connected', (event) => { controllerObj.controllerConnected(event) });
            grip.addEventListener('disconnected', (event) => { controllerObj.controllerDisconnected(event) });

            return controllerObj;
        }

        this.controllers = {
            right: setupController(0, 'right'),
            left: setupController(1, 'left'),
        }
    }

    update() {
        this.controllers.left.updateButtonsPressed();
        this.controllers.right.updateButtonsPressed();
    }

}
