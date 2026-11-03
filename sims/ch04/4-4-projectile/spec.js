// Screen texts for 4.4. English terms follow Principles of Physics 12e, Module 4.4.
import { tuple } from '../../../core/format.js';

export const spec = {
  id: '4-2',
  course: 'General Physics I',
  chapter: 4,
  chapterTitle: 'Motion in Two and Three Dimensions',
  module: '4.4',
  title: 'Projectile Motion',
  sceneTitle: 'Projectile motion',
  dt: 1 / 240,
  assumptions: [
    'No air resistance',
    'Free-fall acceleration <i>g</i> = 9.8 m/s², downward',
    'Launch and landing at the same height, <i>y</i><sub>0</sub> = 0',
    'The ball is a particle at its center',
  ],
  equations: [
    { html: '<i>x</i> − <i>x</i><sub>0</sub> = (<i>v</i><sub>0</sub> cos <i>θ</i><sub>0</sub>)<i>t</i>', no: '4.4.3' },
    { html: '<i>y</i> − <i>y</i><sub>0</sub> = (<i>v</i><sub>0</sub> sin <i>θ</i><sub>0</sub>)<i>t</i> − ½<i>gt</i>²', no: '4.4.4' },
    { html: '<i>v<sub>y</sub></i> = <i>v</i><sub>0</sub> sin <i>θ</i><sub>0</sub> − <i>gt</i>', no: '4.4.5' },
    { html: '<i>R</i> = (<i>v</i><sub>0</sub>²/<i>g</i>) sin 2<i>θ</i><sub>0</sub>', no: '4.4.8' },
  ],
  readouts: [
    { id: 'pos', label: 'Position (<i>x</i>, <i>y</i>, <i>z</i>) (m)', value: o => tuple(o.position_m, { zero: 1e-9 }) },
    { id: 'vel', label: 'Velocity (<i>v<sub>x</sub></i>, <i>v<sub>y</sub></i>, <i>v<sub>z</sub></i>) (m/s)', value: o => tuple(o.velocity_m_s, { zero: 1e-9 }) },
    { id: 'range', label: 'Horizontal range <i>R</i> (m)', value: (o, p, f) => f(o.range_m) },
    { id: 'flight', label: 'Flight time (s)', value: (o, p, f) => f(o.flightTime_s) },
  ],
  belowNote: 'The <i>y</i> axis points up, so <i>y</i> is the height above the launch point. With the launch plane turned (<i>φ</i> ≠ 0), Eq. 4.4.3 gives the horizontal distance along the launch direction.',
  objectives: 'Principles of Physics 12e, Module 4.4 Projectile Motion, Learning Objectives 4.4.1–4.4.3. Equation numbers on this page are the textbook numbers.',
};
