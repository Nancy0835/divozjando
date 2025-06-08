let AMP_MIN = 0.005;
let AMP_MAX = 0.05;

let mic;
let fft;
let amp = 0;

let colores = ['#B03030', '#3A4BA0', '#D9B400', '#D97600', '#222222'];
let figuras = [];

let cardumen;

function setup() {
  createCanvas(600, 600);
  mic = new p5.AudioIn();
  fft = new p5.FFT(0.8, 1024);
  userStartAudio();
  mic.start();
  fft.setInput(mic);

  cardumen = new CardumenLinea(random(width), random(height), 10);
}

function draw() {
  background('#FFFFFF');
  amp = mic.getLevel();
  fft.analyze();

  // Graves y agudos
  let graveEnergy = fft.getEnergy(40, 250);
  let agudoEnergy = fft.getEnergy(2000, 6000);

  // Figuras geométricas (igual que antes)
  if (amp > AMP_MIN) {
    if (figuras.length < 15) {
      let tipo = random(['rectangulo', 'cuadrado']);
      let x = random(width * 0.1, width * 0.9);
      let y = random(height * 0.1, height * 0.9);
      let tam = random(30, 80);
      let color = random(colores);
      let rot = radians(random(-45, 45));
      figuras.push(new Figura(tipo, x, y, tam, color, rot));
    }
  }

  for (let f of figuras) {
    f.actualizarTamano(amp);
    f.dibujar();
  }

  // Cardumen: velocidad por graves, dirección por agudos
  cardumen.actualizar(amp, graveEnergy, agudoEnergy);
  cardumen.dibujar();

  // Texto informativo
  push();
  textSize(20);
  fill(50);
  text("Amplitud: " + nfc(amp, 3), 20, 30);
  text("Graves: " + nfc(graveEnergy, 2), 20, 60);
  text("Agudos: " + nfc(agudoEnergy, 2), 20, 90);
  pop();
}

class Figura {
  constructor(tipo, x, y, tam, color, rot) {
    this.tipo = tipo;
    this.x = x;
    this.y = y;
    this.tamBase = tam;
    this.tamActual = tam;
    this.color = color;
    this.rot = rot;

    if (this.tipo === 'rectangulo') {
      this.proporcion = random(0.3, 0.6);
    }
  }

  actualizarTamano(amp) {
    let escala = map(amp, AMP_MIN, AMP_MAX, 1.2, 1.8);
    this.tamActual = this.tamBase * escala;
  }

  dibujar() {
    push();
    translate(this.x, this.y);
    rotate(this.rot);
    noStroke();
    fill(this.color);
    rectMode(CENTER);

    if (this.tipo === 'rectangulo') {
      let w = this.tamActual;
      let h = this.tamActual * this.proporcion;
      rect(0, 0, w, h);
    } else if (this.tipo === 'cuadrado') {
      rect(0, 0, this.tamActual, this.tamActual);
    }

    pop();
  }
}

class Linea {
  constructor(offsetX, offsetY, color) {
    this.baseX = offsetX;
    this.baseY = offsetY;
    this.x = offsetX;
    this.y = offsetY;
    this.largo = 120;
    this.color = color;
  }

  actualizarPosicion(cardumenX, cardumenY, tiempo) {
    this.x = cardumenX + this.baseX;
    this.y = cardumenY + this.baseY + sin(tiempo + this.baseX * 0.3) * 10;
  }

  dibujar() {
    push();
    stroke(this.color);
    strokeWeight(5);
    line(this.x, this.y, this.x + this.largo, this.y);
    pop();
  }
}

class CardumenLinea {
  constructor(x, y, cantidad) {
    this.x = x;
    this.y = y;
    this.tiempo = 0;
    this.lineas = [];
    for (let i = 0; i < cantidad; i++) {
      let offsetX = i * 25;
      let offsetY = random(-20, 20);
      let color = random(colores);
      this.lineas.push(new Linea(offsetX, offsetY, color));
    }
    this.dirX = 1;
    this.dirY = 0;
    this.velocidad = 1;
  }

  actualizar(amp, graveEnergy, agudoEnergy) {
    this.tiempo += 0.05;

    // Velocidad depende de graves
    this.velocidad = map(graveEnergy, 0, 255, 0.5, 8);

    // Dirección depende de agudos
    // 0 agudos = horizontal, 255 agudos = diagonal/vertical
    let angle = map(agudoEnergy, 0, 255, 0, PI / 2);
    this.dirX = cos(angle);
    this.dirY = sin(angle);

    this.x += this.dirX * this.velocidad;
    this.y += this.dirY * this.velocidad;

    // Teletransporte en bordes
    let margen = 60;
    if (
      this.x > width + margen ||
      this.x < -margen ||
      this.y > height + margen ||
      this.y < -margen
    ) {
      let borde = floor(random(4));
      if (borde === 0) {
        this.x = random(width);
        this.y = -margen;
      } else if (borde === 1) {
        this.x = width + margen;
        this.y = random(height);
      } else if (borde === 2) {
        this.x = random(width);
        this.y = height + margen;
      } else {
        this.x = -margen;
        this.y = random(height);
      }
    }
  }

  dibujar() {
    for (let linea of this.lineas) {
      linea.actualizarPosicion(this.x, this.y, this.tiempo);
      linea.dibujar();
    }
  }
}

