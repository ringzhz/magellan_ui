import React from 'react';

const RAD_PER_DEG = Math.PI / 180;

//Not a react component. POJSO
export class Pose {
    constructor(pos) {
        //super(arguments);
        this.x = pos.x || 0;
        this.y = pos.y || 0;
        this.h = pos.h || 0;
    }

    angleTo(pos) {
        return Pose.angleBetweenPos(this, pos);
    }

    distanceTo(pos) {
        return Pose.distanceBetweenPos(this, pos);
    }
    static distanceBetweenPos(lhs, rhs) {
        let x = rhs.x - lhs.x;
        let y = rhs.y - lhs.y;

        return Math.sqrt(x*x + y*y);
    }

    static angleBetweenPos(lhs, rhs) {
        let x = rhs.x - lhs.x;
        let y = rhs.y - lhs.y;
        let theta = Math.atan(x / y);

        if (y < 0) {
            theta += Math.PI;
        }

        return Pose.radToDegrees(theta);
    }

    static radToDegrees(theta) {
        return theta / RAD_PER_DEG
    }

    static degreesToRad(theta) {
        return theta * RAD_PER_DEG;
    }

    //requests/second
    static get POLLING_RATE() {
        return 20;
    }
    static get PI_ADDR() {
        return PI_ADDR_WIN;
    }
    static get DUMMY_BOT() {
        return true;
    }
}
