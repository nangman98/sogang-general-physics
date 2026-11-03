# 1-1 Length, Time, and Mass in SI Units

Screen for Principles of Physics 12e, Chapter 1, Modules 1.1–1.3 (Learning Objectives 1.1.1–1.1.4, 1.2.1–1.2.2, 1.3.1–1.3.2).

## Model

| Item | Content |
|---|---|
| Inputs | base quantity (length, time, mass) and the power of ten *n* |
| Prefix rule | largest SI prefix that is a multiple of 3 and not above the exponent, so the number in front is 1, 10, or 100. Prefixes for mass attach to the gram (10<sup>*n*</sup> kg = 10<sup>*n*+3</sup> g) |
| Prefix table | the 20 prefixes of textbook Table 1.1.2 (10<sup>24</sup> to 10<sup>−24</sup>). Values outside the table show "outside Table 1.1.2" |
| Conversion | chain-link conversion written with factors equal to unity, as in textbook Eq. (1.1.6) |
| Integrator | none (no time evolution) |
| Tests | `model.test.js`, 6 tests (prefix table, length and mass prefixes, conversion text, closest reference, reference values against sources) |

## Reference values

Values are rounded to three significant figures. None is copied from the textbook tables.

| Object | Value used | Source value | Source |
|---|---|---|---|
| Proton charge radius | 8.41 × 10⁻¹⁶ m | 0.8414 fm | CODATA 2018, Rev. Mod. Phys. 93, 025010 (2021) |
| Bohr radius | 5.29 × 10⁻¹¹ m | 5.291 772 109 03 × 10⁻¹¹ m | CODATA 2018 |
| Helium–neon laser wavelength | 6.33 × 10⁻⁷ m | 632.8 nm | standard He–Ne line |
| Height of Mount Everest | 8.85 × 10³ m | 8848.86 m | China–Nepal joint survey, announced 2020-12-08 |
| Mean radius of Earth | 6.37 × 10⁶ m | 6371.0 km | IUGG mean radius, Moritz, J. Geodesy 74, 128 (2000) |
| Earth–Sun distance (1 au) | 1.50 × 10¹¹ m | 149 597 870 700 m (exact) | IAU 2012 Resolution B2 |
| Distance to Proxima Centauri | 4.02 × 10¹⁶ m | 1.302 pc | Gaia DR3 parallax 768.07 mas |
| One period of the cesium-133 clock radiation | 1.09 × 10⁻¹⁰ s | 1/9 192 631 770 s (exact) | SI Brochure, 9th ed. (BIPM 2019) |
| Light travel time over 1 m | 3.34 × 10⁻⁹ s | 1/299 792 458 s (exact) | SI Brochure, 9th ed. |
| Mean lifetime of the muon | 2.20 × 10⁻⁶ s | 2.196 981 1 μs | Particle Data Group 2022 |
| One minute, one day | 60 s, 86 400 s | exact | definition |
| One year (365.25 days) | 3.16 × 10⁷ s | 31 557 600 s | Julian year, IAU |
| Age of the universe | 4.35 × 10¹⁷ s | 13.787 Gyr | Planck 2018 results VI, A&A 641, A6 (2020) |
| Electron | 9.11 × 10⁻³¹ kg | 9.109 383 701 5 × 10⁻³¹ kg | CODATA 2018 |
| Atomic mass unit (1 u) | 1.66 × 10⁻²⁷ kg | 1.660 538 86 × 10⁻²⁷ kg | textbook Eq. (1.3.1) |
| Proton | 1.67 × 10⁻²⁷ kg | 1.672 621 923 69 × 10⁻²⁷ kg | CODATA 2018 |
| One liter of water | 1.00 kg | density 1.00 g/cm³ | textbook Module 1.3 |
| The Moon | 7.35 × 10²² kg | 7.346 × 10²² kg | NASA Moon Fact Sheet |
| Earth | 5.97 × 10²⁴ kg | 5.9722 × 10²⁴ kg | IAU 2015 Resolution B3 nominal GM with CODATA 2018 G |
| The Sun | 1.99 × 10³⁰ kg | 1.9884 × 10³⁰ kg | IAU 2015 Resolution B3 nominal GM with CODATA 2018 G |

## Known limits

The prefix shown is always a multiple of 3, so 10⁻² m appears as 10 mm rather than 1 cm. Both are correct. The textbook uses centimeter often.
