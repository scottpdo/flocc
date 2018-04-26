export default class Environment {
    
    constructor() {
        this.agents = [];
    }

    addAgent(agent) {
        agent.environment = this;
        this.agents.push(agent);
    }

    tick() {
        this.agents.forEach(agent => {
            agent.rules.forEach(rule => rule());
        });
        this.agents.forEach(agent => {
            while (agent.queue.length > 0) {
                agent.queue.shift()();
            }
        });
    }
};