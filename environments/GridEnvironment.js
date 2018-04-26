import Environment from './Environment';
import Agent from '../agents/Agent';

export default class GridEnvironment extends Environment {

    constructor(size) {
        
        super();

        this.size = size;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const agent = new Agent();
                agent.x = x;
                agent.y = y;
                this.agents.push(agent);
            }
        }
    }

    getAgent(x, y) {

        const { size } = this;
        
        while (x < 0) x += size;
        while (x >= size) x -= size;
        while (y < 0) y += size;
        while (y >= size) y -= size;

        return this.agents[x + size * y];
    }

    log() {
        
        let output = '';
        this.agents.forEach(agent => {
            output += agent.get('value') || '-';
            if (agent.x === this.size - 1) output += '\n';
        });

        console.log(output);
    }
}