import GridEnvironment from '../environments/GridEnvironment';

export default class ASCIIRenderer {
    
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
            if (!agent || !agent.get('value')) this.pre.innerHTML += ' ';
            if (agent && agent.get('value')) this.pre.innerHTML += agent.get('value');
            if (x === this.environment.width - 1) this.pre.innerHTML += '\n';
        });
    }
}