//通信方法
//モータAを90°/sで回したい場合は、「A90;」と送信
//モータBを-12°/sで回したい場合は、「B-12;」と送信

constexpr uint8_t APHASE1 = 2;
constexpr uint8_t AENBL1 = 3;
constexpr uint8_t BPHASE1 = 4;
constexpr uint8_t BENBL1 = 5;
constexpr uint8_t APHASE2 = 6;
constexpr uint8_t AENBL2 = 7;
constexpr uint8_t BPHASE2 = 8;
constexpr uint8_t BENBL2 = 9;
constexpr uint8_t APHASE3 = 10;
constexpr uint8_t AENBL3 = 11;
constexpr uint8_t BPHASE3 = 12;
constexpr uint8_t BENBL3 = 13;

int speed[3] = {};  //-90~-12,0,12~90 [°/s]
int table[9] = {};  //[{mode, pulse_tick, mod_pulse_tick}]

void reset(uint8_t phase1, uint8_t enbl1, uint8_t phase2, uint8_t enbl2) {
  pinMode(phase1, OUTPUT);
  pinMode(enbl1, OUTPUT);
  pinMode(phase2, OUTPUT);
  pinMode(enbl2, OUTPUT);
  digitalWrite(enbl1, HIGH);
  digitalWrite(enbl2, HIGH);
}

void control(uint8_t phase1, uint8_t phase2, int* tbl) {
  if (++tbl[2] >= tbl[1] * 4) tbl[2] = 0;

  if (tbl[0] > 0) {
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
  } else if (tbl[0] < 0) {
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
  reset(APHASE1, AENBL1, BPHASE1, BENBL1);
  reset(APHASE2, AENBL2, BPHASE2, BENBL2);
  reset(APHASE3, AENBL3, BPHASE3, BENBL3);
}

void loop() {
  if (Serial.available()) {
    String str = Serial.readStringUntil(';');
    char top = str[0];
    str.remove(0, 1);
    int spd = str.toInt();
    if (top == 'A') {
      table[0] = spd / abs(spd);
      table[1] = 20000 / (abs(spd) / (5.625 / 64));
      table[2] = 0;
      speed[0] = spd;
    }
    if (top == 'B') {
      table[3] = spd / abs(spd);
      table[4] = 20000 / (abs(spd) / (5.625 / 64));
      table[5] = 0;
      speed[1] = spd;
    }
    if (top == 'C') {
      table[6] = spd / abs(spd);
      table[7] = 20000 / (abs(spd) / (5.625 / 64));
      table[8] = 0;
      speed[2] = spd;
    }
    Serial.print(speed[0]);
    Serial.print(' ');
    Serial.print(speed[1]);
    Serial.print(' ');
    Serial.println(speed[2]);
  }

  control(APHASE1, BPHASE1, table);
  control(APHASE2, BPHASE2, table + 3);
  control(APHASE3, BPHASE3, table + 6);

  delayMicroseconds(100);
}