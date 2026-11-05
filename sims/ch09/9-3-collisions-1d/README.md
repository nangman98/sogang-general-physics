# 9-3 1차원 충돌

교재 Principles of Physics 12e, Chapter 9, Module 9.6 Momentum and Kinetic Energy in Collisions와 Module 9.7 Elastic Collisions in One Dimension 화면이다. 공기 트랙 위 두 수레가 부딪힌다. 활동은 둘이고 둘 다 재생 전에 예측하고 채점한다.

| 활동 | 학생이 하는 일 | 교재 대응 |
|---|---|---|
| 탄성 충돌 | 두 수레의 질량과 처음 속도를 정한다. 충돌 뒤 두 속도를 적는다 | Eq. (9.6.2), (9.7.10)–(9.7.15), Sample Problem 9.7.1, LO 9.7.1 |
| 완전 비탄성 충돌 | 같은 조절로 붙은 뒤 속도 *V*와 줄어든 운동에너지를 적는다 | Eq. (9.6.2)–(9.6.7), Sample Problem 9.6.1, LO 9.6.1–9.6.4 |

## 모델

| 항목 | 내용 |
|---|---|
| 운동량 | *m*<sub>1</sub>*v*<sub>1i</sub> + *m*<sub>2</sub>*v*<sub>2i</sub> = *m*<sub>1</sub>*v*<sub>1f</sub> + *m*<sub>2</sub>*v*<sub>2f</sub>(식 9.6.2) |
| 탄성 | 운동에너지도 보존. *v*<sub>1f</sub> = [(*m*<sub>1</sub> − *m*<sub>2</sub>)*v*<sub>1i</sub> + 2*m*<sub>2</sub>*v*<sub>2i</sub>]/*M*, *v*<sub>2f</sub> = [2*m*<sub>1</sub>*v*<sub>1i</sub> + (*m*<sub>2</sub> − *m*<sub>1</sub>)*v*<sub>2i</sub>]/*M*(식 9.7.14, 9.7.15) |
| 완전 비탄성 | 붙어서 *V* = (*m*<sub>1</sub>*v*<sub>1i</sub> + *m*<sub>2</sub>*v*<sub>2i</sub>)/*M* |
| 운동 | 수레 길이 0.5 m, 처음 중심 −2.6 m와 0.6 m. 두 수레가 닿는 시각에 속도가 바뀌고 그 사이는 등속이다. 충돌 뒤 2.5 s(또는 수레가 트랙 끝 6.6 m에 닿을 때)까지 재생한다. 질량중심은 *v*<sub>com</sub> = *P*/*M*으로 곧게 간다(식 9.6.6) |
| slider 제한 | *v*<sub>1i</sub>는 0–3 m/s, *v*<sub>2i</sub>는 *v*<sub>1i</sub> − 0.5와 0.67*v*<sub>1i</sub> 이하로 막아 따라잡아 트랙 안에서 부딪힌다 |
| 채점 | 2% 또는 0.01 안이면 정답. 부호만 틀린 값, 질량이 같을 때처럼 속도를 맞바꾼 값, 붙는 충돌의 속도, 수레 2 운동량을 빠뜨린 *V*, 단순 평균, 운동에너지가 줄지 않는다는 답을 따로 알려 준다 |
| 시험 | `model.test.js` 6개. Sample Problem 9.6.1(*V* = 0, 승객 80 kg이면 *V* = 0.694 m/s, Δ*v*<sub>1</sub> = −24.3 m/s, Δ*v*<sub>2</sub> = +25.7 m/s), 9.7.1(*v*<sub>1f</sub> = −5.0 m/s, *v*<sub>2f</sub> = 5.0 m/s, 다음 충돌에서 블록 2 정지), 운동량·운동에너지 보존과 상대 속도 반전, 같은 질량·무거운 표적·무거운 발사체의 극한(식 9.7.8, 9.7.9), 질량중심 등속과 충돌 순간 접촉, 채점, slider 전 범위 500조합 |

Sample Problem 값은 시험에만 쓰고 화면에는 쓰지 않는다. 영어 용어(elastic collision, inelastic collision, completely inelastic collision, linear momentum, center of mass, closed isolated system)는 교재 `c09`에서 확인했다.

## 화면 요소

| 요소 | 내용 |
|---|---|
| 장면 | 측정대 위 공기 트랙, 질량에 따라 높이가 다른 두 수레(실제 비율이 아님), 트랙 위 질량중심 표시(⊕), 속도 화살표 #0072B2(1 m/s당 0.5 m) |
| 그래프 판 | *x*–*t*. 수레 1 실선, 수레 2 점선, 질량중심 회색 점선, 충돌 시각 세로선. 세로 범위는 그 재생에서 수레가 지나는 범위에 맞춘다 |
| draw call | 탄성 56–58, 완전 비탄성 54–56(headless Chrome 1280 × 900, 2026-11-05) |

Still open: 부분 비탄성 충돌(반발 정도를 조절)은 교재 9.6에 식이 없어 넣지 않았다.
