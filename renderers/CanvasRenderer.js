import Environment from '../environments/Environment';

export default class CanvasRenderer {
    
    constructor(environment, opts = {}) {
        
        /** @member Environment */
        this.environment = environment;
        environment.renderer = this;

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
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.beginPath();
        this.environment.getAgents().forEach(agent => {
            const x = agent.get('x') || 0;
            const y = agent.get('y') || 0;
            this.context.moveTo(x, y);
            this.context.arc(
                x, 
                y, 
                agent.get('radius') || 1, 
                0, 
                2 * Math.PI
            );
        });
        this.context.closePath();
        this.context.fill();
    }
}