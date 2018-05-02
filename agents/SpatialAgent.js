import Agent from './Agent';

export default class SpatialAgent extends Agent {
    constructor(x = 0, y = 0, z = 0) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
    }
};