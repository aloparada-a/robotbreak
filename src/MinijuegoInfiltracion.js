class MinijuegoInfiltracion extends Phaser.Scene {
    constructor() {
        super({ key: 'MinijuegoInfiltracion' });
    }

    create() {
        this.tema = TEMAS.turquesa;
        const tema = this.tema;

        this.musicaGanar = this.sound.add('musicaGanar', { volume: 0.5, loop: false });
        this.musicaMinijuego = this.sound.add('musicaMinijuego', { volume: 0.5, loop: true });
        this.musicaMinijuego.play();

       
        const marco = dibujarMarco(this, tema, 680, 520, 'INFILTRACIÓN DE MALWARE', 2);

        // Torre de origen (izquierda)
        this.add.rectangle(455, 445, 40, 340, tema.panel).setStrokeStyle(2, tema.principal, 0.6);
        this.add.text(455, 445, 'O\nR\nI\nG\nE\nN', { 
            fontFamily: FUENTE_JUEGO,
            fontSize: '16px', 
            color: colorCSS(tema.suave), 
            align: 'center'
        }).setOrigin(0.5);

        
        this.servidor = this.add.rectangle(990, 445, 70, 340, tema.panel).setStrokeStyle(3, tema.principal);
        this.add.text(990, 445, 'S\nE\nR\nV\nI\nD\nO\nR', { 
            fontFamily: FUENTE_JUEGO,
            fontSize: '16px', 
            color: colorCSS(tema.principal), 
            align: 'center'
        }).setOrigin(0.5);

        this.paquetesMalwareInfiltrados = 0; 
        this.objetivoMalware = 8;
        this.completado = false;
        this.procesandoError = false;
        this.juegoIniciado = false;
        this.grupoPaquetes = this.add.group();

        
        this.textoEstado = this.add.text(750, marco.arriba + 88, '', { 
            fontFamily: FUENTE_JUEGO,
            fontSize: '16px', 
            color: colorCSS(tema.error), 
            align: 'center'
        }).setOrigin(0.5);

        
        this.textoProgreso = this.add.text(marco.izq + 30, 640, `INFILTRADOS: 0/${this.objetivoMalware}`, { 
            fontFamily: FUENTE_JUEGO,
            fontSize: '16px', 
            color: colorCSS(tema.principal)
        }).setOrigin(0, 0.5);

        this.segmentos = [];
        for (let k = 0; k < this.objetivoMalware; k++) {
            let segmento = this.add.rectangle(680 + k * 32, 640, 24, 16, tema.panel)
                .setStrokeStyle(2, tema.principal, 0.7);
            this.segmentos.push(segmento);
        }

        this.mostrarExplicacionCatch();
    }

    mostrarExplicacionCatch() {
        const posX = 1200; 
        const posY = 660;

        const sonidoVoz = this.sound.add('blah', { volume: 0.6, loop: false });
        sonidoVoz.play();

        const anchoBocadillo = 360;
        const padding = 30;

        const mensajeTexto = "¡Escucha con atención!\n\n" +
            "Debes dejar pasar los paquetes de MALWARE [ROJOS] hacia el servidor.\n\n" +
            "HAZ CLIC en los paquetes de TRÁFICO NORMAL [VERDES] para destruirlos.\n\n" +
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

        this.generadorPaquetes = this.time.addEvent({
            delay: 1100,
            callback: () => this.generarPaquete(),
            loop: true
        });
    }

    generarPaquete() {
        if (this.completado || !this.juegoIniciado) return;

        let y = Phaser.Math.Between(300, 590);
        let esMalware = Phaser.Math.Between(0, 1) === 1;
        
        let color = esMalware ? this.tema.error : this.tema.acierto;

        
        let halo = this.add.rectangle(500, y, 46, 46, color, 0.22);

        let paquete = this.add.rectangle(500, y, 32, 32, color).setInteractive({ useHandCursor: true });
        paquete.esMalware = esMalware;

        let borde = this.add.rectangle(500, y, 32, 32).setStrokeStyle(2, 0xffffff);
        
        this.grupoPaquetes.add(paquete);

        let velocidad = Phaser.Math.Between(1600, 2000);
        
        
        let tween = this.tweens.add({
            targets: [paquete, borde, halo],
            x: 960,
            duration: velocidad,
            onComplete: () => {
                if (!this.completado) {
                    if (paquete.esMalware) {
                        this.paquetesMalwareInfiltrados++;
                        this.textoProgreso.setText(`INFILTRADOS: ${this.paquetesMalwareInfiltrados}/${this.objetivoMalware}`);

                        let segmento = this.segmentos[this.paquetesMalwareInfiltrados - 1];
                        if (segmento) segmento.setFillStyle(this.tema.principal);

                        
                        this.tweens.add({
                            targets: this.servidor,
                            alpha: 0.5,
                            duration: 80,
                            yoyo: true
                        });
                        
                        if (this.paquetesMalwareInfiltrados >= this.objetivoMalware) {
                            this.completarMinijuego();
                        }
                    } else {
                        this.registrarFallo('¡DEJASTE PASAR TRÁFICO NORMAL!');
                    }
                }
                borde.destroy();
                halo.destroy();
                paquete.destroy();
            }
        });

        paquete.on('pointerdown', () => {
            if (this.completado || this.procesandoError) return;

            let px = paquete.x;
            let py = paquete.y;

            tween.stop();
            borde.destroy();
            halo.destroy();
            paquete.destroy();

            if (esMalware) {
                this.registrarFallo('¡DESTRUISTE EL MALWARE!');
            } else {
                let destello = this.add.circle(px, py, 20, this.tema.acierto);
                this.tweens.add({
                    targets: destello,
                    scale: 1.8,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => destello.destroy()
                });
            }
        });
    }

    registrarFallo(mensajeError) {
        if (this.procesandoError) return;

        this.procesandoError = true;

        let vidasActuales = this.registry.get('vidas') - 1;
        this.registry.set('vidas', vidasActuales);

        this.cameras.main.flash(300, 255, 0, 0);

        if (vidasActuales <= 0) {
            this.completado = true;
            if (this.generadorPaquetes) this.generadorPaquetes.remove();
            
            if (this.musicaMinijuego) this.musicaMinijuego.stop();

            this.textoEstado.setText('¡INFRAESTRUCTURA NO INFECTADA!');
            this.textoEstado.setColor(colorCSS(this.tema.error));

            this.time.delayedCall(500, () => {
                volverAlMapa(this);
            });
        } else {
            this.textoEstado.setText(mensajeError);
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
        this.completado = true;
        if (this.generadorPaquetes) this.generadorPaquetes.remove();
        completarMision('infiltracion');

        if (this.musicaMinijuego) this.musicaMinijuego.stop();
        this.musicaGanar.play();

        this.textoEstado.setText('¡SISTEMA INFILTRADO CON ÉXITO!');
        this.textoEstado.setColor(colorCSS(this.tema.principal));

        this.time.delayedCall(1200, () => {
            volverAlMapa(this);
        });
    }
}