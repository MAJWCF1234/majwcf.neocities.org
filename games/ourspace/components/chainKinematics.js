AFRAME.registerComponent('chain-kinematics', {
    schema: {
        segments: { type: 'number', default: 3 },
        segmentLength: { type: 'number', default: 0.5 },
        stiffness: { type: 'number', default: 0.8 },
        damping: { type: 'number', default: 0.3 },
        gravity: { type: 'number', default: -9.81 }
    },

    init: function() {
        this.joints = [];
        this.velocities = [];
        this.initializeChain();
        
        // Bind the tick function
        this.tick = AFRAME.utils.throttleTick(this.tick, 16, this);
    },

    initializeChain: function() {
        let prevJoint = { x: 0, y: 0, z: 0 };
        
        for (let i = 0; i < this.data.segments; i++) {
            this.joints.push({
                x: prevJoint.x,
                y: prevJoint.y + this.data.segmentLength,
                z: prevJoint.z
            });
            
            this.velocities.push({ x: 0, y: 0, z: 0 });
            prevJoint = this.joints[i];
        }
    },

    tick: function(time, deltaTime) {
        deltaTime = Math.min(deltaTime, 32) / 1000; // Convert to seconds and cap at 32ms
        
        this.updatePhysics(deltaTime);
        this.constrainChain();
        this.updateVisuals();
    },

    updatePhysics: function(deltaTime) {
        for (let i = 0; i < this.joints.length; i++) {
            // Apply gravity
            this.velocities[i].y += this.data.gravity * deltaTime;
            
            // Apply damping
            this.velocities[i].x *= (1 - this.data.damping);
            this.velocities[i].y *= (1 - this.data.damping);
            this.velocities[i].z *= (1 - this.data.damping);
            
            // Update positions
            this.joints[i].x += this.velocities[i].x * deltaTime;
            this.joints[i].y += this.velocities[i].y * deltaTime;
            this.joints[i].z += this.velocities[i].z * deltaTime;
        }
    },

    constrainChain: function() {
        let prevJoint = { x: 0, y: 0, z: 0 };
        
        for (let i = 0; i < this.joints.length; i++) {
            const joint = this.joints[i];
            const dx = joint.x - prevJoint.x;
            const dy = joint.y - prevJoint.y;
            const dz = joint.z - prevJoint.z;
            
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const difference = this.data.segmentLength - distance;
            const percent = (difference / distance) * this.data.stiffness;
            
            joint.x += dx * percent;
            joint.y += dy * percent;
            joint.z += dz * percent;
            
            prevJoint = joint;
        }
    },

    updateVisuals: function() {
        const segments = this.el.children;
        let prevJoint = { x: 0, y: 0, z: 0 };
        
        for (let i = 0; i < this.joints.length; i++) {
            const joint = this.joints[i];
            const segment = segments[i];
            
            if (segment) {
                // Calculate rotation
                const dx = joint.x - prevJoint.x;
                const dy = joint.y - prevJoint.y;
                const dz = joint.z - prevJoint.z;
                
                const rotationX = Math.atan2(dz, dy) * 180 / Math.PI;
                const rotationZ = -Math.atan2(dx, dy) * 180 / Math.PI;
                
                segment.setAttribute('position', {
                    x: (joint.x + prevJoint.x) / 2,
                    y: (joint.y + prevJoint.y) / 2,
                    z: (joint.z + prevJoint.z) / 2
                });
                
                segment.setAttribute('rotation', {
                    x: rotationX,
                    y: 0,
                    z: rotationZ
                });
            }
            
            prevJoint = joint;
        }
    }
});