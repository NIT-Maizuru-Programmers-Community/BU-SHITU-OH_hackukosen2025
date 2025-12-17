import serial
import time
import bushituoh
import random
import math

#パラメータ
length = 100  #試合情報の長さ
distance = 10  #試合情報のゴールした際の1位とその他の差
points = 10  #試合情報の途中経過地点生成数
radius = 32.5  #現実の回る部分の半径
goal = 508  #現実のスタートからゴールまでの距離
mtr_min = 10  #モータの最低速度
mtr_max = 95  #モータの最高速度


#シリアル通信を開始
mySerial = serial.Serial("COM7", baudrate=115200, timeout=2)
time.sleep(2)


#レース内容を生成
a = bushituoh.generate(length - distance, points)
b = bushituoh.generate(length - distance, points)
c = bushituoh.generate(length - distance, points)

winner = random.randint(1, 3)
if winner == 1:
    a[-1] = a[-1] + distance
if winner == 2:
    b[-1] = b[-1] + distance
if winner == 3:
    c[-1] = c[-1] + distance

bushituoh.printer(a)
bushituoh.printer(b)
bushituoh.printer(c)

min_move = int((length - distance) / points * 0.5)
max_move = int((length - distance) / points * 1.5) + distance
print(min_move, max_move)


#レース内容を現実に変換
needed_rotation = goal / 2 / radius / math.pi * 360
a_move = [needed_rotation / length * a[i] for i in range(points)]
b_move = [needed_rotation / length * b[i] for i in range(points)]
c_move = [needed_rotation / length * c[i] for i in range(points)]

print(a_move)
print(b_move)
print(c_move)

debuga = 0
debugb = 0
debugc = 0

for i in range(points):
    ope = bushituoh.realize(a_move[i], b_move[i], c_move[i], mtr_min, mtr_max)

    code = "A" + str(ope[0]) + ";"
    debuga += ope[0]/360*ope[3]*2*math.pi*radius
    mySerial.write(code.encode())
    print(code, end=" ")
    code = "B" + str(ope[1]) + ";"
    debugb += ope[1]/360*ope[3]*2*math.pi*radius
    mySerial.write(code.encode())
    print(code, end=" ")
    code = "C" + str(ope[2]) + ";"
    debugc += ope[2]/360*ope[3]*2*math.pi*radius
    mySerial.write(code.encode())
    print(code, end=" ")
    print(ope[3])
    time.sleep(ope[3])

print(debuga, debugb, debugc)

mySerial.write("A0;".encode())
mySerial.write("B0;".encode())
mySerial.write("C0;".encode())

time.sleep(10)
mySerial.write("R;".encode())

#シリアル通信を終了
mySerial.close()