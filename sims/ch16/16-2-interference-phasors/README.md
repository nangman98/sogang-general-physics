# 16-2 파동의 간섭과 phasor

교재 Principles of Physics 12e, Chapter 16, Module 16.5 Interference of Waves, 16.6 Phasors 화면이다. 같은 방향으로 가는 두 사인파가 겹친 결과 파의 진폭과 위상 상수를 재생 전에 예측하고 채점한다. 진폭이 같으면 식 (16.5.7)로, 진폭이 다르면 phasor의 벡터 합으로 구한다. 활동은 둘이다.

| 활동 | 학생이 하는 일 | 교재 대응 |
|---|---|---|
| 같은 진폭 | 두 파의 진폭 *y*<sub>m</sub>과 위상차 *ϕ*(0–720°)를 정한다. 결과 파의 진폭 *y*′<sub>m</sub>을 적고 간섭의 종류(완전 보강, 완전 상쇄, 중간)를 고른다 | Eq. (16.5.1)–(16.5.7), Table 16.5.1, Sample Problem 16.5.1, LO 16.5.1–16.5.4 |
| phasor 합 | 두 진폭 *y*<sub>m1</sub>, *y*<sub>m2</sub>와 위상 상수 *ϕ*(0–360°)를 정한다. 결과 파의 진폭 *y*′<sub>m</sub>과 위상 상수 *β*를 적는다 | Eq. (16.6.1)–(16.6.3), Sample Problem 16.6.1, LO 16.6.1–16.6.3 |

## 모델

| 항목 | 내용 |
|---|---|
| 두 파 | *y*<sub>1</sub> = *y*<sub>m1</sub> sin(*kx* − *ωt*), *y*<sub>2</sub> = *y*<sub>m2</sub> sin(*kx* − *ωt* + *ϕ*), 줄의 변위 *y*′ = *y*<sub>1</sub> + *y*<sub>2</sub>(Eq. 16.5.1) |
| 같은 진폭 | *y*′<sub>m</sub> = \|2*y*<sub>m</sub> cos ½*ϕ*\|. \|cos ½*ϕ*\| = 1이면 완전 보강, 0이면 완전 상쇄, 그 밖은 중간 간섭(Table 16.5.1) |
| phasor | 길이 *y*<sub>m1</sub>, *y*<sub>m2</sub>인 벡터가 수평축에서 각 *kx* − *ωt*, *kx* − *ωt* + *ϕ*에 놓여 *ω*로 시계 방향으로 돈다. 세로축 위 투영이 그 점의 변위다. 합은 성분으로 *y*′<sub>mh</sub> = *y*<sub>m1</sub> + *y*<sub>m2</sub> cos *ϕ*, *y*′<sub>mv</sub> = *y*<sub>m2</sub> sin *ϕ*, *y*′<sub>m</sub> = √(*y*′<sub>mh</sub>² + *y*′<sub>mv</sub>²), *β* = atan2(*y*′<sub>mv</sub>, *y*′<sub>mh</sub>)(Sample Problem 16.6.1의 방법) |
| 그림 값 | 그림은 *λ* = 8.0 cm, *T* = 2.0 s로 그렸다. 답은 이 값과 관계없다. 교재에 두 파의 *λ*, *T* 수치가 없어 정한 값이다 |
| 범위 | 진폭 1.0–8.0 mm, 같은 진폭 활동의 *ϕ* = 0–720°(정수 파장을 버려도 같은 간섭임을 보도록), phasor 활동의 *ϕ* = 0–360°, 둘 다 5° 간격 |
| 채점 | 진폭은 2% 또는 0.01 안이면 정답. *β*는 360°를 더하거나 뺀 값도 받고 2% 또는 0.5° 안이면 정답이다. 진폭이 0이면 *β*는 묻지 않는다. 같은 진폭에서 cos *ϕ*(절반을 빠뜨림), 2*y*<sub>m</sub>, *y*<sub>m</sub>\|cos ½*ϕ*\|(2를 빠뜨림), 도 단위 각을 rad로 읽은 값을 따로 알려 준다. phasor에서 *y*<sub>m1</sub> + *y*<sub>m2</sub>, \|*y*<sub>m1</sub> − *y*<sub>m2</sub>\|, √(*y*<sub>m1</sub>² + *y*<sub>m2</sub>²), 같은 진폭 식을 쓴 (*y*<sub>m1</sub> + *y*<sub>m2</sub>)\|cos ½*ϕ*\|, *β* = *ϕ*/2, *ϕ*, *ϕ* − *β*, 수평 성분에서 *y*<sub>m2</sub> cos *ϕ*를 빠뜨린 각, rad로 적은 *β*를 따로 알려 준다. 기본값에서 정답과 각 실수 값은 2% 넘게 다르다 |
| 시험 | `model.test.js` 5개. Sample Problem 16.5.1(13 mm, 중간 간섭, ±2.636 rad와 ±0.42 파장에서 4.9 mm), Table 16.5.1의 여섯 줄, Sample Problem 16.6.1(5.50 mm, 2.60 mm, 6.1 mm, 0.44 rad), 모든 *x*에서 *y*<sub>1</sub> + *y*<sub>2</sub> = *y*′<sub>m</sub> sin(*kx* − *ωt* + *β*)와 phasor 투영이 *x* = 0의 변위와 같음, 진폭이 같을 때 phasor 합이 식 (16.5.7)과 *β* = *ϕ*/2를 줌, 채점 |

Sample Problem 값은 시험에만 쓰고 화면에는 쓰지 않는다. Table 16.5.1의 865° 줄은 모델이 0.601*y*<sub>m</sub>을 내고 교재는 0.60*y*<sub>m</sub>으로 적었다. 시험은 0.02*y*<sub>m</sub> 안을 받는다. 영어 용어(resultant wave, phase difference, phase constant, fully constructive interference, fully destructive interference, intermediate interference, phasor)는 교재 `c16`에서 확인했다.

## 화면 요소

| 요소 | 내용 |
|---|---|
| 장면 | 오른쪽은 *x* = 0–10 cm의 줄, 왼쪽은 *x* = 0의 phasor 그림(카메라를 향한 평면). 변위와 phasor는 *x* 축척의 2.5배(1 mm = 0.25 cm)로 그렸다. phasor 그림과 줄의 세로 축척이 같아 투영이 수평 점선으로 줄의 *x* = 0에 닿는다 |
| 선 모양 | 파동 1은 가는 실선, 파동 2는 점선, 실제 줄(결과 파)은 갈색 관이다. 변위와 phasor는 위치·변위라서 #000000, 투영 점선과 축은 회색 |
| 확인 뒤 | 실제 줄, 합 phasor와 그 투영 점선. phasor 활동은 phasor 1의 머리로 옮긴 흐린 phasor 2와 각 *β*를 더한다 |
| 예측 전 표시 | 줄의 변위, 결과 파의 진폭과 위상 상수를 "확인 뒤에 보인다"로 가린다. 실제 줄과 합 phasor도 확인 전에는 그리지 않는다 |
| draw call | 같은 진폭 14, phasor 합 17(확인 뒤 재생 중, headless Chrome 1280 × 900, 2026-11-05) |
