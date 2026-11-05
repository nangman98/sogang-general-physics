# 9-5 로켓

교재 Principles of Physics 12e, Chapter 9, Module 9.9 Systems with Varying Mass – A Rocket 화면이다. 중력이 없는 곳에서 연료를 일정하게 태우는 로켓의 속력이 질량 비의 로그만큼 늘어나는 것을 본다. 활동은 하나이고 재생 전에 예측하고 채점한다.

| 학생이 하는 일 | 교재 대응 |
|---|---|
| 처음 질량 *M*<sub>i</sub>, 연료를 다 태운 질량 *M*<sub>f</sub>, 연료 소모율 *R*, 배기 속력 *v*<sub>rel</sub>을 정한다. 처음 가속도와 연료를 다 태운 뒤 속력을 적는다 | Eq. (9.9.6), (9.9.7), Sample Problem 9.9.1, LO 9.9.1–9.9.3 |

## 모델

| 항목 | 내용 |
|---|---|
| 식 | 추력 *T* = *Rv*<sub>rel</sub> = *Ma*(식 9.9.6). *M*(*t*) = *M*<sub>i</sub> − *Rt*, *v*(*t*) = *v*<sub>rel</sub> ln(*M*<sub>i</sub>/*M*)(식 9.9.7), *x*(*t*) = (*v*<sub>rel</sub>/*R*)[(*M*<sub>i</sub> − *M*) − *M* ln(*M*<sub>i</sub>/*M*)]. 연소가 끝나면 등속으로 간다 |
| 재생 | 연소 시간 (*M*<sub>i</sub> − *M*<sub>f</sub>)/*R*와 그 뒤 20 s. 화면은 물리 시간 10 s를 1 s로 보인다(spec `timeScale` 10). 측정값의 시간은 물리 시간이다 |
| 가정 | 중력과 공기 저항이 없다. *R*과 *v*<sub>rel</sub>은 일정하다. *M*<sub>f</sub>는 0.15*M*<sub>i</sub> 이상, *M*<sub>i</sub> − 100 kg 이하로 막는다 |
| 채점 | 2% 또는 0.01 안이면 정답. 나중 질량으로 나눈 가속도, *R*을 빠뜨린 가속도, 상용로그, 질량 비에 비례한다고 본 값, ln을 빠뜨린 값을 따로 알려 준다 |
| 시험 | `model.test.js` 4개. Sample Problem 9.9.1(*T* = 6440 N, *a* = 7.6 m/s², *M*<sub>i</sub>*g* = 8330 N보다 작음), *Rv*<sub>rel</sub> = *Ma*와 *a* = d*v*/d*t*, *v* = d*x*/d*t*(중앙 차분), 연소 뒤 등속, 질량 비를 두 배로 하면 *v*<sub>rel</sub> ln 2가 더해짐, 채점, slider 전 범위 300조합 |

Sample Problem 값은 시험에만 쓰고 화면에는 쓰지 않는다. 영어 용어(rocket, thrust, rate of fuel consumption, relative speed, first rocket equation, second rocket equation)는 교재 `c09`에서 확인했다.

## 화면 요소

| 요소 | 내용 |
|---|---|
| 장면 | 카메라가 로켓을 따라간다. 로켓은 가운데에 있고 연소 중에만 불꽃(노랑)과 추력 화살표 *T⃗*(#D55E00, 길이 일정)가 보인다. 비치는 연료 통 안 주황 막대 길이가 남은 연료다 |
| 그래프 판 | 왼쪽 *v*–*t*(속도 색 #0072B2), 오른쪽 *M*–*t*(검정) |
| draw call | 33(headless Chrome 1280 × 900, 2026-11-05) |

Still open: 중력이 있는 곳에서 쏘아 올리는 경우(교재 Sample Problem 9.9.1의 추력과 *M*<sub>i</sub>*g* 비교)는 시험에만 넣고 화면에는 넣지 않았다.
