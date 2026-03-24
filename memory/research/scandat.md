---
id: scandat
scope: registry-and-data
soul_tags:
  - Understanding
  - Guardianship
  - Vigilance
  - Reproducibility
branch: research
type: topic
last_updated: "2026-03-24"
---

## What to Know

SCANDAT3-S is a Scandinavian vein-to-vein blood donor-recipient registry that links donor characteristics and component details to transfusion outcomes. For this study, SCANDAT3-S provides the donor/component side (donor Hb, sex, parity, storage duration, donation day-of-week) while Clinisoft, the ICU electronic health record system, provides the clinical side (vital signs, medications, fluid administration). The two sources were linked by the registry custodians using personal identification numbers before pseudonymization. The research team works only with pseudonymized data — no re-identification key is held. The study cohort spans 8 ICU wards across 4 hospitals in the Stockholm region, from January 2014 through November 2018, comprising 6,736 patients and their associated RBC transfusion episodes. Ethics approval was granted under reference 2021-04890. All data resides on a secure university workstation accessible only to authorized personnel.

## Understanding

### Database Structure

SCANDAT3-S is a successor to earlier SCANDAT registries (SCANDAT1, SCANDAT2) and represents the most comprehensive Scandinavian linkage of blood donation and transfusion records. The registry connects blood donors to recipients through component tracking — each blood component (red cells, platelets, plasma) carries a unique donation number that links it to a specific donation event and donor.

For this study, the relevant SCANDAT3-S data elements include:
- **Donation-level data**: donor hemoglobin at the time of donation, donor sex, donor parity (for female donors), day of week of donation, and donation date (used to calculate storage duration).
- **Component-level data**: component type (RBC), expiration date, irradiation status, and other processing details. Storage duration is derived as transfusion date minus donation date.
- **Transfusion-level data**: date and time of transfusion administration, recipient pseudonymized ID, and the hospital/ward where administration occurred.

Clinisoft is the Philips ICU clinical information system used across the 4 Stockholm hospitals. It records:
- **Vital signs**: heart rate, blood pressures (systolic, mean, diastolic arterial), SpO2, FiO2, minute ventilation — recorded at irregular but frequent intervals (typically every 1-15 minutes depending on the parameter and clinical situation).
- **Medications and fluids**: crystalloid volumes, vasopressor infusion rates, sedative administration — with time stamps.
- **Administrative data**: ICU admission and discharge times, ward identifiers.

The linkage was performed by the SCANDAT registry custodians prior to data delivery. Personal identification numbers (personnummer) were used for deterministic linkage, then replaced with study-specific pseudonyms. The pseudonymization is one-way from the research team's perspective — the re-identification key is held only by the registry custodian and is not accessible for research purposes.

### Variable Definitions

**Component factors** (5 exposure variables tested in interaction models):

1. **STORAGE_CAT** (storage duration): Categorized as short (<=14 days), medium (15-28 days), or long (>28 days). Derived from the difference between transfusion date and donation date. Reflects concern about the "storage lesion" — biochemical changes in stored red cells.

2. **DONORSEX** (donor sex): Male or female. Motivated by reports linking recipient outcomes to donor sex, particularly in the context of TRALI (transfusion-related acute lung injury) and immune-mediated effects.

3. **DONORPARITY** (donor parity): Nulliparous (0 pregnancies) vs. parous (>=1 pregnancy), for female donors only. Parity induces HLA antibodies that may affect transfusion outcomes. Male donors are excluded from parity analyses.

4. **DONORHB_CAT** (donor hemoglobin): Categorized into tertiles based on sex-specific distributions. Low, medium, or high. Hypothesis: donor Hb may correlate with oxygen-carrying capacity of the donated unit.

5. **WDY_DONATION** (day of week of donation): Weekday (Monday-Friday) vs. weekend (Saturday-Sunday). Proxy for possible differences in donor hydration, rest, or processing logistics.

**Vital parameters** (7 outcome variables):

1. **HR**: Heart rate (beats per minute).
2. **SPO2**: Peripheral oxygen saturation (%).
3. **FIO2**: Fraction of inspired oxygen (%). Reflects ventilator/supplemental oxygen settings.
4. **VE**: Minute ventilation (liters per minute). Reflects respiratory demand/support.
5. **ARTS**: Arterial systolic blood pressure (mmHg).
6. **ARTM**: Mean arterial pressure (mmHg). Primary hemodynamic outcome.
7. **ARTD**: Arterial diastolic blood pressure (mmHg).

**TransfusionID**: Unique identifier for each transfusion episode, constructed as a composite of patient pseudonym, transfusion date-time, and component donation number. This serves as the unit of analysis in the mixed models and ensures that each observation window maps to exactly one transfusion event.

### Data Access and Ethics

The study was approved by the Swedish Ethical Review Authority under reference **2021-04890**. The approval covers linkage of SCANDAT3-S registry data with Clinisoft ICU records for the purpose of studying transfusion outcomes in ICU patients.

Key data governance provisions:
- **GDPR compliance**: The pseudonymization satisfies GDPR requirements for processing health data for research purposes under Swedish law. No direct identifiers are present in the research dataset.
- **No re-identification key**: The research team (Ekstrom, Edgren) does not hold and cannot access the linkage key. Re-identification would require the registry custodian's involvement and a separate ethical/legal authorization.
- **Storage**: All data resides on a dedicated university workstation at the Karolinska Institutet. Access is restricted to authorized project members. No data is stored on personal devices, cloud services, or shared drives outside the approved infrastructure.
- **Data sharing**: The pseudonymized dataset cannot be shared publicly due to ethical and legal restrictions. The dashboard and manuscript present only aggregate results. Individual-level data remains on the secure workstation.

### Study Population

The study population is drawn from 8 ICU wards across 4 hospitals in the Stockholm healthcare region:
- **Hospitals**: Karolinska University Hospital (Solna and Huddinge campuses), Danderyd Hospital, and Sodersjukhuset (South General Hospital). These represent a mix of university-affiliated tertiary centers and large community hospitals.
- **Time period**: January 2014 through November 2018. This window was determined by the availability of linked Clinisoft and SCANDAT3-S data.
- **Inclusion criteria**: Adult patients (>=18 years) admitted to a participating ICU who received at least one RBC transfusion during their ICU stay and had vital sign recordings in the peri-transfusion observation window (typically +/- 660 minutes around transfusion start).
- **Final cohort**: 6,736 unique patients contributing multiple transfusion episodes. The exact number of transfusion episodes is larger (patients may receive multiple transfusions during a single ICU stay or across readmissions).
- **Unit of analysis**: The transfusion episode (TransfusionID), not the patient. Mixed models with random intercepts for patient account for the within-patient correlation.

### Known Limitations

**Missing data patterns**:
- Vital signs are recorded at irregular intervals. Some parameters (e.g., arterial blood pressure) require invasive monitoring and are missing entirely for patients without arterial lines.
- FiO2 and minute ventilation are only available for mechanically ventilated patients, creating a selected subpopulation for those outcomes.
- Medication administration times may have entry lag — the recorded time may not precisely reflect when the drug reached the patient.

**Sample vs. full dataset**:
- The dashboard and some development analyses used a sample dataset for performance and iteration speed. Results reported in the manuscript use the full linked dataset. Differences between sample and full results are expected due to sampling variability.

**Time-stamp precision**:
- Clinisoft records vital signs with minute-level precision, but the actual measurement time may differ by seconds to minutes depending on nursing workflow and monitoring configuration.
- Transfusion start times from SCANDAT3-S are recorded at the administration level. The exact moment blood enters the patient may lag the recorded start time by minutes (line priming, bedside verification).
- These precision issues introduce measurement error in the time axis, which the spline model smooths over but cannot fully correct.
