import { Environment } from '../environments/Environment';

class CanvasRenderer {
    
    constructor(environment, opts = {}) {
        
        /** @member Environment */
        this.environment = environment;
        environment.renderer = this;

        this.opts = opts;

        /** @member HTMLCanvasElement */
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        
        this.width = opts.width || 500;
        this.height = opts.height || 500;

        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    mount(el) {
        const container = (typeof el === 'string') ? document.querySelector(el) : el;
        container.appendChild(this.canvas);
    }

    render() {
        const { context, environment, width, height } = this;
        
        // if "trace" is truthy, don't clear the canvas with every frame
        // to trace the paths of agents
        if (!this.opts.trace) context.clearRect(0, 0, width, height);
        
        environment.getAgents().forEach(agent => {
            const x = agent.get('x') || 0;
            const y = agent.get('y') || 0;
            context.beginPath();
            context.moveTo(x, y);
            context.fillStyle = agent.get('color') || 'black';
            context.arc(
                x, 
                y, 
                agent.get('radius') || 1, 
                0, 
                2 * Math.PI
            );
            context.fill();
        });
    }
};

export { CanvasRenderer };