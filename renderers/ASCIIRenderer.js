import { GridEnvironment } from '../environments/GridEnvironment';

class ASCIIRenderer {
    
    constructor(environment, opts = {}) {
        
        /** @member GridEnvironment */
        this.environment = environment;
        environment.renderer = this;

        /** @member HTMLPreElement */
        this.pre = document.createElement('pre');
    }

    mount(el) {
        const container = (typeof el === 'string') ? document.querySelector(el) : el;
        container.appendChild(this.pre);
    }

    render() {
        this.pre.innerHTML = '';
        this.environment.loop((x, y, agent) => {
            let value = ' ';
            const cell = this.environment.getCell(x, y);
            if (agent && agent.get('value')) {
                value = agent.get('value');
            } else if (cell.get('value')) {
                value = cell.get('value');
            }
            this.pre.innerHTML += value;
            if (x === this.environment.width - 1) this.pre.innerHTML += '\n';
        });
    }
};

export { ASCIIRenderer };