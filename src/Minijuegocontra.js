const CONTRASENA = 'RAM';

const BANCO_PREGUNTAS = {
    R: [
        { pregunta: '¿Cómo se llama el dispositivo que conecta tu red local con Internet y reparte la señal?', respuesta: 'ROUTER' },
        { pregunta: '¿Cómo se llama el malware que secuestra tus archivos y pide un pago para devolverlos?', respuesta: 'RANSOMWARE' },
        { pregunta: '¿Cómo se llama una máquina programable que realiza tareas de forma automática?', respuesta: 'ROBOT' }
    ],
    A: [
        { pregunta: '¿Cómo se llama el programa que detecta y elimina virus en tu computadora?', respuesta: 'ANTIVIRUS' },
        { pregunta: '¿Cómo se llama la secuencia de pasos ordenados para resolver un problema?', respuesta: 'ALGORITMO' },
        { pregunta: '¿Cómo se llama el proceso de comprobar la identidad de un usuario?', respuesta: 'AUTENTICACION' }
    ],
    M: [
        { pregunta: '¿Cómo se llama el software malicioso en general?', respuesta: 'MALWARE' },
        { pregunta: '¿Cómo se llama el dispositivo de salida que muestra la imagen de la computadora?', respuesta: 'MONITOR' },
        { pregunta: '¿Cómo se llama el componente que guarda datos temporalmente para que el procesador los use rápido?', respuesta: 'MEMORIA' }
    ]
};

const ESTILO_QUIZ = {
    fuente: FUENTE_JUEGO,
    colorPrincipal: TEMAS.verde.principal,   // bordes, rayitas y cursor
    colorFondoPanel: TEMAS.verde.fondo,
    colorCasilla: TEMAS.verde.panel,
    colorCorrecto: TEMAS.verde.acierto,
    colorError: TEMAS.verde.error,
    colorTexto: '#ffffff'
};

const MOSTRAR_CONTRASENA_EN_ETAPA_FINAL = true;

class Minijuegocontra extends Phaser.Scene {
    constructor() {
        super('Minijuegocontra');
    }

    create() {
        const E = ESTILO_QUIZ;

        this.musicaGanar = this.sound.add('musicaGanar', { volume: 0.5, loop: false });
        this.musicaPerder = this.sound.add('musicaPerder', { volume: 0.5, loop: false });
        this.musicaMinijuego = this.sound.add('musicaMinijuego', { volume: 0.5, loop: true });
        this.musicaMinijuego.play();

        // Una pregunta al azar por cada letra de la contraseña, en el orden de CONTRASENA
        this.contrasena = CONTRASENA.split('');
        this.preguntas = this.contrasena.map(letra => {
            const pregunta = Phaser.Utils.Array.GetRandom(BANCO_PREGUNTAS[letra]);
            if (!pregunta.respuesta.startsWith(letra)) {
                console.warn('La respuesta "' + pregunta.respuesta + '" debería empezar con ' + letra);
            }
            return pregunta;
        });

        this.indicePregunta = 0;
        this.completado = false;
        this.procesando = false;
        this.juegoIniciado = false;
        this.escrito = [];
        this.casillas = [];
        this.cursor = null;
        this.mensajeBase = '[ ESCRIBE LA RESPUESTA Y PRESIONA ENTER ]';

        // ----- Panel (marco común, nivel 3 de 3) -----
        dibujarMarco(this, TEMAS.verde, 960, 560, 'TERMINAL DE SEGURIDAD', 3);

        this.textoProgreso = this.add.text(750, 205, '', {
            fontFamily: E.fuente, fontSize: '16px', color: colorCSS(TEMAS.verde.suave)
        }).setOrigin(0.5);

        // Contraseña: solo las rayitas como pista (CONTRASEÑA: _ _ _)
        this.textoContrasena = this.add.text(750, 240, '', {
            fontFamily: E.fuente, fontSize: '22px', color: '#ffff00'
        }).setOrigin(0.5);
        this.actualizarContrasena();

        this.textoPregunta = this.add.text(750, 325, '', {
            fontFamily: E.fuente,
            fontSize: '26px',
            color: E.colorTexto,
            align: 'center',
            wordWrap: { width: 800 }
        }).setOrigin(0.5);

        this.textoMensaje = this.add.text(750, 570, '', {
            fontFamily: E.fuente, fontSize: '18px', color: '#ffff00'
        }).setOrigin(0.5);

        this.add.text(750, 655, 'RETROCESO = BORRAR', {
            fontFamily: E.fuente, fontSize: '13px', color: colorCSS(TEMAS.verde.suave)
        }).setOrigin(0.5).setAlpha(0.6);

        this.cargarPregunta();

        // Primero sale el diálogo de Catch. El teclado del quiz se activa
        // hasta que el jugador lo cierra (ver iniciarMinijuego).
        this.mostrarExplicacionCatch();
    }

    mostrarExplicacionCatch() {
        const posX = 1200; 
        const posY = 660;

        const sonidoVoz = this.sound.add('blah', { volume: 0.6, loop: false });
        sonidoVoz.play();

        const anchoBocadillo = 360;
        const padding = 30;

        const mensajeTexto = "¡Acceso restringido! JAMÁS creí que llegarías tan lejos\n\n" +
            "Responde cada pregunta escribiendo el resultado en el teclado y presiona ENTER para confirmar.\n\n" +
            "Son solo 3 preguntas, pero todas las [INICIALES] forman parte de la verdadera contraseña.\n\n" +
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
        this.input.keyboard.on('keydown', (evento) => this.manejarTecla(evento));
    }

    actualizarContrasena() {
        const rayitas = this.contrasena.map(() => '_');
        this.textoContrasena.setText('CONTRASEÑA: ' + rayitas.join(' '));
    }

    cargarPregunta() {
        this.escrito = [];
        this.procesando = false;

        if (this.indicePregunta < this.preguntas.length) {
            // Etapa normal: una pregunta
            const actual = this.preguntas[this.indicePregunta];

            this.respuestaCorrecta = actual.respuesta;
            this.mensajeBase = '[ ESCRIBE LA RESPUESTA Y PRESIONA ENTER ]';
            this.textoProgreso.setText('PREGUNTA ' + (this.indicePregunta + 1) + ' / ' + this.preguntas.length);
            this.textoPregunta.setText(actual.pregunta);
        } else {
            // Etapa final: escribir la contraseña completa
            this.respuestaCorrecta = CONTRASENA;
            this.mensajeBase = '[ ESCRIBE LA CONTRASEÑA Y PRESIONA ENTER ]';
            this.textoProgreso.setText('ACCESO FINAL');
            this.textoPregunta.setText('INGRESA LA CONTRASEÑA');
            this.textoContrasena.setVisible(MOSTRAR_CONTRASENA_EN_ETAPA_FINAL);
        }

        this.textoMensaje.setText(this.mensajeBase).setColor('#ffff00');

        this.crearCasillas(this.respuestaCorrecta.length);
        this.actualizarCursor();
    }

    crearCasillas(cantidad) {
        const E = ESTILO_QUIZ;

        // Borrar las de la pregunta anterior
        this.casillas.forEach(c => {
            c.fondo.destroy();
            c.linea.destroy();
            c.letra.destroy();
        });
        this.casillas = [];

        const separacion = 10;
        const tamano = Math.min(64, Math.floor(860 / cantidad) - separacion);
        const anchoTotal = cantidad * tamano + (cantidad - 1) * separacion;
        const inicioX = 750 - anchoTotal / 2 + tamano / 2;
        const y = 465;

        for (let i = 0; i < cantidad; i++) {
            const x = inicioX + i * (tamano + separacion);

            // Fondo de la casilla
            const fondo = this.add.rectangle(x, y, tamano, tamano, E.colorCasilla).setDepth(0);

            // La "rayita" de abajo (estilo ahorcado)
            const linea = this.add.rectangle(x, y + tamano / 2 - 3, tamano, 6, E.colorPrincipal).setDepth(1);

            // La letra
            const letra = this.add.text(x, y - 2, '', {
                fontFamily: E.fuente,
                fontSize: Math.floor(tamano * 0.65) + 'px',
                color: E.colorTexto
            }).setOrigin(0.5).setDepth(4);

            this.casillas.push({ fondo, linea, letra });
        }
    }

    actualizarCursor() {
        if (!this.cursor) {
            this.cursor = this.add.rectangle(0, 0, 10, 10, ESTILO_QUIZ.colorPrincipal)
                .setDepth(2)
                .setAlpha(0.35);

            this.tweens.add({
                targets: this.cursor,
                alpha: 0.05,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }

        if (this.escrito.length < this.casillas.length) {
            const casilla = this.casillas[this.escrito.length].fondo;
            this.cursor
                .setVisible(true)
                .setPosition(casilla.x, casilla.y)
                .setSize(casilla.displayWidth, casilla.displayHeight);
        } else {
            this.cursor.setVisible(false);
        }
    }

    manejarTecla(evento) {
        if (this.completado || this.procesando) return;
        if (evento.ctrlKey || evento.metaKey || evento.altKey) return;

        const tecla = evento.key;
        const total = this.respuestaCorrecta.length;

        if (tecla === 'Backspace') {
            if (this.escrito.length > 0) {
                const i = this.escrito.length - 1;
                this.escrito.pop();
                this.casillas[i].letra.setText('');
                this.textoMensaje.setText(this.mensajeBase).setColor('#ffff00');
                this.actualizarCursor();
            }
        }
        else if (tecla === 'Enter') {
            if (this.escrito.length === total) {
                this.revisarRespuesta();
            } else {
                this.textoMensaje.setText('¡FALTAN LETRAS!').setColor('#ff3355');
            }
        }
        else if (/^[a-zñ]$/i.test(tecla) && this.escrito.length < total) {
            const letra = tecla.toUpperCase();
            const i = this.escrito.length;

            this.escrito.push(letra);
            this.casillas[i].letra.setText(letra).setScale(1.5);

            // Animación de "pop" al escribir
            this.tweens.add({
                targets: this.casillas[i].letra,
                scale: 1,
                duration: 120
            });

            this.textoMensaje.setText(this.mensajeBase).setColor('#ffff00');
            this.actualizarCursor();
        }
    }

    revisarRespuesta() {
        this.procesando = true;
        this.cursor.setVisible(false);

        const intento = this.escrito.join('');
        const esContrasenaFinal = this.indicePregunta >= this.preguntas.length;

        if (intento === this.respuestaCorrecta) {
            this.pintarCasillas(ESTILO_QUIZ.colorCorrecto);

            if (esContrasenaFinal) {
                // Escribió bien la contraseña: escapa
                this.terminarQuiz();
            } else {
                this.textoMensaje.setText('¡CORRECTO!').setColor('#00ff88');
                this.indicePregunta++;
                this.time.delayedCall(900, () => this.cargarPregunta());
            }
        } else {
            this.pintarCasillas(ESTILO_QUIZ.colorError);
            this.cameras.main.shake(250, 0.01);

            let vidasActuales = this.registry.get('vidas') - 1;
            this.registry.set('vidas', vidasActuales);

            if (vidasActuales <= 0) {
                this.completado = true;
                this.textoMensaje.setText('¡SIN VIDAS RESTANTES!').setColor('#ff3355');

                this.time.delayedCall(500, () => {
                    this.musicaMinijuego.stop();
                    volverAlMapa(this); // no reanuda el mapa si ya es Game Over
                });
            } else {
                this.musicaPerder.play();
                const aviso = esContrasenaFinal
                    ? '¡CONTRASEÑA INCORRECTA! INTÉNTALO DE NUEVO'
                    : '¡INCORRECTO! INTÉNTALO DE NUEVO';
                this.textoMensaje.setText(aviso).setColor('#ff3355');
                this.time.delayedCall(900, () => this.reiniciarRespuesta());
            }
        }
    }

    pintarCasillas(color) {
        const css = Phaser.Display.Color.IntegerToColor(color).rgba;

        this.casillas.forEach(c => {
            c.linea.setFillStyle(color);
            c.letra.setColor(css);
        });
    }

    reiniciarRespuesta() {
        this.escrito = [];

        this.casillas.forEach(c => {
            c.letra.setText('');
            c.letra.setColor(ESTILO_QUIZ.colorTexto);
            c.linea.setFillStyle(ESTILO_QUIZ.colorPrincipal);
        });

        this.textoMensaje.setText(this.mensajeBase).setColor('#ffff00');
        this.procesando = false;
        this.actualizarCursor();
    }

    terminarQuiz() {
        this.completado = true;

        this.musicaMinijuego.stop();
        this.musicaGanar.play();

        this.textoProgreso.setText('');
        this.textoMensaje.setText('');
        this.textoContrasena.setVisible(true).setColor('#00ff88');
        this.textoPregunta.setText('¡ACCESO CONCEDIDO!').setColor('#00ff88');

        // Es la última misión: aquí se guarda el tiempo y sale el ranking
        this.time.delayedCall(1800, () => {
            completarMision('pantalla');
            volverAlMapa(this);
        });
    }
}
