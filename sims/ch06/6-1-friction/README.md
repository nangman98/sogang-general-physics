# 6-1 마찰

교재 Principles of Physics 12e, Chapter 6, Module 6.1 Friction 화면이다. 활동은 셋이고 모두 재생 전에 값을 예측하고 채점한다.

| 활동 | 학생이 하는 일 | 교재 대응 |
|---|---|---|
| 힘 늘리기 | 수평으로 당기는 힘 *F*가 1 s마다 10 N씩 커진다. 블록이 미끄러지기 시작할 때의 *F*와 그 뒤 마찰력 *f*를 적고 재생한다. 뒤 그래프 판에 *F*(점선)와 *f*(실선)가 그려진다 | Eq. (6.1.1), (6.1.2), Fig. 6.1.1, LO 6.1.1, 6.1.2 |
| 비스듬한 힘 | 수평 아래쪽으로 미는 힘이나 위쪽으로 당기는 힘의 크기 *F*와 각 *θ*를 정한다. 블록이 미끄러지는지 고르고 마찰력 크기를 적는다 | Eq. (6.1.1)–(6.1.7), Sample Problem 6.1.1의 배치, LO 6.1.2, 6.1.3 |
| 빗면 | 빗면 각 *θ*를 정한다. 임계각 *θ*<sub>c</sub>와 지금 각에서 가속도 크기 *a*를 적는다 | Eq. (6.1.1), (6.1.2), Sample Problem 6.1.2의 자유물체도, LO 6.1.3 |

## 모델

| 항목 | 내용 |
|---|---|
| 힘 늘리기 | *F* = (10 N/s)*t*. *F* ≤ *μ*<sub>s</sub>*mg*이면 *f* = *F*, 블록 정지. 그 뒤 *f* = *μ*<sub>k</sub>*mg*, *ma* = *F* − *f*. 미끄러지기 시작한 시각 *t*<sub>b</sub>부터 *τ* = *t* − *t*<sub>b</sub>로 *v* = (*μ*<sub>s</sub> − *μ*<sub>k</sub>)*gτ* + (10 N/s)*τ*²/(2*m*), *x* = (*μ*<sub>s</sub> − *μ*<sub>k</sub>)*gτ*²/2 + (10 N/s)*τ*³/(6*m*) |
| 비스듬한 힘 | 밀기 *F*<sub>N</sub> = *mg* + *F* sin *θ*(식 6.1.5), 당기기 *F*<sub>N</sub> = *mg* − *F* sin *θ*. *F* cos *θ* > *μ*<sub>s</sub>*F*<sub>N</sub>일 때만 미끄러지고(교재 property 2의 "exceeds") 그때 *f* = *μ*<sub>k</sub>*F*<sub>N</sub>, *a* = (*F* cos *θ* − *f*)/*m*. 아니면 *f* = *F* cos *θ* |
| 빗면 | *F*<sub>N</sub> = *mg* cos *θ*. tan *θ* > *μ*<sub>s</sub>이면 미끄러지고 *a* = *g*(sin *θ* − *μ*<sub>k</sub> cos *θ*), 아니면 *f* = *mg* sin *θ*. 임계각 tan *θ*<sub>c</sub> = *μ*<sub>s</sub> |
| 가정 | 마른 두 면 사이의 마찰이다. *μ*<sub>k</sub>는 속력과 무관하다(교재 6.1 본문). *μ*<sub>k</sub> ≤ *μ*<sub>s</sub>는 slider 범위로 강제한다. 블록은 정지에서 출발하고 *g* = 9.8 m/s²다. 당기기는 *F* sin *θ* < 0.95 *mg*로 제한해 블록이 바닥에서 뜨지 않는다 |
| 재생 | 닫힌 식으로 매 시각 값을 낸다. 블록이 2.5 m 미끄러지면 멈춘다. 정지해 있으면 4 s 동안 재생한다. 재생 속도 1×로 시작한다 |
| 채점 | 힘·가속도는 2% 또는 0.01 안, 각은 0.5° 안이면 정답. 따로 알려 주는 실수는 미끄러질 때의 힘을 *μ*<sub>k</sub>*mg*나 *mg*로 쓴 것, 미끄러진 뒤 마찰력을 *μ*<sub>s</sub>*mg*로 쓴 것, 정지해 있는데 마찰력을 *μ*<sub>s</sub>*F*<sub>N</sub>이나 *μ*<sub>k</sub>*F*<sub>N</sub>로 쓴 것, *F*<sub>N</sub> = *mg*로 계산한 것, 임계각을 sin⁻¹·cos⁻¹로 구한 것, 가속도에서 마찰을 빼지 않거나 *μ*<sub>s</sub>를 쓴 것이다 |
| 시험 | `model.test.js` 8개. Sample Problem 6.1.1(*F*<sub>x</sub> = 10.39 N, *f*<sub>s,max</sub> = 59.08 N, *f*<sub>s</sub> = 10.4 N, 식 6.1.3–6.1.7), 6.1.2(*a* = 2.7 m/s²), 6.1.3(*v*<sub>0</sub> = 58 m/s = 210 km/h), 힘 늘리기의 마찰력 전환과 적분 일치, 밀기·당기기의 *F*<sub>N</sub>, 임계각과 질량 무관, 채점, slider 전 범위 300조합 |

Sample Problem 값은 시험에만 쓰고 화면에는 쓰지 않는다. Sample Problem 6.1.2의 추출문에는 답이 "− 2.7 m/s²"로 찍혀 있으나 *x*축이 빗면 아래쪽이라 식의 값은 +2.66 m/s²다. 시험은 크기 2.7 m/s²로 대조했다. 영어 용어(frictional force, static frictional force, kinetic frictional force, coefficient of static friction, coefficient of kinetic friction, normal force, breaks away, applied force, free-body diagram)는 교재 `c06`에서 확인했다.

## 화면 요소

| 요소 | 내용 |
|---|---|
| 힘 화살표 | 색은 모두 #D55E00이고 *F⃗*, *f⃗*, *F⃗<sub>N</sub>*, *F⃗*<sub>g</sub> 글자로 구분한다. 마찰력은 블록 바닥면에 그린다(교재 Fig. 6.1.1) |
| 그래프 판 | 힘 늘리기에만 있다. *F*는 점선, *f*는 실선이고 둘 다 힘 색이다. 확인하면 최대 정지 마찰력 점에 고리와 값을 단다 |
| 자유물체도 | 비스듬한 힘과 빗면에 있다. 빗면은 *x*축을 빗면 아래쪽으로 기울인다(교재 Fig. 6.1.4b). 점선은 힘의 성분이다 |
| 예측 전 표시 | 구할 마찰력 *f⃗*는 확인 전까지 회색 고정 길이(1 m)와 "= ?"로 그린다. 수직항력·마찰력·가속도 측정값은 "확인 뒤에 보인다"로 가린다 |
| 임계각 | 빗면 활동에서 확인하면 *θ*<sub>c</sub> 기울기의 점선을 빗면 앞면에 겹쳐 그린다 |
| 화살표 축척 | 한 번의 재생에서 가장 큰 힘이 1.6 m가 되게 정하고(`model.js` `forceScale`) 화면 아래에 값을 적는다. 가속도는 1 m/s²당 0.3 m |
| 공통 틀 밖 부품 | `core/forces3d.js`(5-2 `forces3d.js`를 복사), `index.html`의 `.world-label.qty`와 `.quiz .pred` 글자 규칙(5장과 같다) |
| draw call | 힘 늘리기 39(확인 뒤 46), 비스듬한 힘 41, 빗면 41(headless Chrome 1280 × 900, 2026-11-05) |

Still open: 교재 Fig. 6.1.1g처럼 미끄러진 뒤 *F*를 줄여 등속으로 끄는 과정은 넣지 않았다.
