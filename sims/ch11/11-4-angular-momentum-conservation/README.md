# 11-4 각운동량 보존

교재 Principles of Physics 12e, Chapter 11, Module 11.8 Conservation of Angular Momentum 화면이다. 회전 원판 위 물체가 지름을 따라 기어가며 계의 관성모멘트를 바꾼다. 학생은 재생 전에 나중 각속도와 회전 운동에너지의 비를 구하고 채점받는다.

| 활동 | 학생이 하는 일 | 교재 대응 |
|---|---|---|
| 원판 위 물체 | 원판 질량 *M*과 반지름 *R*, 물체 질량 *m*, 처음과 나중 거리 *r*<sub>i</sub>, *r*<sub>f</sub>, 처음 각속도 *ω*<sub>i</sub>를 정한다. *ω*<sub>f</sub>와 *K*<sub>f</sub>/*K*<sub>i</sub>를 적는다 | Eq. (11.7.6), (11.8.3), (10.4.4), Sample Problem 11.8.2, Checkpoint 11.8.1, LO 11.8.1 |

## 모델

| 항목 | 내용 |
|---|---|
| 관성모멘트 | *I* = ½*MR*² + *mr*²(원판은 Table 10.5.1c, 물체는 질점) |
| 보존 | *L* = *I*<sub>i</sub>*ω*<sub>i</sub>가 모든 순간 같고 *ω* = *L*/*I*(*r*). *K*<sub>f</sub>/*K*<sub>i</sub> = *I*<sub>i</sub>/*I*<sub>f</sub>(*K* = *L*²/2*I*) |
| 시간 | 물체는 1.5 s 동안 *r*<sub>i</sub>에 있고 3 s 동안 일정한 지름 방향 속력으로 *r*<sub>f</sub>까지 기어간 뒤 6 s까지 머문다. 돌아간 각은 ∫*L* d*t*/(*I*<sub>d</sub> + *mr*²)를 arctan 꼴로 닫힌 식으로 구했다 |
| 가정 | 축 마찰과 외부 돌림힘이 없다. 위에서 볼 때 시계 반대 방향 회전이 +다 |
| 채점 | 2% 또는 0.01 안이면 정답. 비를 거꾸로 쓴 *ω*<sub>i</sub>*I*<sub>f</sub>/*I*<sub>i</sub>, 그대로인 *ω*<sub>i</sub>, 원판을 뺀 *ω*<sub>i</sub>*r*<sub>i</sub>²/*r*<sub>f</sub>², 원판을 고리(*MR*²)로 둔 값, *K*가 보존된다는 1, 역수, 제곱을 따로 알려 준다 |
| 시험 | `model.test.js` 4개. Sample Problem 11.8.2(*I*<sub>i</sub> = 3.64*mR*², *I*<sub>f</sub> = 4.00*mR*², *ω*<sub>f</sub> = 1.365 rad/s, 교재는 1.37), 모든 순간 *L* 일정과 원판·물체 몫의 합, 돌아간 각의 닫힌 식과 사다리꼴 적분의 일치(상대 오차 10⁻⁸), 채점 |

Sample Problem 값은 시험에만 쓰고 화면에는 쓰지 않는다. Sample Problem 11.8.1(바퀴를 뒤집는 학생)은 다루지 않았다. 영어 용어(conservation of angular momentum, rotational inertia, angular speed, merry-go-round)는 교재 `c11`에서 확인했다.

## 화면 요소

| 요소 | 내용 |
|---|---|
| 장면 | 왼쪽에 받침 위 수평 원판, 오른쪽에 그래프 판. 어두운 홈이 물체가 기어가는 지름이고 흰 선은 돌아간 각을 보여 준다 |
| 화살표 | 계의 각운동량 *L*(#009E73)이 축 위에 길이 1.3 m로 서 있고 물체가 움직여도 그대로다 |
| 그래프 | 확인 뒤 *ω*(*t*)를 #0072B2(속도와 같은 색)로 그린다. 시간 표시선이 재생을 따라간다 |
| 예측 전 표시 | 각속도와 회전 운동에너지 측정값은 "확인 뒤에 보인다"로 가린다 |
| draw call | 28(headless Chrome 1280 × 900, 2026-11-05) |
