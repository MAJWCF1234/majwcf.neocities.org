AFRAME.registerComponent('heart-particles', {
    init: function() {
        this.el.addEventListener('click', () => {
            this.createParticles();
        });
    },

    createParticles: function() {
        const numParticles = 5;
        const scene = document.querySelector('a-scene');
        
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('a-entity');
            const startPos = this.el.getAttribute('position');
            
            // Random position offset
            const xOffset = (Math.random() - 0.5) * 2;
            const yOffset = Math.random() * 2;
            const zOffset = (Math.random() - 0.5) * 2;

            particle.setAttribute('position', {
                x: startPos.x + xOffset,
                y: startPos.y + yOffset,
                z: startPos.z + zOffset
            });

            // Create heart shape
            const heart = document.createElement('a-text');
            heart.setAttribute('value', '♥');
            heart.setAttribute('color', '#FF69B4');
            heart.setAttribute('align', 'center');
            heart.setAttribute('scale', '0.5 0.5 0.5');

            particle.appendChild(heart);
            scene.appendChild(particle);

            // Animate and remove
            particle.setAttribute('animation', {
                property: 'position',
                to: `${startPos.x + xOffset * 2} ${startPos.y + yOffset + 2} ${startPos.z + zOffset * 2}`,
                dur: 1500,
                easing: 'easeOutQuad'
            });

            particle.setAttribute('animation__fade', {
                property: 'opacity',
                from: 1,
                to: 0,
                dur: 1500,
                easing: 'easeOutQuad'
            });

            setTimeout(() => {
                scene.removeChild(particle);
            }, 1500);
        }
    }
});

// Remove loading overlay when scene is ready
document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    scene.addEventListener('loaded', () => {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);
    });
});