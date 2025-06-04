AFRAME.registerComponent('fractal-tree', {
    schema: {
        depth: { type: 'number', default: 5 },
        branchLength: { type: 'number', default: 1 },
        branchThickness: { type: 'number', default: 0.2 },
        angle: { type: 'number', default: 25 }
    },

    init: function() {
        this.createTree(
            this.el,
            this.data.depth,
            this.data.branchLength,
            this.data.branchThickness,
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 }
        );
    },

    createTree: function(parent, depth, length, thickness, position, rotation) {
        if (depth === 0) {
            this.createLeaves(parent, position);
            return;
        }

        // Create branch container with kinematics
        const branchContainer = document.createElement('a-entity');
        branchContainer.setAttribute('position', `${position.x} ${position.y} ${position.z}`);
        branchContainer.setAttribute('rotation', `${rotation.x} ${rotation.y} ${rotation.z}`);
        branchContainer.setAttribute('chain-kinematics', {
            segments: 3,
            segmentLength: length / 3,
            stiffness: 0.8 - (depth * 0.1),
            damping: 0.3 + (depth * 0.05),
            gravity: -2 - (depth * 0.5)
        });

        // Create branch segments
        for (let i = 0; i < 3; i++) {
            const segment = document.createElement('a-cylinder');
            segment.setAttribute('height', length / 3);
            segment.setAttribute('radius', thickness);
            segment.setAttribute('color', '#8B4513');
            segment.setAttribute('material', 'roughness: 0.9');
            segment.setAttribute('shadow', 'cast: true');
            branchContainer.appendChild(segment);
        }

        parent.appendChild(branchContainer);

        const newLength = length * 0.7;
        const newThickness = thickness * 0.7;
        const angleRad = this.data.angle * Math.PI / 180;

        // Create branches recursively
        [-1, 1].forEach(direction => {
            const newRotation = {
                x: rotation.x + Math.cos(angleRad) * this.data.angle * direction,
                y: rotation.y + Math.sin(angleRad) * this.data.angle * direction,
                z: rotation.z + this.data.angle * direction
            };

            const newPosition = {
                x: position.x + Math.sin(angleRad) * length * direction * 0.5,
                y: position.y + length,
                z: position.z + Math.cos(angleRad) * length * direction * 0.5
            };

            this.createTree(
                parent,
                depth - 1,
                newLength,
                newThickness,
                newPosition,
                newRotation
            );
        });
    },

    createLeaves: function(parent, position) {
        const leaves = document.createElement('a-sphere');
        leaves.setAttribute('position', `${position.x} ${position.y + 0.5} ${position.z}`);
        leaves.setAttribute('radius', '0.4');
        leaves.setAttribute('color', '#228B22');
        leaves.setAttribute('material', 'roughness: 0.8');
        leaves.setAttribute('shadow', 'cast: true');
        
        // Add subtle movement to leaves
        leaves.setAttribute('animation', {
            property: 'position',
            dir: 'alternate',
            dur: 2000 + Math.random() * 1000,
            easing: 'easeInOutSine',
            loop: true,
            to: `${position.x} ${position.y + 0.6} ${position.z}`
        });
        
        parent.appendChild(leaves);
    }
});