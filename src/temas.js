

const FUENTE_JUEGO = '"Departure Mono", monospace';

const TEMAS = {
    azul: {
        principal: 0x4db8ff,   
        suave: 0xa8dcff,       
        fondo: 0x06142b,       
        panel: 0x0d2a52,       
        acierto: 0x8dffd9,     
        error: 0xff4d6d,       
        aviso: 0xffe066       
    },
    turquesa: {
        principal: 0x1de9c6,
        suave: 0x9ff7e8,
        fondo: 0x041a1c,
        panel: 0x0b3236,
        acierto: 0xb6ff8a,
        error: 0xff4d6d,
        aviso: 0xffe066
    },
    verde: {
        principal: 0x39ff6a,
        suave: 0xaaffc4,
        fondo: 0x03140a,
        panel: 0x0a2e14,
        acierto: 0xf2ffb0,
        error: 0xff4d6d,
        aviso: 0xffe066
    }
};


function colorCSS(numero) {
    return '#' + numero.toString(16).padStart(6, '0');
}


function dibujarMarco(escena, tema, ancho, alto, titulo, nivel) {
    const cx = 750;
    const cy = 410;
    const izq = cx - ancho / 2;
    const der = cx + ancho / 2;
    const arriba = cy - alto / 2;
    const abajo = cy + alto / 2;

    const trazo = (g, x1, y1, x2, y2) => {
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.strokePath();
    };

    escena.add.rectangle(cx, cy, 1500, 820, 0x000000, 0.6);

    escena.add.rectangle(cx, cy, ancho, alto, tema.fondo).setStrokeStyle(4, tema.principal);

    const rejilla = escena.add.graphics();
    rejilla.lineStyle(1, tema.principal, 0.07);
    for (let x = izq + 50; x < der; x += 50) {
        trazo(rejilla, x, arriba + 52, x, abajo - 6);
    }
    for (let y = arriba + 100; y < abajo; y += 50) {
        trazo(rejilla, izq + 6, y, der - 6, y);
    }

    const bordeInterno = escena.add.rectangle(cx, cy, ancho - 20, alto - 20).setStrokeStyle(1, tema.principal, 0.5);
    escena.tweens.add({
        targets: bordeInterno,
        alpha: 0.25,
        duration: 1400,
        yoyo: true,
        repeat: -1
    });

    escena.add.rectangle(cx, arriba + 26, ancho - 8, 44, tema.principal, 0.14);
    escena.add.rectangle(cx, arriba + 49, ancho - 8, 2, tema.principal, 0.7);

    escena.add.text(izq + 24, arriba + 26, '> ' + titulo, {
        fontFamily: FUENTE_JUEGO,
        fontSize: '22px',
        color: colorCSS(tema.principal)
    }).setOrigin(0, 0.5);

    if (nivel) {
        escena.add.text(der - 100, arriba + 26, 'NIVEL ' + nivel + '/3', {
            fontFamily: FUENTE_JUEGO,
            fontSize: '16px',
            color: colorCSS(tema.suave)
        }).setOrigin(1, 0.5);
    }

    for (let i = 0; i < 3; i++) {
        const luz = escena.add.circle(der - 30 - i * 22, arriba + 26, 5, tema.principal, i === 0 ? 1 : 0.35);

        if (i === 0) {
            escena.tweens.add({
                targets: luz,
                alpha: 0.25,
                duration: 700,
                yoyo: true,
                repeat: -1
            });
        }
    }

    const esquinas = escena.add.graphics();
    esquinas.lineStyle(4, tema.suave, 1);
    const largo = 26;
    const margen = 8;

    [
        [izq, arriba, 1, 1],
        [der, arriba, -1, 1],
        [izq, abajo, 1, -1],
        [der, abajo, -1, -1]
    ].forEach(([x, y, dx, dy]) => {
        const ex = x - dx * margen;
        const ey = y - dy * margen;

        esquinas.beginPath();
        esquinas.moveTo(ex, ey + dy * largo);
        esquinas.lineTo(ex, ey);
        esquinas.lineTo(ex + dx * largo, ey);
        esquinas.strokePath();
    });

    const lineas = escena.add.graphics().setDepth(50);
    lineas.fillStyle(0x000000, 0.13);
    for (let y = arriba + 52; y < abajo - 4; y += 4) {
        lineas.fillRect(izq + 4, y, ancho - 8, 1);
    }

    return { cx, cy, izq, der, arriba, abajo };
}