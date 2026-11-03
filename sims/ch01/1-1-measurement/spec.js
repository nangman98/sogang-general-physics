// Screen texts for 1-1. English terms follow Principles of Physics 12e, Chapter 1 (Modules 1.1–1.3).
import { fmt } from '../../../core/format.js';

export const spec = {
  id: '1-1',
  course: 'General Physics I',
  chapter: 1,
  chapterTitle: 'Measurement',
  module: '1.1–1.3',
  title: 'Length, Time, and Mass in SI Units',
  sceneTitle: 'Powers of ten',
  headerNote: 'Principles of Physics 12e · Modules 1.1, 1.2, 1.3',
  assumptions: [
    'One step on the scale is a factor of 10',
    'SI prefixes from Table 1.1.2; prefixes for mass attach to the gram',
    'Reference values are rounded to three significant figures',
  ],
  equations: [
    { html: '1 m = distance light travels in vacuum in 1/299 792 458 s', no: '' },
    { html: '1 s = 9 192 631 770 oscillations of cesium-133 light', no: '' },
    { html: '1 u = 1.660 538 86 × 10<sup>−27</sup> kg', no: '1.3.1' },
  ],
  readouts: [
    { id: 'sci', label: 'Value', value: o => o.sci },
    { id: 'prefix', label: 'With an SI prefix', value: o => (o.prefixed ? `${o.prefixed}${o.prefixName ? ` <small>(${o.prefixName})</small>` : ''}` : 'outside Table 1.1.2') },
    { id: 'chain', label: 'Chain-link conversion', value: o => o.chain ?? '—' },
    { id: 'near', label: 'Closest reference', value: o => `${o.nearest.name}<br>${fmt(o.nearest.value, { sci: true })} ${o.unit}` },
  ],
  belowNote: 'Each factor in a chain-link conversion equals unity, so the quantity does not change. Only its unit does.',
  objectives: 'Principles of Physics 12e, Chapter 1 Measurement. Module 1.1 (Learning Objectives 1.1.1–1.1.4), Module 1.2 (1.2.1–1.2.2), Module 1.3 (1.3.1–1.3.2). Reference values and their sources are listed in the screen README.',
};
