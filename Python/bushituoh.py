import random
import serial
import time
import random
import math

#0からtargetまでをランダムにn分割する
def generate(target, n):
    ret = [int(target / n) for i in range(n)]
    rnd = [random.randint(0, int(target / n)) for i in range(n)]
    rnd = [rnd[i] - (sum(rnd) / n) for i in range(n)]
    ans = [ret[i] + int(rnd[i]) for i in range(n)]
    ans[-1] += target - sum(ans)
    return ans

#generate結果を分かりやすく出力
def printer(li):
    for pos, i in enumerate(li):
        print("-" * i, end="")
        print(pos, end="")
    print()

#numをa1からb1までの空間からa2からb2までの空間にマッピングする
def mapping(num, a1, b1, a2, b2):
    return (num - a1) / (b1 - a1) * (b2 - a2) + a2

#理想を現実にする
def realize(a, b, c, mtr_min, mtr_max):
    angles = [a, b, c]
    max_angle = max(abs(x) for x in angles)

    t = max_angle / mtr_max  #[s]

    while True:
        speeds = []
        ok = True

        for ang in angles:
            if ang == 0:
                spd = 0.0
            else:
                spd = ang / t  #[°/s]
            if spd != 0 and abs(spd) < mtr_min:
                ok = False
                break
            speeds.append(int(spd))

        if ok:
            break

        t *= 1.1

    return [speeds[0], speeds[1], speeds[2], t]

#1-orderedで勝者を返す関数
def match(debugmode = False):
    #パラメータ
    length = 100  #試合情報の長さ
    distance = 20  #試合情報のゴールした際の1位とその他の差
    points = 10  #試合情報の途中経過地点生成数
    radius = 32.5  #現実の回る部分の半径
    goal = 508  #現実のスタートからゴールまでの距離
    mtr_min = 10  #モータの最低速度
    mtr_max = 95  #モータの最高速度


    #シリアル通信を開始
    mySerial = serial.Serial("/dev/ttyAMA10", baudrate=115200, timeout=2)
    time.sleep(2)


    #レース内容を生成
    a = generate(length - distance, points)
    b = generate(length - distance, points)
    c = generate(length - distance, points)

    winner = random.randint(1, 3)
    if winner == 1:
        a[-1] = a[-1] + distance
    if winner == 2:
        b[-1] = b[-1] + distance
    if winner == 3:
        c[-1] = c[-1] + distance

    if debugmode:
        printer(a)
        printer(b)
        printer(c)

    min_move = int((length - distance) / points * 0.5)
    max_move = int((length - distance) / points * 1.5) + distance
    if debugmode:
        print(min_move, max_move)


    #レース内容を現実に変換
    needed_rotation = goal / 2 / radius / math.pi * 360
    a_move = [needed_rotation / length * a[i] for i in range(points)]
    b_move = [needed_rotation / length * b[i] for i in range(points)]
    c_move = [needed_rotation / length * c[i] for i in range(points)]

    if debugmode:
        print(a_move)
        print(b_move)
        print(c_move)

    for i in range(points):
        ope = realize(a_move[i], b_move[i], c_move[i], mtr_min, mtr_max)

        code = "A" + str(ope[0]) + ";"
        mySerial.write(code.encode())
        if debugmode:
            print(code, end=" ")
        code = "B" + str(ope[1]) + ";"
        mySerial.write(code.encode())
        if debugmode:
            print(code, end=" ")
        code = "C" + str(ope[2]) + ";"
        mySerial.write(code.encode())
        if debugmode:
            print(code, end=" ")
            print(ope[3])
        time.sleep(ope[3])

    mySerial.write("A0;".encode())
    mySerial.write("B0;".encode())
    mySerial.write("C0;".encode())

    time.sleep(10)
    mySerial.write("R;".encode())
    time.sleep(1)
    mySerial.write("A0;".encode())

    #シリアル通信を終了
    mySerial.close()

    return winner