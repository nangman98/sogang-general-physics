# 7-1 일과 운동에너지

교재 Principles of Physics 12e, Chapter 7, Module 7.2 Work and Kinetic Energy 화면이다. 마찰 없는 바닥 위 상자에 일정한 힘이 한 일을 구하고 일–운동에너지 정리로 나중 상태를 예측한다. 활동은 둘이고 둘 다 재생 전에 예측하고 채점한다.

| 활동 | 학생이 하는 일 | 교재 대응 |
|---|---|---|
| 두 힘의 일 | 정지한 상자를 수평 아래로 미는 힘 *F*<sub>1</sub>(각 *θ*<sub>1</sub>)과 위로 당기는 힘 *F*<sub>2</sub>(각 *θ*<sub>2</sub>)가 변위 *d*만큼 옮긴다. 알짜 일 *W*와 나중 속력 *v*<sub>f</sub>를 적는다 | Eq. (7.1.1), (7.2.5), (7.2.8), Sample Problem 7.2.1의 배치, LO 7.2.1, 7.2.3, 7.2.4 |
| 단위 벡터로 일 | 처음 속력 *v*<sub>i</sub>로 미끄러지는 상자에 바람 힘 *F⃗* = *F*<sub>x</sub>î + *F*<sub>y</sub>ĵ가 작용한다. *W* = *F⃗*·*d⃗*와 나중 운동에너지 *K*<sub>f</sub>를 적는다 | Eq. (7.2.6), (7.2.9), Sample Problem 7.2.2의 배치, LO 7.2.2, 7.2.4 |

## 모델

| 항목 | 내용 |
|---|---|
| 두 힘의 일 | *W*<sub>1</sub> = *F*<sub>1</sub>*d* cos *θ*<sub>1</sub>, *W*<sub>2</sub> = *F*<sub>2</sub>*d* cos *θ*<sub>2</sub>, *W* = *W*<sub>1</sub> + *W*<sub>2</sub>. 중력과 수직항력은 변위에 수직이라 *W*<sub>g</sub> = *W*<sub>N</sub> = 0. *v*<sub>f</sub> = √(2*W*/*m*) |
| 단위 벡터로 일 | *d⃗* = *d* î이므로 *W* = *F*<sub>x</sub>*d*. *K*<sub>i</sub> = ½*mv*<sub>i</sub>², *K*<sub>f</sub> = *K*<sub>i</sub> + *W* |
| 운동 | 가속도 *a* = *F*<sub>x,net</sub>/*m*가 일정하다. 닫힌 식으로 매 시각 위치와 속력을 내고 *x* = *d*에서 멈춘다. 힘과 속력이 모두 0이면 움직이지 않고 3 s 동안 재생한다 |
| 가정 | 바닥에 마찰이 없다. 힘의 크기와 방향은 그대로다. 상자를 입자로 본다. *g* = 9.8 m/s² |
| slider 제한 | 당기는 힘은 *F*<sub>2</sub> sin *θ*<sub>2</sub> < 0.95(*mg* + *F*<sub>1</sub> sin *θ*<sub>1</sub>), 바람의 *F*<sub>y</sub>는 0.95 *mg* 이하로 막아 상자가 바닥에서 뜨지 않는다. *F*<sub>x</sub>는 *K*<sub>f</sub> ≥ 0이 되도록 −*K*<sub>i</sub>/*d* 이상으로 막는다 |
| 채점 | 2% 또는 0.01 안이면 정답. cos 대신 sin을 쓴 일, 힘의 크기를 그대로 곱한 일, 한 힘의 일만 쓴 값, ½이나 제곱근을 빠뜨린 *v*<sub>f</sub>, 힘의 크기 전체나 *F*<sub>y</sub>로 구한 일, 부호가 바뀐 일, *K*<sub>i</sub> − *W*, *K*<sub>i</sub>를 빠뜨린 *K*<sub>f</sub>를 따로 알려 준다 |
| 시험 | `model.test.js` 7개. Sample Problem 7.1.1(*K* = 2.0 × 10⁸ J), 7.2.1(*W*<sub>1</sub> = 88.33 J, *W*<sub>2</sub> = 65.11 J, *W* = 153 J, *v*<sub>f</sub> = 1.17 m/s), 7.2.2(*W* = −6.0 J, *K*<sub>f</sub> = 4.0 J), 매 시각의 일–운동에너지 정리, *W*<sub>g</sub> = *W*<sub>N</sub> = 0과 *F*<sub>y</sub> 무관, 채점, slider 전 범위 1000조합 |

Sample Problem 값은 시험에만 쓰고 화면에는 쓰지 않는다. Sample Problem 7.2.2는 상자가 −*x* 방향으로 간다. 시험은 *x*를 뒤집어 *d⃗* = (3.0 m)î, *F*<sub>x</sub> = −2.0 N으로 같은 일 −6.0 J을 대조했다. 영어 용어(work, kinetic energy, net work, work–kinetic energy theorem, displacement, unit-vector notation, frictionless)는 교재 `c07`에서 확인했다.

## 화면 요소

| 요소 | 내용 |
|---|---|
| 화살표 | 힘 #D55E00, 변위 *d⃗* #000000(측정대 앞쪽). 힘은 가장 큰 힘(중력 포함)이 1.6 m가 되게 그린다. 확인하면 가한 힘의 변위 방향 성분을 점선으로 그린다 |
| 그래프 판 | 간 거리 *x*에 따른 운동에너지 *K*, 운동에너지는 속도 색 #0072B2(05 §색의 색 공유). 확인하면 *K*<sub>i</sub>에 점선을 긋고 *W* = Δ*K* 값을 단다 |
| 예측 전 표시 | 일과 운동에너지 측정값은 "확인 뒤에 보인다"로 가린다 |
| 모형 | `core/forces3d.js`의 상자. 크기는 질량에 따라 커지지만 실제 비율은 아니다 |
| draw call | 두 힘의 일 43(확인 뒤 46), 단위 벡터로 일 41(확인 뒤 43)(headless Chrome 1280 × 900, 2026-11-05) |

Still open: 교재 7.3(중력이 하는 일)은 목차상 화면이 없다. 들어 올리고 내리는 일은 이 화면에 넣지 않았다.
