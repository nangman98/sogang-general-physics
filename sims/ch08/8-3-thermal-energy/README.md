# 8-3 마찰과 열에너지

교재 Principles of Physics 12e, Chapter 8, Module 8.4 Work Done on a System by an External Force와 Module 8.5 Conservation of Energy 화면이다. 운동 마찰이 역학적 에너지를 열에너지로 바꾸는 것을 에너지 막대로 본다. 활동은 둘이고 둘 다 재생 전에 예측하고 채점한다.

| 활동 | 학생이 하는 일 | 교재 대응 |
|---|---|---|
| 끌기 | 질량 *m*, 운동 마찰 계수 *μ*<sub>k</sub>, 끄는 힘 *F*, 거리 *d*, 처음 속력 *v*<sub>0</sub>을 정한다. 늘어난 열에너지와 나중 운동에너지를 적는다 | Eq. (8.4.5), (8.4.7), (8.4.8), Sample Problem 8.4.1, LO 8.4.1, 8.4.2 |
| 경사로와 바닥 | 높이 *H*, 경사각 *θ*, *μ*<sub>k</sub>를 정한다. 블록이 경사면을 미끄러져 내려온 뒤 바닥에서 가는 거리 *d*를 적는다. 그리고 멈췄을 때 열에너지가 *mgH*와 어떤지 고른다 | Eq. (8.4.7), (8.5.8), Sample Problem 8.5.2의 배치, LO 8.5.1–8.5.3 |

## 모델

| 항목 | 내용 |
|---|---|
| 끌기 | *f*<sub>k</sub> = *μ*<sub>k</sub>*mg*, *a* = (*F* − *f*<sub>k</sub>)/*m*. *W* = *Fd*, Δ*E*<sub>th</sub> = *f*<sub>k</sub>*d*(식 8.4.7), *K*<sub>f</sub> = *K*<sub>i</sub> + *W* − Δ*E*<sub>th</sub>(식 8.4.5). *F*는 *f*<sub>k</sub> 이상으로 막아 블록이 멈추지 않는다 |
| 경사로와 바닥 | 경사면 *a*<sub>1</sub> = *g*(sin *θ* − *μ*<sub>k</sub> cos *θ*), 바닥 감속 *μ*<sub>k</sub>*g*. 경사면 아래 끝에서 속력이 그대로 이어진다. 바닥 거리 *d* = *H*(1/*μ*<sub>k</sub> − 1/tan *θ*)(식 8.5.8). 고립계라 *U* + *K* + Δ*E*<sub>th</sub> = *mgH*가 매 순간 그대로다. *θ*는 tan *θ* > *μ*<sub>k</sub>가 되도록 tan⁻¹ *μ*<sub>k</sub> + 3° 이상으로 막는다 |
| 운동 | 두 활동 모두 가속도가 일정한 구간의 닫힌 식으로 매 시각 위치와 속력을 낸다 |
| 가정 | 블록을 입자로 본다. 공기 저항이 없다. *g* = 9.8 m/s². *μ*<sub>k</sub>는 0.20–0.80 |
| 채점 | 2% 또는 0.01 안이면 정답. 열에너지 대신 *Fd*나 *μ*<sub>k</sub>*d*, 마찰이나 *K*<sub>i</sub>를 빠뜨린 *K*<sub>f</sub>, 경사면 마찰을 빠뜨린 *H*/*μ*<sub>k</sub>, 부호가 바뀐 항, 뒤집은 비를 따로 알려 준다. 열에너지 비교는 "같다"가 정답이다 |
| 시험 | `model.test.js` 7개. Sample Problem 8.4.1(일정한 속력으로 2 min, *W* = Δ*E*<sub>th</sub> = 1.8 × 10⁶ J, 10 km면 3.9 × 10⁸ J), 8.5.1(Δ*E*<sub>th</sub> = 30 J), 8.5.2(*d*/*H* = 0.67, *d*/*H* = 20이면 *μ*<sub>k</sub> ≈ 0.05), 경사로의 에너지 합과 멈춘 거리, 끌기의 *Fx* = Δ*K* + Δ*E*<sub>th</sub>, 채점, slider 전 범위 400조합 |

Sample Problem 값은 시험에만 쓰고 화면에는 쓰지 않는다. 영어 용어(thermal energy, kinetic frictional force, external force, work done on a system, conservation of energy, isolated system)는 교재 `c08`에서 확인했다.

## 화면 요소

| 요소 | 내용 |
|---|---|
| 에너지 막대 | `core/bars3d.js`. 끌기는 *W*(테두리만), Δ*K*(하늘), Δ*E*<sub>th</sub>(노랑). 경사로는 *U*(주황), *K*(하늘), Δ*E*<sub>th</sub>(노랑), 합(테두리만). 세로축 위는 처음 에너지의 1.35배다 |
| 힘 화살표 | 끌기에서 *F⃗*, *f⃗*<sub>k</sub>(블록 바닥), *F⃗<sub>N</sub>*, *F⃗*<sub>g</sub>, #D55E00. 가장 큰 힘이 1.6 m다 |
| 확인 뒤 표시 | 경사로에서 블록이 멈추는 곳에 막대와 거리 이름표를 단다 |
| draw call | 끌기 42, 경사로 33(headless Chrome 1280 × 900, 2026-11-05) |

Still open: 경사면과 바닥이 만나는 곳의 곡면은 그리지 않았다. 속력이 그대로 이어진다고만 두었다.
