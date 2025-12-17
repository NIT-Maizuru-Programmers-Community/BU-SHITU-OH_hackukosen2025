constexpr int direction = 1;  //1 or -1

constexpr uint8_t APHASE1 = 2;
constexpr uint8_t BPHASE1 = 3;
constexpr uint8_t APHASE2 = 4;
constexpr uint8_t BPHASE2 = 5;
constexpr uint8_t APHASE3 = 6;
constexpr uint8_t BPHASE3 = 7;
constexpr uint8_t SWITCH1 = 8;
constexpr uint8_t SWITCH2 = 9;
constexpr uint8_t SWITCH3 = 10;

int speed[3] = {};  //-90~-12,0,12~90 [°/s]
int table[9] = {};  //[{mode, pulse_tick, mod_pulse_tick}]

void control(uint8_t phase1, uint8_t phase2, int* tbl) {
  if (++tbl[2] >= tbl[1] * 4) tbl[2] = 0;

  if (tbl[0] * direction > 0) {
    if (tbl[2] == tbl[1]) {
      digitalWrite(phase1, HIGH);
    } else if (tbl[2] == tbl[1] * 2) {
      digitalWrite(phase2, HIGH);
    } else if (tbl[2] == tbl[1] * 3) {
      digitalWrite(phase1, LOW);
    } else if (tbl[2] == 0) {
      digitalWrite(phase2, LOW);
    }
  } else if (tbl[0] == 0) {
    digitalWrite(phase1, LOW);
    digitalWrite(phase2, LOW);
  } else if (tbl[0] * direction < 0) {
    if (tbl[2] == tbl[1]) {
      digitalWrite(phase2, HIGH);
    } else if (tbl[2] == tbl[1] * 2) {
      digitalWrite(phase1, HIGH);
    } else if (tbl[2] == tbl[1] * 3) {
      digitalWrite(phase2, LOW);
    } else if (tbl[2] == 0) {
      digitalWrite(phase1, LOW);
    }
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(APHASE1, OUTPUT);
  pinMode(BPHASE1, OUTPUT);
  pinMode(APHASE2, OUTPUT);
  pinMode(BPHASE2, OUTPUT);
  pinMode(APHASE3, OUTPUT);
  pinMode(BPHASE3, OUTPUT);
  pinMode(SWITCH1, INPUT_PULLUP);
  pinMode(SWITCH2, INPUT_PULLUP);
  pinMode(SWITCH3, INPUT_PULLUP);
}

void loop() {
  if (Serial.available()) {
    String str = Serial.readStringUntil(';');
    char top = str[0];
    if (top == 'R') {
      Serial.println("-90 -90 -90");
      bool reached[3] = {};
      table[0] = -1;
      table[1] = 19;
      table[2] = 0;
      table[3] = -1;
      table[4] = 19;
      table[5] = 0;
      table[6] = -1;
      table[7] = 19;
      table[8] = 0;
      while (!(reached[0] && reached[1] && reached[2])) {
        if (!reached[0] && digitalRead(SWITCH1)) {
          reached[0] = true;
          table[0] = 0;
          table[1] = 0;
          table[2] = 0;
        }
        if (!reached[1] && digitalRead(SWITCH2)) {
          reached[1] = true;
          table[3] = 0;
          table[4] = 0;
          table[5] = 0;
        }
        if (!reached[2] && digitalRead(SWITCH3)) {
          reached[2] = true;
          table[6] = 0;
          table[7] = 0;
          table[8] = 0;
        }
        control(APHASE1, BPHASE1, table);
        control(APHASE2, BPHASE2, table + 3);
        control(APHASE3, BPHASE3, table + 6);
        delayMicroseconds(100);
      }
      speed[0] = 0;
      speed[1] = 0;
      speed[2] = 0;
      Serial.println("0 0 0");
    } else {
      str.remove(0, 1);
      int spd = str.toInt();
      if (top == 'A') {
        if (spd == 0) {
          table[0] = 0;
          table[1] = 0;
          table[2] = 0;
        } else {
          table[0] = spd / abs(spd);
          table[1] = 20000 / (abs(spd) / (5.625 / 64));
          table[2] = 0;
        }
        speed[0] = spd;
      }
      if (top == 'B') {
        if (spd == 0) {
          table[3] = 0;
          table[4] = 0;
          table[5] = 0;
        } else {
          table[3] = spd / abs(spd);
          table[4] = 20000 / (abs(spd) / (5.625 / 64));
          table[5] = 0;
        }
        speed[1] = spd;
      }
      if (top == 'C') {
        if (spd == 0) {
          table[6] = 0;
          table[7] = 0;
          table[8] = 0;
        } else {
          table[6] = spd / abs(spd);
          table[7] = 20000 / (abs(spd) / (5.625 / 64));
          table[8] = 0;
        }
        speed[2] = spd;
      }
      Serial.print(speed[0]);
      Serial.print(' ');
      Serial.print(speed[1]);
      Serial.print(' ');
      Serial.println(speed[2]);
    }
  }

  control(APHASE1, BPHASE1, table);
  control(APHASE2, BPHASE2, table + 3);
  control(APHASE3, BPHASE3, table + 6);

  delayMicroseconds(100);
}