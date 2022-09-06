// From https://github.com/SamsungInternet/xr-locomotion-starter/
import {
    Mesh,
    MeshBasicMaterial,
    Vector3,
    PointLight,
    PlaneGeometry,
    TextureLoader,
    BufferGeometry,
    BufferAttribute,
    LineBasicMaterial,
    AdditiveBlending,
    Line
} from 'three';

import {
    locomotion, setupFade
} from './fade.js';

// Utility Vectors
const g = new Vector3(0, -9.8, 0);
const tempVec = new Vector3();
const tempVec1 = new Vector3();
const tempVecP = new Vector3();
const tempVecV = new Vector3();

// Guideline parabola function
function positionAtT(inVec, t, p, v, g) {
    inVec.copy(p);
    inVec.addScaledVector(v, t);
    inVec.addScaledVector(g, 0.5 * t ** 2);
    return inVec;
}

// The guideline
const lineSegments = 10;
const lineGeometry = new BufferGeometry();
const lineGeometryVertices = new Float32Array((lineSegments + 1) * 3);
lineGeometryVertices.fill(0);
const lineGeometryColors = new Float32Array((lineSegments + 1) * 3);
lineGeometryColors.fill(0.5);
lineGeometry.setAttribute('position', new BufferAttribute(lineGeometryVertices, 3));
lineGeometry.setAttribute('color', new BufferAttribute(lineGeometryColors, 3));
const lineMaterial = new LineBasicMaterial({ vertexColors: true, blending: AdditiveBlending });
const guideline = new Line(lineGeometry, lineMaterial);

// The light at the end of the line
const guideLight = new PointLight(0xffeeaa, 0, 2);

// The target on the ground
const guideSpriteTexture = new TextureLoader().load('./assets/target.png');
const guideSprite = new Mesh(
    new PlaneGeometry(0.3, 0.3, 1, 1),
    new MeshBasicMaterial({
        map: guideSpriteTexture,
        blending: AdditiveBlending,
        color: 0x555555,
        transparent: true
    })
);
guideSprite.rotation.x = -Math.PI / 2;

export class Teleport {
    init(scene, controllers) {
        this.scene = scene;
        this.guidingController = null;

        controllers.left.events.addEventListener('axes-y-moveMiddle', (event) => { this.handleUp(event); });
        controllers.left.events.addEventListener('axes-y-moveEnd', (event) => { this.handleUpEnd(event); });

        controllers.right.events.addEventListener('axes-x-moveMiddle', (event) => { this.handleRotation(event) });

        setupFade(scene);

        return {
            render: () => { this.render(); },
        }
    }

    handleUp({ detail }) {
        this.scene.logger.info("pre startGuide", detail);

        if (detail.value > 0) {
            this.scene.logger.info("startGuide", detail);
            this.guidingController = detail.controller;

            guideLight.intensity = 1;
            this.guidingController.add(guideline);
            this.scene.scene.add(guideSprite);
        }
    }

    handleUpEnd({ detail }) {
        this.scene.logger.info("onSelectEnd", detail.controller);

        // first work out vector from feet to cursor

        // feet position
        const feetPos = this.scene.renderer.xr.getCamera(this.scene.camera).getWorldPosition(tempVec);
        feetPos.y = 0;

        // cursor position
        const p = this.guidingController.getWorldPosition(tempVecP);
        const v = this.guidingController.getWorldDirection(tempVecV);
        v.multiplyScalar(6);
        const t = (-v.y + Math.sqrt(v.y ** 2 - 2 * p.y * g.y)) / g.y;
        const cursorPos = positionAtT(tempVec1, t, p, v, g);

        // Offset
        const offset = cursorPos.addScaledVector(feetPos, -1);

        // Do the locomotion
        locomotion(offset, this.scene.camera);

        // clean up
        guideLight.intensity = 0;
        this.guidingController.remove(guideline);
        this.guidingController = null;
        this.scene.scene.remove(guideSprite);
    }

    handleRotation({ detail }) {
        let delta = (detail.value > 0 ? -1 : 1);
        let offset = delta * Math.PI / 4;

        const logger = this.scene.logger;
        const xr = this.scene.renderer.xr;
        logger.info(xr.isPresenting);

        if (xr.isPresenting) {
            xr.getCamera().cameras.forEach(cam => {
                logger.info(cam.rotation.y);
                cam.rotation.y += offset;
            });
        } else {
            this.scene.cameraGroup.rotation.y += offset;
        }
    }


    render() {
        if (this.guidingController == null)
            return;

        // Controller start position
        const p = this.guidingController.getWorldPosition(tempVecP);

        // Set Vector V to the direction of the controller, at 1m/s
        const v = this.guidingController.getWorldDirection(tempVecV);

        // Scale the initial velocity to 6m/s
        v.multiplyScalar(6);

        // Time for tele ball to hit ground
        const t = (-v.y + Math.sqrt(v.y ** 2 - 2 * p.y * g.y)) / g.y;

        const vertex = tempVec.set(0, 0, 0);
        for (let i = 1; i <= lineSegments; i++) {

            // set vertex to current position of the virtual ball at time t
            positionAtT(vertex, i * t / lineSegments, p, v, g);
            this.guidingController.worldToLocal(vertex);
            vertex.toArray(lineGeometryVertices, i * 3);
        }
        guideline.geometry.attributes.position.needsUpdate = true;

        // Place the light and sprite near the end of the line
        positionAtT(guideLight.position, t * 0.98, p, v, g);
        positionAtT(guideSprite.position, t * 0.98, p, v, g);
    }

}
