// Cierra el juego y regresa a la pantalla de inicio (banner + JUGAR)
function volverAlInicio(){
    game.destroy(true); // true = también quita el canvas
    document.getElementById('inicio').style.display = ''; // vuelve a mostrarse con su CSS
}

// --- FUNCIONES DE FIREBASE ---

function guardarRankingGlobal(nombre, tiempoMs) {
    const rankingRef = database.ref('ranking');
    rankingRef.push({
        nombre: nombre || 'Anónimo',
        tiempo: tiempoMs,
        fecha: new Date().toISOString()
    });
}

function obtenerRankingGlobal(callback) {
    const rankingRef = database.ref('ranking');

    rankingRef.orderByChild('tiempo').limitToFirst(10).once('value', (snapshot) => {
        let listaRanking = [];
        snapshot.forEach((childSnapshot) => {
            listaRanking.push(childSnapshot.val());
        });
        callback(listaRanking);
    }, (error) => {
        console.error("Error al consultar Firebase:", error);
        callback([]);
    });
}

function formatearTiempo(ms) {
    if (!ms || isNaN(ms)) return '00:00.00';
    const totalSeg = Math.floor(ms / 1000);
    const min = String(Math.floor(totalSeg / 60)).padStart(2, '0');
    const seg = String(totalSeg % 60).padStart(2, '0');
    const cent = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
    return min + ':' + seg + '.' + cent;
}

// --- ESCENA RANKING ---

class EscenaRanking extends Phaser.Scene {
    constructor() {
        super('EscenaRanking');
    }

    init(data) {
        // Asegurar la captura del tiempo pasado como parámetro
        this.tiempo = (data && typeof data.tiempo === 'number') ? data.tiempo : 0;
    }

    create() {
        if (this.textures.exists('rankback')) {
                this.textures.get('rankback').setFilter(Phaser.Textures.NEAREST);
                let fondo = this.add.image(750, 410, 'rankback');
                fondo.setDisplaySize(1500, 820);
            } else {
                this.add.rectangle(750, 410, 1500, 820, 0x000000);
            }

        const estilo = { fontFamily: 'Departure Mono', fontSize: '24px', color: '#323BC0' };

        
        this.add.text(610, 80, '¡GANASTE!', { ...estilo, fontSize: '56px', color: '#7fdfff' }).setOrigin(0.5);
        this.add.text(750, 160, 'Tu tiempo: ' + formatearTiempo(this.tiempo), estilo).setOrigin(0.5);
        this.add.text(750, 220, '--- MEJORES TIEMPOS ---', { ...estilo, color: '#008FFF' }).setOrigin(0.5);

        const textoCargando = this.add.text(750, 350, 'Cargando ranking global...', { ...estilo, color: '#aaaaaa' }).setOrigin(0.5);

        const nombreJugadorGuardado = this.registry.get('nombreJugador') || (typeof nombreJugador !== 'undefined' ? nombreJugador : 'Anónimo');

        // Guardar la puntuación en Firebase si el tiempo es válido
        if (this.tiempo > 0) {
            guardarRankingGlobal(nombreJugadorGuardado, this.tiempo);
        }

        // Consultar el ranking en Firebase
        this.time.delayedCall(300, () => {
            obtenerRankingGlobal((ranking) => {
                textoCargando.destroy();

                if (!ranking || ranking.length === 0) {
                    this.add.text(750, 350, 'Sin datos de ranking aún.', estilo).setOrigin(0.5);
                    return;
                }

                ranking.forEach((r, i) => {
                    this.add.text(750, 275 + i * 40, (i + 1) + '. ' + r.nombre + '  ' + formatearTiempo(r.tiempo), estilo).setOrigin(0.5);
                });
            });
        });

        this.add.text(750, 730, 'Presiona ESPACIO para jugar de nuevo', { ...estilo, fontSize: '20px' }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.registry.set('vidas', 3);
            this.registry.set('cablesResueltos', false);
            this.registry.set('minijuegosHechos', []);
            this.scene.start('EscenaPrincipal');
        });
        const botonInicio = this.add.text(750, 690, '[ VOLVER AL INICIO ]', {
    ...estilo,
    fontSize: '22px',
    padding: { x: 16, y: 8 }
}).setOrigin(0.5).setInteractive({ useHandCursor: true });

botonInicio.on('pointerover', () => botonInicio.setColor('#000dff'));
botonInicio.on('pointerout', () => botonInicio.setColor('#00b3ff'));
botonInicio.on('pointerdown', () => volverAlInicio());

    }
}
