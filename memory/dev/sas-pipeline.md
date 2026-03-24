---
id: dev-sas-pipeline
scope: SAS statistical pipeline and PowerShell runners for SCANDAT ICU analysis
soul_tags:
  - Mechanism
  - Rigor
  - Reproducibility
  - Guardianship
  - Vigilance
  - Understanding
branch: dev
type: topic
last_updated: "2026-03-24"
---

# SAS Pipeline

## What to Know

Three SAS scripts form the statistical backbone of the dashboard, orchestrated by PowerShell runners. Script 1 computes descriptive statistics using PROC SORT, PROC MEANS, and PROC FREQ. Script 2 estimates transfusion effects on vital parameters using PROC MIXED with natural cubic spline terms and a change-from-baseline model. Script 3 estimates component and factor interaction effects using PROC MIXED with interaction terms and Type 3 tests. All scripts read source data from D:\Clinisoft, assign SAS libraries under an analysis/ directory tree, and write CSV output to analysis/script_data/. That CSV output is manually copied to public/data/ for the frontend. Key macro variables governing the analysis window are interval_minutes=60, min_time=-720, and max_time=720 (a 24-hour window centered on transfusion events). The PowerShell runner run_analysis.ps1 accepts -Dataset (sample or full) and -Script (1, 2, 3, or 0 for all) parameters.

## Understanding

### Script Architecture

**Script 1 (Descriptive Statistics)** produces summary tables characterizing the study population and transfusion events. It uses PROC SORT to order records by patient and event, PROC MEANS to compute continuous variable summaries (N, mean, median, SD, IQR, min, max), and PROC FREQ to tabulate categorical distributions. Output CSVs follow the naming pattern descriptive_*.csv and land in analysis/script_data/. This script runs fastest of the three since it performs no modeling.

**Script 2 (Transfusion Effects)** is the primary analytical script. It fits mixed-effects models via PROC MIXED to estimate how vital parameters change around transfusion events. The time axis is parameterized with natural cubic splines (knots placed at clinically meaningful intervals) to capture nonlinear trajectories. A change-from-baseline model subtracts each patient's baseline value, so the estimated curves represent deviations rather than absolute levels. Random intercepts account for within-patient correlation across repeated transfusions. Output CSVs use the naming convention VIZ_{VITAL}_RBC.csv for visualization data and STATS_{VITAL}_RBC.csv for tabular summaries.

**Script 3 (Component Factor Effects)** extends the mixed model with interaction terms between component/factor identifiers and the spline basis. Type 3 F-tests evaluate whether the trajectory differs by factor level (e.g., RBC storage age category, irradiation status). Output CSVs follow VIZ_{VITAL}_{FACTOR}.csv and STATS_{VITAL}_{FACTOR}.csv. This script takes the longest to run because it fits a separate interaction model for each vital-factor combination.

All three scripts begin with a common preamble: libname assignments, macro variable definitions, and a data preparation step that filters to the analysis cohort. Macro variables are defined at the top of each script rather than in a shared include file.

### Data Pipeline

The full data flow proceeds through several stages:

1. **Source**: Raw clinical monitoring data resides on D:\Clinisoft as SAS datasets (.sas7bdat). These are read-only and managed outside this project.
2. **SAS work libraries**: Each script creates intermediate datasets in its assigned library (analysis/script1_work/, script2_work/, script3_work/). These intermediates can reach GB scale for the full dataset.
3. **CSV export**: At the end of each script, PROC EXPORT writes final results to analysis/script_data/ as CSV files. File names encode the vital parameter and factor/component using uppercase codes matching the frontend's VITAL_PARAM_CODES and COMP_FACTOR_CODES constants.
4. **Manual copy**: A human copies the CSV files from analysis/script_data/ to public/data/ in the web project. This manual step is intentional: it provides a review checkpoint before clinical results reach the dashboard.
5. **Frontend ingestion**: dataService.ts fetches CSVs from public/data/, PapaParse parses them, and cache.ts stores the parsed results in memory.

The naming convention is critical. The frontend's viz_index.csv maps parameter codes to file names, and any mismatch between what the SAS scripts produce and what viz_index.csv expects will cause silent data-loading failures. Case matters: SAS output uses uppercase file stems, and the frontend expects those exact names.

### PowerShell Runners

**run_analysis.ps1** is the primary entry point. It accepts two parameters:
- `-Dataset`: either `sample` (a small subset for development) or `full` (the complete study cohort). This controls which source library path is assigned.
- `-Script`: `1`, `2`, `3`, or `0` (run all three sequentially). Each script is invoked via the SAS batch command with log output directed to analysis/logs/.

**kill_analysis.ps1** finds and terminates any running SAS processes. This is necessary because SAS batch processes can hang on lock files or consume excessive memory on the full dataset. The script identifies SAS processes by name and terminates them forcefully.

**monitor_analysis.ps1** tails the active SAS log file in real time, streaming output to the console. This is used during long-running Script 2 or Script 3 executions to watch for errors or convergence warnings without opening the log file manually.

All three PowerShell scripts assume SAS is installed and on the system PATH. They are located in the sas_code/ directory at the project root.

### Key Macro Variables

These macro variables control the analysis window and modeling parameters across all three scripts:

- **interval_minutes** (60): The time-bin width in minutes for aggregating vital-sign measurements. Each observation in the output represents a 60-minute average.
- **extension_minutes**: Additional time padding beyond the analysis window, used during data extraction to ensure edge bins are complete.
- **baseline_interval**: The time range before T=0 used to compute each patient's baseline value for the change model.
- **min_time** (-720): The earliest time point relative to transfusion (T=0), in minutes. -720 = 12 hours before.
- **max_time** (720): The latest time point, in minutes. 720 = 12 hours after.
- **LOESS_min** / **LOESS_max**: Smoothing bandwidth bounds for any exploratory LOESS fits used during development. Not used in the final PROC MIXED models but retained for diagnostic plots.

These values are hardcoded at the top of each script. Changing them requires editing all three scripts independently and re-running the pipeline.

### Critical Revision History

**December 2025 -- Script 2 confidence interval fix**: A significant correction addressed how confidence intervals were computed for the spline-based trajectory estimates. The original code used a pointwise approach that underestimated uncertainty at the spline knots. The fix replaced this with a proper simultaneous confidence band derived from the variance-covariance matrix of the fixed effects. This change affected all VIZ_*_RBC.csv files and is reflected in the current frontend visualizations.

**Trajectory-based change estimates in Script 3**: An architectural revision in Script 3 moved from a simple pre-post comparison to trajectory-based change estimates. Instead of comparing a single mean before vs. after transfusion, the model now estimates the full time-varying trajectory for each factor level, and the interaction terms capture how these trajectories diverge. This required restructuring the PROC MIXED model statement and the subsequent CSV export logic.

Both revisions changed the output CSV column structure, which required corresponding updates to the frontend's type definitions in data.ts and the prepareChartData transformation logic.

### Known Hazards

**Path dependencies**: All scripts hardcode D:\Clinisoft as the source data location. Running on a machine without this path mounted will fail immediately. The analysis/ output directory is also assumed to exist. There is no mkdir logic in the SAS scripts; the PowerShell runner should ensure directories exist before invocation but does not always do so reliably.

**Large intermediates**: Script 2 and Script 3 create intermediate SAS datasets that can exceed several GB on the full cohort. Disk space on the analysis drive must be monitored. If a script fails mid-run, these intermediates are not cleaned up automatically and can accumulate.

**SAS process management**: SAS batch processes do not always terminate cleanly on error. A failed PROC MIXED (e.g., due to non-convergence) can leave a SAS process consuming memory indefinitely. Use kill_analysis.ps1 to clean up before re-running. Check the log for "ERROR" and "WARNING: Did not converge" messages.

**Case sensitivity in CSV output**: SAS writes file names in the case specified by the PROC EXPORT statement. The frontend's viz_index.csv and dataService.ts expect specific casing. If a SAS script is edited and the OUTFILE path casing changes, the frontend will silently fail to load that dataset (the fetch returns 404, and fetchCSVWithFallback returns an empty array).

**No automated sync**: The manual copy from analysis/script_data/ to public/data/ is a deliberate safety gate, but it also means the dashboard can display stale results if the copy is forgotten after a re-analysis. There is no checksumming or version comparison between the two directories.
