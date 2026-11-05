# 10-1 등각가속도 회전

교재 Principles of Physics 12e, Chapter 10, Module 10.2 Rotation with Constant Angular Acceleration과 Module 10.3 Relating the Linear and Angular Variables 화면이다. 고정축 둘레를 각가속도가 일정하게 도는 바퀴와 바퀴 위 한 점의 선속도·가속도를 본다. 활동은 둘이고 둘 다 재생 전에 예측하고 채점한다.

| 활동 | 학생이 하는 일 | 교재 대응 |
|---|---|---|
| 각속도와 회전각 | 처음 각속도 *ω*<sub>0</sub>, 각가속도 *α*, 묻는 시각 *t*<sub>1</sub>을 정한다. *t*<sub>1</sub>의 각속도와 회전한 바퀴 수를 적는다 | Eq. (10.2.1), (10.2.2), Table 10.2.1, Sample Problem 10.2.1, LO 10.2.1 |
| 선속도와 가속도 | 표시점 반지름 *r*도 정한다. *t*<sub>1</sub>에 표시점의 속력과 지름 방향 가속도를 적는다 | Eq. (10.3.2), (10.3.6), (10.3.7), Sample Problem 10.3.1의 관계, LO 10.3.1, 10.3.2 |

## 모델

| 항목 | 내용 |
|---|---|
| 회전 | *ω* = *ω*<sub>0</sub> + *αt*, *θ* − *θ*<sub>0</sub> = *ω*<sub>0</sub>*t* + ½*αt*². 시계 반대 방향이 +이고 *θ*<sub>0</sub> = 0 |
| 표시점 | *v* = *ωr*, *a*<sub>t</sub> = *αr*, *a*<sub>r</sub> = *ω*²*r*(라디안 단위). 바퀴 반지름은 1.2 m |
| 재생 | 묻는 시각 *t*<sub>1</sub>에서 멈춘다 |
| 채점 | 2% 또는 0.01 안이면 정답. 부호가 바뀐 *ω*, *ω*<sub>0</sub>를 빠뜨린 값, rad을 rev로 바꾸지 않은 값, ½을 빠뜨린 값, 나중 각속도에 시간을 곱한 값, *ω*/*r*, 2π를 곱한 속력, 접선 가속도나 전체 가속도, 제곱을 빠뜨린 *a*<sub>r</sub>을 따로 알려 준다. 속력은 크기로 채점한다 |
| 시험 | `model.test.js` 5개. Sample Problem 10.2.1(5.0 rev에 32 s, 13 s에 멈춤), 10.3.1(정지에서 *a*<sub>r</sub> = 2*a*<sub>t</sub>*θ*, 4*g*에서 *θ* = 1.94 rad = 111°), d*θ*/d*t* = *ω*, d*ω*/d*t* = *α*와 세 선형 관계, 채점, slider 전 범위 300조합 |

Sample Problem 값은 시험에만 쓰고 화면에는 쓰지 않는다. 영어 용어(angular velocity, angular acceleration, angular position, reference line, tangential component, radial component, radian measure)는 교재 `c10`에서 확인했다.

## 화면 요소

| 요소 | 내용 |
|---|---|
| 장면 | 측정대 위 받침대에 카메라를 향해 선 바퀴(축은 화면에 수직). 흰 기준선과 그 끝을 따라가는 이름표, 시계 반대 방향 표시 호 |
| 화살표 | 선속도와 가속도 활동에서 표시점의 속도 #0072B2(1 m/s당 0.8 m)와 접선·지름 가속도 #CC79A7(1 m/s²당 0.5 m) |
| 그래프 판 | *ω*–*t*, 재생은 *t*<sub>1</sub>까지 |
| 예측 전 표시 | 각속도·회전각, 표시점 속력·가속도 측정값은 "확인 뒤에 보인다"로 가린다 |
| draw call | 각속도와 회전각 35, 선속도와 가속도 42(headless Chrome 1280 × 900, 2026-11-05) |

Still open: 회전 운동에너지(10.4)와 일·일률(10.8)은 목차상 화면이 없다.
