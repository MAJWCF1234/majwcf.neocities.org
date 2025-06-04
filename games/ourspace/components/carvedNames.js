AFRAME.registerComponent('carved-names', {
    init: function() {
        const textEntity = document.createElement('a-text');
        textEntity.setAttribute('value', 'Em + Mia + Dustin + Maddie');
        textEntity.setAttribute('color', '#FFE4B5');
        textEntity.setAttribute('scale', '0.3 0.3 0.3');
        textEntity.setAttribute('position', '0 0 0.1');
        textEntity.setAttribute('class', 'clickable');

        const background = document.createElement('a-plane');
        background.setAttribute('width', '1.5');
        background.setAttribute('height', '0.4');
        background.setAttribute('color', '#8B4513');
        background.setAttribute('material', 'roughness: 1.0');

        this.el.appendChild(background);
        this.el.appendChild(textEntity);
    }
});