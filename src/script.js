// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAs0SsYmkHFQ7krUp4Mt4_QzW6jVj1xfCU",
    authDomain: "robot-break.firebaseapp.com",
    databaseURL: "https://robot-break-default-rtdb.firebaseio.com",
    projectId: "robot-break",
    storageBucket: "robot-break.firebasestorage.app",
    messagingSenderId: "296168442145",
    appId: "1:296168442145:web:5170e9a407094cc81a1660"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

var config = {
    type: Phaser.AUTO,
    width: 1500,
    height: 820,
    backgroundColor: '#000000',
    parent: 'game-container',
    render: {
        antialias: false,        
        roundPixels: true,       
        crisp: true
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics:{
        default:'arcade',
        arcade: {
            gravity:{y:0},
            debug: false
        }
    },
    scene:[
        {
            key: 'EscenaPrincipal',
            preload: preload,
            create: create,
            update: update
        },
        MinijuegoCables,
        MinijuegoInfiltracion,
        Minijuegocontra,
        EscenaGameOver,
        EscenaRanking
    ]
};

var game = null;
var nombreJugador = 'ANON';
const TOTAL_MINIJUEGOS = 3;

document.getElementById('btn-jugar').addEventListener('click', function(){
    nombreJugador = document.getElementById('nombre-jugador').value.trim() || 'ANON';
    document.getElementById('inicio').style.display = 'none';

    const iniciar = () => { 
        if (game) {
            game.destroy(true);
            game = null;
        }
        game = new Phaser.Game(config); 
        game.registry.set('nombreJugador', nombreJugador);
    };

    document.fonts.load('22px "Departure Mono"').then(iniciar).catch(iniciar);
});

var player;
var plataformas;
var cursores;
var objetosInteractivos;
var objetosSolidosInteractivos;
var teclaE;
var compu;
var teclasWASD;

function preload(){
    this.load.image('floor', 'assets/floor.png');
    this.load.image('walls', 'assets/walls.png');
    this.load.image('caja', 'assets/caja.png');
    this.load.image('compu', 'assets/compu.png');
    this.load.image('pantalla', 'assets/pantalla.png');
    this.load.image('bateria', 'assets/bateria.png');
    this.load.image('bubble', 'assets/speechbubble.png');
    this.load.image('gameoverscreen','assets/gameover.png');
    this.load.image('rankback', 'assets/rankback.png');

    this.load.audio('musicaMinijuego', 'assets/bitsminigame.mp3');
    this.load.audio('musicaGanar', 'assets/WINBIT.mp3');
    this.load.audio('musicaPerder', 'assets/ERRORBIT.mp3');
    this.load.audio('blah','assets/bleep.mp3');

    this.load.spritesheet('catch', 'assets/aicatchsheet.png', {
        frameWidth: 64,
        frameHeight: 64
    });

    this.load.spritesheet('catchlaugh', 'assets/aicatchlaughsheet.png', {
        frameWidth: 64,
        frameHeight: 64
    });

    this.load.spritesheet('robot', 'assets/robotcitospreadsheetog.png', {
        frameWidth: 64,
        frameHeight: 64
    });
}

function create(){
    const aplicarPixelArtASprites = (escena) => {
        const clavesAssets = [
            'floor', 'walls', 'caja', 'compu', 'pantalla', 
            'bateria', 'bubble', 'catch', 'robot', 'gameoverscreen', 'rankback'
        ];
        clavesAssets.forEach(clave => {
            if (escena.textures.exists(clave)) {
                escena.textures.get(clave).setFilter(Phaser.Textures.NEAREST);
            }
        });
    };

    aplicarPixelArtASprites(this);

    this.juegoTerminado = false;
    this.mensajeActivo = false;

    this.registry.set('minijuegosHechos', []);
    this.registry.set('cablesResueltos', false);

    this.musicaPerder = this.sound.add('musicaPerder', { volume: 0.5, loop: false });

    this.registry.set('vidas', 3);

    this.grupoVidas = this.add.group();

    const actualizarIconosVidas = () => {
        this.grupoVidas.clear(true, true);
        let vidasActuales = this.registry.get('vidas');
        
        for (let i = 0; i < vidasActuales; i++) {
            let icono = this.add.image(60 + (i * 60), 80, 'bateria').setDepth(1000); 
            this.grupoVidas.add(icono);
        }
    };

    actualizarIconosVidas();

    const manejarVidas = (parent, value) => {
        actualizarIconosVidas();

        if (value <= 0 && !this.juegoTerminado) {
            this.juegoTerminado = true;
            this.scene.pause(); 
            this.musicaPerder.play();
            this.scene.launch('EscenaGameOver'); 
        }
    };

    this.registry.events.off('changedata-vidas');
    this.registry.events.on('changedata-vidas', manejarVidas);

    this.add.image(800, 400, 'floor');
    this.add.image(800, 400, 'walls');

    plataformas = this.physics.add.staticGroup();
    objetosInteractivos = this.physics.add.staticGroup();
    objetosSolidosInteractivos = this.physics.add.group();

    let pared1 = this.add.rectangle(800, 200, 1275, 50, 0x000000, 0); 
    plataformas.add(pared1);
    let pared2 = this.add.rectangle(800, 800, 1275, 50, 0x000000, 0); 
    plataformas.add(pared2);
    let pared3 = this.add.rectangle(140, 500, 60, 550, 0x000000, 0); 
    plataformas.add(pared3);
    let pared4 = this.add.rectangle(1470, 500, 60, 550, 0x000000, 0); 
    plataformas.add(pared4);

    let pantalla = objetosInteractivos.create(1020, 220, 'pantalla');
    pantalla.setName('pantalla');

    let caja = objetosInteractivos.create(600,220,'caja');
    caja.setName('caja');

    compu = objetosSolidosInteractivos.create(800,500,'compu');

    pantalla.setScale(2);
    caja.setScale(2);
    compu.setName('compu').setScale(5);

    compu.setImmovable(true);
    compu.body.setAllowGravity(false);

    pantalla.body.setSize(110, 80);
    pantalla.body.setOffset(pantalla.width*-0.3, pantalla.height*0.25);

    compu.body.setSize(50, compu.height * 0.55);
    compu.body.setOffset(compu.width * 0.1, compu.height * 0.25);

    player = this.physics.add.sprite(800, 700, 'robot', 0);
    player.setCollideWorldBounds(true);
    player.setScale(3);
    player.body.setSize(36, 44);

    this.physics.add.collider(player, plataformas);

    cursores = this.input.keyboard.createCursorKeys();
    teclasWASD = this.input.keyboard.addKeys('W,A,S,D');
    teclaE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.registry.set('inicioTiempo', Date.now());

    this.textoTiempo = this.add.text(1440, 60, '00:00.00', {
        fontFamily: 'Departure Mono',
        fontSize: '28px',
        color: '#00ff00'
    }).setOrigin(1, 0).setDepth(1000);

    const actualizarReloj = () => {
        if (this.juegoTerminado) return;
        this.textoTiempo.setText(formatearTiempo(Date.now() - this.registry.get('inicioTiempo')));
    };

    this.events.off('update', actualizarReloj);
    this.events.on('update', actualizarReloj);

    this.textoMisiones = this.add.text(1440, 100, 'Misiones: 0/' + TOTAL_MINIJUEGOS, {
        fontFamily: 'Departure Mono',
        fontSize: '22px',
        color: '#ffffff'
    }).setOrigin(1, 0).setDepth(1000);

    const actualizarMisiones = (parent, value) => {
        this.textoMisiones.setText('Misiones: ' + value.length + '/' + TOTAL_MINIJUEGOS);
    };

    this.registry.events.off('changedata-minijuegosHechos');
    this.registry.events.on('changedata-minijuegosHechos', actualizarMisiones);

    if (!this.anims.exists('guia_hablando')) {
        this.anims.create({
            key: 'guia_hablando',
            frames: this.anims.generateFrameNumbers('catch', { start: 0, end: 1 }),
            frameRate: 4,
            repeat: -1
        });
    }

    crearHUDGuia(this);
}

function update(){
    if (this.juegoTerminado || !player || !player.body) return;

    player.setVelocity(0);

    const izquierda = cursores.left.isDown || teclasWASD.A.isDown;
    const derecha = cursores.right.isDown || teclasWASD.D.isDown;
    const arriba = cursores.up.isDown || teclasWASD.W.isDown;
    const abajo = cursores.down.isDown || teclasWASD.S.isDown; 

    if (izquierda) {
        player.setVelocityX(-200);
        player.setFrame(0);      
        player.setFlipX(false);  
    } 
    else if (derecha) {
        player.setVelocityX(200);
        player.setFrame(0);      
        player.setFlipX(true);   
    }

    if (arriba) {
        player.setVelocityY(-200);
        player.setFrame(1);      
        player.setFlipX(false);
    }
    else if (abajo) {
        player.setVelocityY(200);
        player.setFrame(0);      
        player.setFlipX(false);
    }

    player.body.velocity.normalize().scale(200);

    player.setDepth(player.y);
    compu.setDepth(compu.y);

    objetosInteractivos.getChildren().forEach(function(obj) {
        obj.setDepth(obj.y);
    });

    if (Phaser.Input.Keyboard.JustDown(teclaE)) {
        this.physics.overlap(player, objetosInteractivos, interactuar, null, this);
        this.physics.overlap(player, objetosSolidosInteractivos, interactuar, null, this);
    }
}

function mostrarMensaje(escena, textoMensaje) {
    if (escena.mensajeActivo) return;
    escena.mensajeActivo = true;

    const posX = 1200; 
    const posY = 660;

    const sonidoVoz = escena.sound.add('blah', { volume: 0.6, loop: false });
    sonidoVoz.play();

    const anchoBocadillo = 360;
    const padding = 30;

    let texto = escena.add.text(-160, 5, textoMensaje, {
        fontFamily: 'Departure Mono',
        fontSize: '13px',
        color: '#1613b9',
        align: 'left',
        wordWrap: { width: anchoBocadillo - (padding * 2) }
    }).setOrigin(0.5, 0.5);

    let altoInicial = texto.height + (padding * 2);

    let fondoBocadillo = escena.add.nineslice(
        -160, 5, 'bubble', 0, 
        anchoBocadillo, altoInicial, 
        16, 16, 16, 16
    ).setOrigin(0.5, 0.5);

    let guiaSprite = escena.add.sprite(100, 0, 'catch').setScale(2.5);
    guiaSprite.play('guia_hablando');

    let contenedorDialogo = escena.add.container(posX, posY, [
        fondoBocadillo, 
        texto, 
        guiaSprite
    ]);

    contenedorDialogo.setScrollFactor(0);
    contenedorDialogo.setDepth(3000);

    const cerrarDialogo = () => {
        if (!contenedorDialogo || !contenedorDialogo.active) return;

        guiaSprite.stop();
        guiaSprite.setFrame(0);

        if (sonidoVoz && sonidoVoz.isPlaying) {
            sonidoVoz.stop();
        }

        escena.tweens.add({
            targets: contenedorDialogo,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                contenedorDialogo.destroy();
                escena.mensajeActivo = false;
            }
        });
    };

    const teclaEnter = escena.input.keyboard.addKey('ENTER');
    const listenerEnter = () => {
        teclaEnter.off('down', listenerEnter);
        cerrarDialogo();
    };
    teclaEnter.on('down', listenerEnter);

    escena.time.delayedCall(3500, () => {
        teclaEnter.off('down', listenerEnter);
        cerrarDialogo();
    });
}

function interactuar(jugador, objeto) {
    if (objeto.name === 'compu') { 
        if (this.registry.get('cablesResueltos') === true) {
            this.scene.pause();
            this.scene.launch('MinijuegoInfiltracion');
        } else {
            mostrarMensaje(this, 
                "¿Esperas que esa consola funcione sin energía?\n\n" +
                "Si fuera tú, primero arreglaría la caja de cables."
            );
        }
    } 
    else if (objeto.name === 'caja') {
        this.scene.pause();
        this.scene.launch('MinijuegoCables');
    }
    else if (objeto.name === 'pantalla') {
        const hechos = this.registry.get('minijuegosHechos') || [];

        if (hechos.includes('infiltracion')) {
            this.scene.pause();
            this.scene.launch('Minijuegocontra');
        } else {
            mostrarMensaje(this, 
                "¡Ni te molestes! Esa terminal está bloqueada.\n\n" +
                "Es tan obvio que debes acceder primero a la computadora para usar la terminal."
            );
        }
    }
}

function ganarJuego(escena){
    if (escena.juegoTerminado) return;
    escena.juegoTerminado = true;

    const tiempoInicio = escena.registry.get('inicioTiempo') || Date.now();
    const tiempoUsado = Date.now() - tiempoInicio;

    escena.scene.stop('Minijuegocontra');
    escena.scene.stop('EscenaPrincipal');

    escena.scene.start('EscenaRanking', { tiempo: tiempoUsado });
}

function completarMision(nombre){
    const principal = game.scene.getScene('EscenaPrincipal');
    const hechos = principal.registry.get('minijuegosHechos') || [];

    if (!hechos.includes(nombre)) {
        principal.registry.set('minijuegosHechos', [...hechos, nombre]);
    }

    if (principal.registry.get('minijuegosHechos').length >= TOTAL_MINIJUEGOS) {
        ganarJuego(principal);
    }
}

function volverAlMapa(escena){
    const principal = escena.scene.get('EscenaPrincipal');
    if (!principal.juegoTerminado) {
        escena.scene.resume('EscenaPrincipal');
    }
    escena.scene.stop();
}

function volverAlInicio(){
    if (game) {
        game.destroy(true);
        game = null;
    }
    document.getElementById('inicio').style.display = 'flex';
}

function crearHUDGuia(escena) {
    const posX = 1200; 
    const posY = 660;

    const sonidoVoz = escena.sound.add('blah', { volume: 0.6, loop: false });

    const dialogos = [
        "¿Qué haces aquí, " + (escena.registry.get('nombreJugador') || 'ROBOT') + "?\n\n" +
        "¿Realmente te crees capaz de robarme los datos?\n\n" +
        "[PRESIONA ENTER]",

        "Usar las [FLECHAS] para MOVERTE es impractico pero es lo que hay.\n" +
        "\n"+
        "Si quisiera arruinarte el progreso bastaria con [PRESIONAR E] para INTERACTUAR con cada uno de los acertijos.\n\n" +
        "[ENTER para cerrar]"
    ];

    let indiceDialogo = 0;

    const anchoBocadillo = 360;
    const padding = 30;

    let texto = escena.add.text(-160, 5, dialogos[indiceDialogo], {
        fontFamily: 'Departure Mono',
        fontSize: '13px',
        color: '#1613b9',
        align: 'left',
        wordWrap: { width: anchoBocadillo - (padding * 2) }
    }).setOrigin(0.5, 0.5);

    let altoInicial = texto.height + (padding * 2);

    let fondoBocadillo = escena.add.nineslice(
        -160, 
        5, 
        'bubble', 
        0, 
        anchoBocadillo, 
        altoInicial, 
        16, 16, 16, 16
    ).setOrigin(0.5, 0.5);

    let guiaSprite = escena.add.sprite(100, 0, 'catch').setScale(2.5);

    guiaSprite.play('guia_hablando');

    sonidoVoz.play();

    let contenedorGuia = escena.add.container(posX, posY, [
        fondoBocadillo, 
        texto, 
        guiaSprite
    ]);

    contenedorGuia.setScrollFactor(0);
    contenedorGuia.setDepth(3000);

    let temporizadorAuto = null;

    const cerrarGuia = () => {
        if (!contenedorGuia || !contenedorGuia.active) return;

        if (temporizadorAuto) temporizadorAuto.remove();
        guiaSprite.stop();
        guiaSprite.setFrame(0);

        if (sonidoVoz && sonidoVoz.isPlaying) {
            sonidoVoz.stop();
        }

        escena.tweens.add({
            targets: contenedorGuia,
            alpha: 0,
            duration: 600,
            onComplete: () => {
                contenedorGuia.destroy();
            }
        });
    };

    const siguienteDialogo = () => {
        if (!contenedorGuia || !contenedorGuia.active) return;

        indiceDialogo++;

        if (indiceDialogo < dialogos.length) {
            texto.setText(dialogos[indiceDialogo]);
            sonidoVoz.play();

            const nuevoAlto = texto.height + (padding * 2);
            fondoBocadillo.setSize(anchoBocadillo, nuevoAlto);

            if (temporizadorAuto) temporizadorAuto.remove();
            temporizadorAuto = escena.time.delayedCall(8000, cerrarGuia);
        } else {
            cerrarGuia();
        }
    };

    escena.input.keyboard.on('keydown-ENTER', siguienteDialogo);

    contenedorGuia.once('destroy', () => {
        escena.input.keyboard.off('keydown-ENTER', siguienteDialogo);
    });

    temporizadorAuto = escena.time.delayedCall(5000, siguienteDialogo);
}