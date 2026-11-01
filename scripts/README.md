# Publication figure renderer

This renderer currently targets the legacy result format. The revised SAS
handover is still provisional; do not pass revised files through this renderer
or treat its FULL-model default as a newly accepted reporting decision. Laptop
review and migration are tracked in `docs/LAPTOP_PUBLICATION_REVIEW_PLAN.txt`.

`make_publication_figure.py` is the maintained renderer for all seven fully adjusted absolute trajectories. It reads only the seven main `VIZ_*_TRANSFUSION.csv` model prediction grids and the endpoint point estimates in `model_based_summary.csv`. It does not read patient-level data or fit models.

Archived full-cohort outputs establish the trajectory provenance. Scientific methods remain under review, so the figures carry a small draft footer. Matching an archive does not establish model validity.

## Reproduce

The recorded environment uses Python 3.12.4, NumPy 1.26.4 and Matplotlib 3.8.4. Install the pinned dependencies with `python -m pip install -r scripts/requirements-figures.txt`, then run:

```text
python scripts/make_publication_figure.py
```

Outputs default to the ignored `manuscript/figures/consolidated/` directory. PNG resolution defaults to 600 dpi. Each run replaces the named outputs in its output directory; close open PDFs before regenerating. Use another repository-relative `--output-dir` to keep alternatives separate.

Three annotation modes are available:

```text
python scripts/make_publication_figure.py --annotations markers
python scripts/make_publication_figure.py --annotations changes --output-dir manuscript/figures/consolidated/with_changes
python scripts/make_publication_figure.py --annotations none --output-dir manuscript/figures/consolidated/without_markers
```

`markers` is the default and identifies the predictions at -1 and +1 hour. `changes` adds their descriptive difference, rounded to two decimals. Changes in FiO2 and SpO2 are in percentage points (pp), not relative percent. The renderer validates all seven endpoint pairs and differences against the summary's `Full_Pre`, `Full_Post` and `Full_Diff` fields. It never uses the summary's change standard errors or confidence limits.

## Outputs

- `figure_1_trajectories_one_page.pdf`, `.svg`, `.png`: seven panels and a key on one page.
- `figure_1_trajectories_two_pages.pdf`: cardiovascular and respiratory panels on separate pages.
- `figure_1_cardiovascular.pdf`, `.svg`, `.png` and `figure_1_respiratory.pdf`, `.svg`, `.png`: individual page exports.
- `figure_1_caption.txt`: caption plus a clearly separate author review note.
- `plotted_data.csv`: all 10,087 plotted rows, preserving the source strings for predictions, bounds and time in minutes, with an additional hours column.
- `figure_manifest.json`: input/output hashes, renderer hash, actual software versions, validation results, endpoint checks, axis specifications and settings. Paths are repository-relative.

PDF/SVG curves are vectors. Fonts are embedded in PDF; SVG text stays editable. Fixed metadata and SVG IDs support byte-identical repeated rendering in the same environment. Exact bytes may differ between software or font versions.

## Layout

The one-page figure is 180 x 216 mm. Each page of the two-page alternative is 180 x 158 mm. Place vector files at their native width to retain the intended text size: 8.7 pt panel titles, 7.5 pt tick labels and 7.2 pt key text.

All pressure panels share a 6 mmHg span, so equal vertical distances mean equal pressure changes. Their absolute limits differ: MAP 73-79, systolic 121.75-127.75, and diastolic 52.5-58.5 mmHg. Remaining parameters use native scales held constant across layouts. The renderer fails if a confidence band exceeds its panel bounds. It retains every exported minute value with straight connecting segments and no added smoothing. A restrained teal line, pale band, dashed transfusion marker and compact key are used throughout.

The prior figures and renderer are preserved in `manuscript/figures/comparison_before_consolidation_2026-10-01/`. The separate `manuscript/figure1/` implementation is retained as a historical design comparison; use this script for ongoing work.

## Interpretation and limits

Lines are predictions for a reference covariate profile (male, modal ward, other covariates set to their means), not predictions averaged across patients. The exported approximate 95% pointwise bands describe uncertainty in the predicted level under the fitted model. They are not simultaneous bands, individual prediction intervals or confidence intervals for change. Optional delta labels have no change interval or significance claim.

Validation checks the complete ordered -720 to +720 minute grid, finite values, units, metadata, interval ordering, the exported normal-approximation level bounds and agreement of endpoint estimates with the summary. It does not validate model assumptions, patient clustering, covariate definitions or analytical suitability. Resolve the scientific review before submission and before removing the draft notice. Keep private SAS intermediates and manuscript review material out of Git.

## Provisional handover inventory check

`inspect_analysis_handoff.py` reads only the fixed data-free documentation files
of checkpoint `20261101_v1`. Run it on an immutable copy of that directory:

```text
python scripts/inspect_analysis_handoff.py <checkpoint-directory>
python -m unittest discover -s scripts -p test_analysis_handoff.py
```

Exit 0 means only that the supported draft document inventory, hashes and selected
metadata are internally consistent. It does not validate the analysis, read
result files, certify privacy or authorize a full run/publication. Future or
completed checkpoint formats deliberately require an updated receiver. The
checker never follows the pending code, evidence or export paths in the documents.
