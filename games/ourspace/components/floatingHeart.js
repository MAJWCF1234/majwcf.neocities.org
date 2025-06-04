AFRAME.registerComponent('floating-heart', {
    init: function() {
        this.createHeart();
        this.setupAnimation();
    },

    createHeart: function() {
        const leftLobe = document.createElement('a-sphere');
        leftLobe.setAttribute('position', '-0.5 0 0');
        leftLobe.setAttribute('radius', '0.4');
        leftLobe.setAttribute('color', '#FF69B4');
        leftLobe.setAttribute('material', 'metalness: 0.5; roughness: 0.8');

        const rightLobe = document.createElement('a-sphere');
        rightLobe.setAttribute('position', '0.5 0 0');
        rightLobe.setAttribute('radius', '0.4');
        rightLobe.setAttribute('color', '#FF69B4');
        rightLobe.setAttribute('material', 'metalness: 0.5; roughness: 0.8');

        const point = document.createElement('a-cone');
        point.setAttribute('position', '0 -0.5 0');
        point.setAttribute('radius-bottom', '0.8');
        point.setAttribute('radius-top', '0');
        point.setAttribute('height', '0.8');
        point.setAttribute('rotation', '0 0 180');
        point.setAttribute('color', '#FF69B4');
        point.setAttribute('material', 'metalness: 0.5; roughness: 0.8');

        this.el.appendChild(leftLobe);
        this.el.appendChild(rightLobe);
        this.el.appendChild(point);
    },

    setupAnimation: function() {
        this.el.setAttribute('animation', {
            property: 'position',
            dir: 'alternate',
            dur: 2000,
            easing: 'easeInOutSine',
            loop: true,
            to: '0 7.5 -5'
        });
    }
});