class MinijuegoCables extends Phaser.Scene {
    constructor() {
        super({ key: 'MinijuegoCables' });
    }

    create() {
        this.tema = TEMAS.azul;
        const tema = this.tema;

        
        this.colorIndicador = 0xff4d6d;
        this.colorZona = 0x3dffa0;

        this.musicaGanar = this.sound.add('musicaGanar', { 
            volume: 0.5, 
            loop: false 
        });

        this.musicaPerder = this.sound.add('musicaPerder', { 
            volume: 0.5, 
            loop: false 
        });

        this.musicaMinijuego = this.sound.add('musicaMinijuego', {
            volume: 0.5,
            loop: true
        });

        this.musicaMinijuego.play();

        // ----- Marco común (nivel 1 de 3) -----
        dibujarMarco(this, tema, 700, 520, 'CALIBRACIÓN DE SENSORES', 1);

        this.sensores = [];
        this.sensorActual = 0;
        this.completado = false;
        this.procesandoError = false; 
        this.juegoIniciado = false;

        for (let i = 0; i < 3; i++) {
            let y = 290 + (i * 80);

            // Nombre del sensor
            this.add.text(440, y, `S0${i + 1}`, {
                fontFamily: FUENTE_JUEGO,
                fontSize: '22px',
                color: colorCSS(tema.suave)
            }).setOrigin(0, 0.5);

            // Barra
            this.add.rectangle(750, y, 400, 30, tema.panel).setStrokeStyle(2, tema.principal, 0.9);

            // Marquitas de la regla
            for (let k = 0; k <= 10; k++) {
                this.add.rectangle(550 + k * 40, y + 23, 2, 6, tema.principal, 0.5);
            }

            // Zona verde objetivo (parpadea suavemente)
            let zonaVerdeX = Phaser.Math.Between(620, 880);
            let zonaVerde = this.add.rectangle(zonaVerdeX, y, 60, 26, this.colorZona, 0.6)
                .setStrokeStyle(2, this.colorZona);

            this.tweens.add({
                targets: zonaVerde,
                alpha: 0.6,
                duration: 600,
                yoyo: true,
                repeat: -1
            });

            
            let indicador = this.add.rectangle(560, y, 8, 40, this.colorIndicador);

            
            let estado = this.add.text(975, y, 'ESPERA', {
                fontFamily: FUENTE_JUEGO,
                fontSize: '16px',
                color: colorCSS(tema.aviso)
            }).setOrigin(0, 0.5);

            let velocidad = Phaser.Math.Between(1000, 1600);
            
            let tween = this.tweens.add({
                targets: indicador,
                x: 940,
                duration: velocidad,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                paused: true 
            });

            this.sensores.push({
                indicador: indicador,
                zonaVerde: zonaVerde,
                estado: estado,
                tween: tween,
                calibrado: false
            });
        }

        this.textoEstado = this.add.text(750, 570, '', { 
            fontFamily: FUENTE_JUEGO,
            fontSize: '18px', 
            color: colorCSS(tema.aviso)
        }).setOrigin(0.5);

        this.mostrarExplicacionCatch();
    }

    mostrarExplicacionCatch() {
        const posX = 1200; 
        const posY = 660;

        const sonidoVoz = this.sound.add('blah', { volume: 0.6, loop: false });
        sonidoVoz.play();

        const anchoBocadillo = 360;
        const padding = 30;

        const mensajeTexto = "Inteligente... Siempre es bueno empezar reactivando la energía del lugar.\n\n" +
            "Presiona ESPACIO o HAZ CLIC cuando el indicador rojo esté dentro de la zona verde.\n\n" +
            "Debes empezar por el de arriba, luego el de en medio y al final el de abajo.\n\n" +
            "[PRESIONA ENTER para empezar]";

        let texto = this.add.text(-160, 5, mensajeTexto, {
            fontFamily: 'Departure Mono',
            fontSize: '12px',
            color: '#1613b9',
            align: 'left',
            wordWrap: { width: anchoBocadillo - (padding * 2) }
        }).setOrigin(0.5, 0.5);

        let altoInicial = texto.height + (padding * 2);

        let fondoBocadillo = this.add.nineslice(
            -160, 5, 'bubble', 0, 
            anchoBocadillo, altoInicial, 
            16, 16, 16, 16
        ).setOrigin(0.5, 0.5);

        let guiaSprite = this.add.sprite(100, 0, 'catch').setScale(2.5);
        guiaSprite.play('guia_hablando');

        let contenedorDialogo = this.add.container(posX, posY, [
            fondoBocadillo, 
            texto, 
            guiaSprite
        ]);

        contenedorDialogo.setScrollFactor(0);
        contenedorDialogo.setDepth(3000);

        const cerrarYEmpezar = () => {
            if (!contenedorDialogo || !contenedorDialogo.active) return;

            guiaSprite.stop();
            guiaSprite.setFrame(0);

            if (sonidoVoz && sonidoVoz.isPlaying) {
                sonidoVoz.stop();
            }

            this.tweens.add({
                targets: contenedorDialogo,
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    contenedorDialogo.destroy();
                    this.iniciarMinijuego();
                }
            });
        };

        const teclaEnter = this.input.keyboard.addKey('ENTER');
        const listenerEnter = () => {
            teclaEnter.off('down', listenerEnter);
            cerrarYEmpezar();
        };
        teclaEnter.on('down', listenerEnter);
    }

    iniciarMinijuego() {
        this.juegoIniciado = true;

        this.sensores.forEach(sensor => {
            if (sensor.tween) {
                sensor.tween.resume();
            }
        });

        this.input.on('pointerdown', () => this.intentarCalibrar());
        this.input.keyboard.on('keydown-SPACE', () => this.intentarCalibrar());
    }

    intentarCalibrar() {
        if (!this.juegoIniciado || this.completado || this.procesandoError || this.sensorActual >= 3) return;

        let sensor = this.sensores[this.sensorActual];

        let distancia = Math.abs(sensor.indicador.x - sensor.zonaVerde.x);
        let margenTolerancia = sensor.zonaVerde.width / 2;

        if (distancia <= margenTolerancia) {
            sensor.tween.pause();
            sensor.indicador.setFillStyle(this.colorZona);
            sensor.estado.setText('OK').setColor(colorCSS(this.colorZona));
            sensor.calibrado = true;
            this.sensorActual++;

            if (this.sensorActual === 3) {
                this.completarMinijuego();
            }
        } else {
            this.registrarFallo();
        }
    }

    registrarFallo() {
        this.procesandoError = true;
        this.musicaPerder.play();
        let vidasActuales = this.registry.get('vidas') - 1;
        this.registry.set('vidas', vidasActuales);

        this.cameras.main.flash(300, 255, 0, 0);

        if (vidasActuales <= 0) {
            this.completado = true;
            this.textoEstado.setText('¡SIN VIDAS RESTANTES!');
            this.textoEstado.setColor(colorCSS(this.tema.error));

            this.time.delayedCall(500, () => {
                this.musicaMinijuego.stop();
                volverAlMapa(this); 
            });
        } else {
            this.textoEstado.setText('¡FALLO! INTÉNTALO DE NUEVO');
            this.textoEstado.setColor(colorCSS(this.tema.error));

            this.time.delayedCall(800, () => {
                this.procesandoError = false; 
                if (!this.completado) {
                    this.textoEstado.setText('');
                }
            });
        }
    }

    completarMinijuego() {
        this.registry.set('cablesResueltos', true);
        completarMision('cables'); 
        this.completado = true;
        this.musicaGanar.play();
        this.textoEstado.setText('¡SISTEMA CALIBRADO!');
        this.textoEstado.setColor(colorCSS(this.colorZona));

        this.time.delayedCall(1200, () => {
            this.musicaMinijuego.stop();
            volverAlMapa(this);
        });
    }
}