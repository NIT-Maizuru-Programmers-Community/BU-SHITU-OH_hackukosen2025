import random

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