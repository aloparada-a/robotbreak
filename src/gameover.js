class EscenaGameOver extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaGameOver' });
    }

    create() {
        ['gameoverscreen', 'catchlaugh'].forEach(clave => {
            if (this.textures.exists(clave)) {
                this.textures.get(clave).setFilter(Phaser.Textures.NEAREST);
            }
        });

        let fondo = this.add.image(750, 410, 'gameoverscreen');
        fondo.setDisplaySize(1500, 820);

        if (!this.anims.exists('catch_risa')) {
            this.anims.create({
                key: 'catch_risa',
                frames: this.anims.generateFrameNumbers('catchlaugh', { start: 0, end: 1 }),
                frameRate: 4,
                repeat: -1
            });
        }

        let spriteGameOver = this.add.sprite(750, 180, 'catchlaugh');
        spriteGameOver.setScale(4);
        spriteGameOver.play('catch_risa');

        const estiloTexto = { 
            fontSize: '24px', 
            color: '#ffffff', 
            fontFamily: 'Departure Mono' 
        };

        let btnInicio = this.add.text(750, 560, '[ VOLVER AL INICIO ]', estiloTexto)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        btnInicio.on('pointerover', () => btnInicio.setColor('#2bff00'));
        btnInicio.on('pointerout', () => btnInicio.setColor('#ffffff'));

        btnInicio.on('pointerdown', () => {
            this.registry.set('vidas', 3); 
            this.registry.set('minijuegosHechos', []);
            this.registry.set('cablesResueltos', false);

            this.scene.stop();
            if (typeof volverAlInicio === 'function') {
                volverAlInicio();
            }
        });
    }
}
