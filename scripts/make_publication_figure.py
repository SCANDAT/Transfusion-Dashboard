"""Render draft manuscript trajectories using only aggregate SAS exports.

Run from any directory: python scripts/make_publication_figure.py
Requires Python 3.10+, numpy, and matplotlib. Never reads source patient data.
Full-cohort trajectory provenance is documented; scientific methods remain under review.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import platform
import sys
from statistics import NormalDist

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.lines import Line2D
from matplotlib.patches import Patch
from matplotlib.ticker import FormatStrFormatter
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
INPUT_DIR = ROOT / "public" / "data"
STATUS = "DRAFT - scientific methods under review"
COLOR, TEXT, MUTED, GRID = "#216A86", "#25323A", "#48565E", "#E5EBEE"
MM_PER_INCH = 25.4
FIGURE_WIDTH_MM = 180
AXIS_SPEC = {
    "ARTm": ((73, 79), (74, 76, 78), "%.0f"),
    "ARTs": ((121.75, 127.75), (122, 124, 126), "%.0f"),
    "ARTd": ((52.5, 58.5), (54, 56, 58), "%.0f"),
    "HR": ((85, 90), (86, 88, 90), "%.0f"),
    "FIO2": ((34.5, 39.5), (35, 37, 39), "%.0f"),
    "SPO2": ((95.15, 95.9), (95.2, 95.4, 95.6, 95.8), "%.1f"),
    "VE": ((13.25, 15.5), (13.5, 14.0, 14.5, 15.0, 15.5), "%.1f"),
}
PANELS = (
    ("ARTM", "ARTm", "A", "Mean arterial pressure", "mmHg"),
    ("ARTS", "ARTs", "B", "Systolic arterial pressure", "mmHg"),
    ("ARTD", "ARTd", "C", "Diastolic arterial pressure", "mmHg"),
    ("HR", "HR", "D", "Heart rate", "beats/min"),
    ("FIO2", "FIO2", "E", "Inspired oxygen fraction (FiO₂)", "%"),
    ("SPO2", "SPO2", "F", "Oxygen saturation (SpO₂)", "%"),
    ("VE", "VE", "G", "Minute ventilation", "L/min"),
)
NUMERIC_COLUMNS = ("TimeFromTransfusion", "PredVal_Full", "Lower_Full",
                   "Upper_Full", "StdErrVal_Full")
NORMAL_975 = NormalDist().inv_cdf(0.975)
CI_ABSOLUTE_TOLERANCE = 2e-7  # Native outcome units; tolerates SAS export rounding.
SUMMARY_ABSOLUTE_TOLERANCE = 1e-4  # Summary predictions have 5-7 significant digits.
REFERENCE_TIMES_MIN = (-60, 60)
SUMMARY_CODES = {"ARTm": "ARTm", "ARTs": "ARTs", "ARTd": "ARTd", "HR": "HR",
                 "FIO2": "FIO2(u)", "SPO2": "SpO2", "VE": "VE(u)"}


def relative(path: Path) -> str:
    """Keep machine-specific paths out of artifacts and console output."""
    return path.resolve().relative_to(ROOT).as_posix()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_and_validate() -> tuple[dict, list[dict]]:
    datasets, manifest_inputs = {}, []
    expected_time = np.arange(-720, 721, dtype=float)
    for file_code, code, letter, title, unit in PANELS:
        path = INPUT_DIR / f"VIZ_{file_code}_TRANSFUSION.csv"
        content = path.read_bytes()
        reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
        required = set(NUMERIC_COLUMNS) | {"VitalParam", "CompFactor", "YLabel"}
        missing = required.difference(reader.fieldnames or [])
        if missing:
            raise ValueError(f"{relative(path)}: missing columns {sorted(missing)}")
        rows = list(reader)
        if len(rows) != len(expected_time):
            raise ValueError(f"{relative(path)}: expected 1,441 rows, got {len(rows)}")
        values = {}
        for column in NUMERIC_COLUMNS:
            try:
                values[column] = np.array([float(row[column]) for row in rows])
            except (ValueError, TypeError) as exc:
                raise ValueError(f"{relative(path)}: nonnumeric {column}") from exc
            if not np.isfinite(values[column]).all():
                raise ValueError(f"{relative(path)}: nonfinite {column}")
        time = values["TimeFromTransfusion"]
        if not np.array_equal(time, expected_time):
            raise ValueError(f"{relative(path)}: requires ordered -720..720 minute grid")
        if any(row["VitalParam"].strip().upper() != code.upper() for row in rows):
            raise ValueError(f"{relative(path)}: unexpected vital parameter")
        if any(row["CompFactor"].strip() != "Transfusion" for row in rows):
            raise ValueError(f"{relative(path)}: unexpected comparison factor")
        source_unit = "bpm" if unit == "beats/min" else unit
        if any(f"({source_unit})" not in row["YLabel"] for row in rows):
            raise ValueError(f"{relative(path)}: native unit metadata mismatch")
        mean, lower, upper, se = (values[key] for key in
            ("PredVal_Full", "Lower_Full", "Upper_Full", "StdErrVal_Full"))
        if not ((lower <= mean) & (mean <= upper) & (se >= 0)).all():
            raise ValueError(f"{relative(path)}: confidence interval ordering failure")
        residual = max(float(np.abs(lower - (mean - NORMAL_975 * se)).max()),
                       float(np.abs(upper - (mean + NORMAL_975 * se)).max()))
        if residual > CI_ABSOLUTE_TOLERANCE:
            raise ValueError(f"{relative(path)}: bounds inconsistent with mean +/- normal(0.975) * SE")
        if unit == "%" and not ((mean > 1) & (mean <= 100)).all():
            raise ValueError(f"{relative(path)}: unexpected percentage-scale values")
        datasets[code] = {"rows": rows, "values": values, "path": relative(path),
                          "code": code, "title": title, "unit": unit, "letter": letter}
        manifest_inputs.append({
            "path": relative(path), "sha256": sha256_bytes(content),
            "normalized_lf_sha256": sha256_bytes(content.replace(b"\r\n", b"\n")),
            "vital_parameter": code, "unit": unit, "rows": len(rows),
            "time_min_minutes": float(time.min()), "time_max_minutes": float(time.max()),
            "time_step_minutes": 1,
            "prediction_range": [float(mean.min()), float(mean.max())],
            "confidence_band_range": [float(lower.min()), float(upper.max())],
            "max_ci_formula_residual": residual, "validation": "passed",
        })
    return datasets, manifest_inputs


def validate_descriptive_changes(datasets: dict) -> dict:
    """Check endpoint estimates only; never use the summary's change SEs or CIs."""
    path = INPUT_DIR / "model_based_summary.csv"
    content = path.read_bytes()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
    if not {"Abbreviation", "Full_Pre", "Full_Post", "Full_Diff"}.issubset(reader.fieldnames or []):
        raise ValueError(f"{relative(path)}: missing endpoint estimate columns")
    rows = list(reader)
    by_code = {row["Abbreviation"]: row for row in rows}
    if len(rows) != 7 or len(by_code) != 7 or set(by_code) != set(SUMMARY_CODES.values()):
        raise ValueError(f"{relative(path)}: requires one row for each of seven outcomes")
    comparisons = []
    for code, data in datasets.items():
        values = data["values"]
        endpoints = [float(values["PredVal_Full"][np.flatnonzero(
            values["TimeFromTransfusion"] == t)[0]]) for t in REFERENCE_TIMES_MIN]
        estimates = [*endpoints, endpoints[1] - endpoints[0]]
        summary = by_code[SUMMARY_CODES[code]]
        reference = [float(summary[column]) for column in ("Full_Pre", "Full_Post", "Full_Diff")]
        if not np.isfinite(reference).all():
            raise ValueError(f"{relative(path)}: nonfinite endpoint estimate for {code}")
        residual = float(np.abs(np.array(estimates) - reference).max())
        if residual > SUMMARY_ABSOLUTE_TOLERANCE:
            raise ValueError(f"{relative(path)}: endpoint estimates disagree with {code} trajectory")
        data["endpoints"] = endpoints
        data["descriptive_change"] = estimates[2]
        data["change_unit"] = "percentage points" if data["unit"] == "%" else data["unit"]
        comparisons.append({"vital_parameter": code, "pre": endpoints[0], "post": endpoints[1],
                            "difference": estimates[2], "unit": data["change_unit"],
                            "max_summary_residual": residual})
    return {"path": relative(path), "sha256": sha256_bytes(content),
            "normalized_lf_sha256": sha256_bytes(content.replace(b"\r\n", b"\n")),
            "purpose": "validation of endpoint point estimates only; summary uncertainty excluded",
            "reference_times_minutes": list(REFERENCE_TIMES_MIN),
            "absolute_tolerance": SUMMARY_ABSOLUTE_TOLERANCE,
            "comparisons": comparisons, "validation": "passed"}


def configure_style() -> None:
    plt.rcParams.update({
        "font.family": "DejaVu Sans", "font.size": 8,
        "text.color": TEXT, "axes.labelcolor": MUTED,
        "axes.edgecolor": "#A3AFB5", "axes.linewidth": 0.6,
        "axes.spines.top": False, "axes.spines.right": False,
        "xtick.color": MUTED, "ytick.color": MUTED,
        "xtick.labelsize": 7.5, "ytick.labelsize": 7.5,
        "xtick.major.size": 2.5, "ytick.major.size": 2.5,
        "xtick.major.width": 0.6, "ytick.major.width": 0.6,
        "xtick.major.pad": 3, "ytick.major.pad": 3,
        "pdf.fonttype": 42, "ps.fonttype": 42,
        "svg.fonttype": "none", "svg.hashsalt": "rbc-trajectories-v3",
        "path.simplify": False, "savefig.facecolor": "white",
    })


def new_figure(height_mm: float):
    return plt.figure(figsize=(FIGURE_WIDTH_MM / MM_PER_INCH, height_mm / MM_PER_INCH))


def add_axes_mm(fig, column: int, top_mm: float, height_mm: float):
    """Explicit physical layout keeps fonts and alignment stable at print size."""
    page_height = fig.get_figheight() * MM_PER_INCH
    left, width = (16 if column == 0 else 105), 70
    return fig.add_axes([left / FIGURE_WIDTH_MM,
                         1 - (top_mm + height_mm) / page_height,
                         width / FIGURE_WIDTH_MM, height_mm / page_height])


def figure_text_mm(fig, x_mm: float, top_mm: float, text: str, **kwargs):
    return fig.text(x_mm / FIGURE_WIDTH_MM,
                    1 - top_mm / (fig.get_figheight() * MM_PER_INCH),
                    text, va="top", **kwargs)


def draw_panel(ax, data: dict, annotations: str) -> dict:
    values = data["values"]
    hours = values["TimeFromTransfusion"] / 60.0
    limits, ticks, tick_format = AXIS_SPEC[data["code"]]
    if values["Lower_Full"].min() < limits[0] or values["Upper_Full"].max() > limits[1]:
        raise ValueError(f'{data["path"]}: confidence band exceeds the documented display limits')
    ax.set_axisbelow(True)
    ax.yaxis.grid(True, color=GRID, linewidth=0.55)
    ax.fill_between(hours, values["Lower_Full"], values["Upper_Full"],
                    color=COLOR, alpha=0.16, linewidth=0, zorder=2)
    ax.axvline(0, color="#78858C", linewidth=0.7, linestyle=(0, (3, 3)), zorder=3)
    ax.plot(hours, values["PredVal_Full"], color=COLOR, linewidth=1.5,
            solid_capstyle="round", zorder=4)
    if annotations != "none":
        ax.plot(np.array(REFERENCE_TIMES_MIN) / 60, data["endpoints"], linestyle="none",
                marker="o", markersize=4.2, markerfacecolor=COLOR,
                markeredgecolor="white", markeredgewidth=0.8, zorder=5)
    if annotations == "changes":
        change = data["descriptive_change"]
        sign = "\u2212" if change < 0 else "+"
        unit = "pp" if data["unit"] == "%" else data["unit"]
        ax.text(0.98, 0.96, f"\u0394 {sign}{abs(change):.2f} {unit}",
                transform=ax.transAxes, va="top", ha="right", fontsize=7.2, color=MUTED,
                bbox={"facecolor": "white", "edgecolor": "none", "pad": 1.5, "alpha": 0.9})
    ax.set_xlim(-12, 12)
    ax.set_xticks([-12, -6, 0, 6, 12])
    ax.set_xticklabels(["\u221212", "\u22126", "0", "+6", "+12"])
    ax.set_ylim(limits)
    ax.set_yticks(ticks)
    ax.yaxis.set_major_formatter(FormatStrFormatter(tick_format))
    ax.set_ylabel(data["unit"], labelpad=6, fontsize=8)
    ax.text(0, 1.10, data["letter"], transform=ax.transAxes,
            color=TEXT, fontsize=9, fontweight="bold", va="bottom")
    ax.text(0.075, 1.10, data["title"], transform=ax.transAxes,
            color=TEXT, fontsize=8.7, va="bottom")
    return {"vital_parameter": data["code"], "x_limits_hours": list(ax.get_xlim()),
            "y_limits_native_units": list(ax.get_ylim()), "y_ticks": list(ticks),
            "y_tick_format": tick_format,
            "panel_size_mm": [round(ax.get_position().width * FIGURE_WIDTH_MM, 5),
                              round(ax.get_position().height * ax.figure.get_figheight() * MM_PER_INCH, 5)]}


def legend_handles(annotations: str):
    handles = [
        Line2D([0], [0], color=COLOR, lw=1.5, label="Fully adjusted prediction"),
        Patch(facecolor=COLOR, alpha=0.16, edgecolor="none",
              label="95% pointwise confidence interval"),
        Line2D([0], [0], color="#78858C", lw=0.7, linestyle=(0, (3, 3)),
               label="Transfusion start (0 hours)"),
    ]
    if annotations != "none":
        handles.append(Line2D([0], [0], color=COLOR, linestyle="none", marker="o",
                             markersize=4.2, markeredgecolor="white", markeredgewidth=0.8,
                             label="Predictions at \u22121 and +1 hours"))
    return handles


def draw_key(ax, annotations: str) -> None:
    ax.axis("off")
    ax.text(0, 1.10, "Reading the panels", transform=ax.transAxes,
            va="bottom", fontsize=8.7, color=TEXT)
    ax.legend(handles=legend_handles(annotations), loc="upper left",
              bbox_to_anchor=(-0.03, 0.97), frameon=False, fontsize=7.2, handlelength=2.5,
              borderaxespad=0, labelspacing=0.7, handletextpad=0.7)
    note = "Pressure panels each span 6 mmHg.\nBands describe uncertainty in levels."
    if annotations == "changes":
        note += "\n\u0394: change from \u22121 to +1 h.\npp: percentage points."
    ax.text(0, 0.28, note, transform=ax.transAxes, va="top", fontsize=7.0,
            color=MUTED, linespacing=1.4)


def finish_page(fig, page_label: str | None = None):
    height_mm = fig.get_figheight() * MM_PER_INCH
    figure_text_mm(fig, 96, height_mm - 12, "Time from transfusion start (hours)",
                   ha="center", fontsize=8.5, color=TEXT)
    figure_text_mm(fig, 16, height_mm - 4, "DRAFT \u00b7 Scientific methods under review",
                   fontsize=6.2, color="#69767D")
    if page_label:
        figure_text_mm(fig, 175, height_mm - 4, page_label,
                       ha="right", fontsize=6.2, color="#69767D")


def save_page(fig, stem: Path, dpi: int, include_pdf: bool = True) -> list[Path]:
    paths = []
    for extension in (("pdf", "svg", "png") if include_pdf else ("svg", "png")):
        path = stem.with_suffix(f".{extension}")
        if extension == "pdf":
            metadata = {"Title": "Draft RBC transfusion trajectories", "Subject": STATUS,
                        "CreationDate": None, "ModDate": None}
        elif extension == "svg":
            metadata = {"Title": "Draft RBC transfusion trajectories",
                        "Description": STATUS, "Date": None}
        else:
            metadata = {"Title": "Draft RBC transfusion trajectories", "Description": STATUS}
        fig.savefig(path, dpi=dpi, metadata=metadata)
        paths.append(path)
    return paths


def export_plotted_data(datasets: dict, output_dir: Path) -> Path:
    path = output_dir / "plotted_data.csv"
    fields = ["VitalParam", "Unit", "SourceCSV", "TimeFromTransfusion_minutes",
              "TimeFromTransfusion_hours", "PredVal_Full", "Lower_Full", "Upper_Full"]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        for _, code, _, _, _ in PANELS:
            data = datasets[code]
            for row in data["rows"]:
                writer.writerow({
                    "VitalParam": code, "Unit": data["unit"], "SourceCSV": data["path"],
                    "TimeFromTransfusion_minutes": row["TimeFromTransfusion"],
                    "TimeFromTransfusion_hours": format(float(row["TimeFromTransfusion"]) / 60, ".17g"),
                    "PredVal_Full": row["PredVal_Full"],
                    "Lower_Full": row["Lower_Full"], "Upper_Full": row["Upper_Full"],
                })
    return path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", default="manuscript/figures/consolidated",
                        help="Output directory relative to repository root")
    parser.add_argument("--dpi", type=int, default=600, help="PNG resolution (default: 600)")
    parser.add_argument("--annotations", choices=("none", "markers", "changes"), default="markers",
                        help="Mark +/-1 hour (default), also label descriptive changes, or neither")
    args = parser.parse_args()
    if args.dpi < 72:
        parser.error("--dpi must be at least 72")
    if Path(args.output_dir).is_absolute():
        parser.error("--output-dir must be relative to the repository root")
    output_dir = (ROOT / args.output_dir).resolve()
    try:
        relative(output_dir)
    except ValueError:
        parser.error("--output-dir must remain inside the repository")
    datasets, inputs = read_and_validate()  # Validate every input before writing outputs.
    summary_validation = validate_descriptive_changes(datasets)
    for code in ("ARTm", "ARTs", "ARTd"):
        if AXIS_SPEC[code][0][1] - AXIS_SPEC[code][0][0] != 6:
            raise ValueError("Pressure panels must use a common 6 mmHg span")
    configure_style()
    output_dir.mkdir(parents=True, exist_ok=True)
    outputs = [export_plotted_data(datasets, output_dir)]
    caption_path = output_dir / "figure_1_caption.txt"
    marker_caption = (" Dots identify predictions one hour before and one hour after transfusion start."
                      if args.annotations != "none" else "")
    change_caption = (" Delta labels give the difference between these two predictions; pp denotes "
                      "percentage points. These are descriptive point estimates without a confidence "
                      "interval or significance test for change." if args.annotations == "changes" else "")
    caption_path.write_text(
        "Figure 1. Vital signs and respiratory parameters around red blood cell transfusion.\n\n"
        "Fully adjusted mixed-effects model predictions for (A) mean arterial pressure, "
        "(B) systolic arterial pressure, (C) diastolic arterial pressure, (D) heart rate, "
        "(E) inspired oxygen fraction, (F) peripheral oxygen saturation, and "
        "(G) minute ventilation. Lines show the predicted mean for a reference covariate "
        "profile (male, modal ward, other covariates set to their means), rather than an "
        "average of predictions across the cohort. Shaded areas show approximate 95% "
        "pointwise confidence intervals for the predicted level under the fitted model. "
        "The dashed vertical line marks transfusion start. All panels span 12 hours before "
        "to 12 hours after transfusion. The three pressure panels share a 6 mmHg vertical "
        "span; the remaining panels use parameter-specific scales. Inspired oxygen fraction "
        "and oxygen saturation are expressed as percentages." + marker_caption + change_caption +
        " Intervals are not simultaneous bands, individual patient prediction intervals, "
        "or confidence intervals for a before-after difference.\n\n"
        "Author review note (exclude from the submitted caption): Full-cohort trajectory "
        "provenance has been documented against archived outputs. Scientific methods, "
        "including adjustment and covariance assumptions, remain under review. This "
        "renderer preserves the existing exported estimates; it does not validate model "
        "specification or refit the models.\n", encoding="utf-8")
    outputs.append(caption_path)
    layouts = {}

    fig = new_figure(216)
    row_tops = (13, 60, 107, 154)
    limits = []
    for index, (_, code, _, _, _) in enumerate(PANELS):
        ax = add_axes_mm(fig, index % 2, row_tops[index // 2], 33)
        limits.append(draw_panel(ax, datasets[code], args.annotations))
    draw_key(add_axes_mm(fig, 1, row_tops[-1], 33), args.annotations)
    finish_page(fig)
    outputs.extend(save_page(fig, output_dir / "figure_1_trajectories_one_page", args.dpi))
    layouts["one_page"] = {"size_inches": list(fig.get_size_inches()),
                           "size_mm": [180, 216], "panels": limits}
    plt.close(fig)

    two_page_path = output_dir / "figure_1_trajectories_two_pages.pdf"
    metadata = {"Title": "Draft RBC transfusion trajectories: two-page layout", "Subject": STATUS,
                "CreationDate": None, "ModDate": None}
    with PdfPages(two_page_path, metadata=metadata) as pdf:
        groups = [(PANELS[:4], "Cardiovascular parameters", "cardiovascular"),
                  (PANELS[4:], "Respiratory parameters", "respiratory")]
        for page, (panels, label, suffix) in enumerate(groups, start=1):
            fig = new_figure(158)
            figure_text_mm(fig, 16, 4, label, fontsize=9,
                           fontweight="medium", color=TEXT)
            if page == 1:
                # A compact shared legend leaves all four axes equal in size.
                fig.legend(handles=legend_handles(args.annotations), loc="upper left",
                           bbox_to_anchor=(16 / 180, 1 - 11 / 158), ncol=2,
                           frameon=False, fontsize=7.2, handlelength=2.2,
                           handletextpad=0.6, columnspacing=1.4, borderaxespad=0)
            else:
                figure_text_mm(fig, 16, 14, "Fully adjusted trajectories", fontsize=8, color=MUTED)
            limits = []
            for index, (_, code, _, _, _) in enumerate(panels):
                ax = add_axes_mm(fig, index % 2, (31, 92)[index // 2], 43)
                limits.append(draw_panel(ax, datasets[code], args.annotations))
            if len(panels) == 3:
                draw_key(add_axes_mm(fig, 1, 92, 43), args.annotations)
            finish_page(fig, f"{page} / 2")
            pdf.savefig(fig)
            outputs.extend(save_page(fig, output_dir / f"figure_1_{suffix}", args.dpi))
            layouts[suffix] = {"size_inches": list(fig.get_size_inches()),
                               "size_mm": [180, 158], "panels": limits}
            plt.close(fig)
    outputs.append(two_page_path)

    manifest = {
        "status": STATUS,
        "generator": {"path": relative(Path(__file__)),
                      "sha256": sha256_bytes(Path(__file__).read_bytes())},
        "command": f"python scripts/make_publication_figure.py --output-dir {relative(output_dir)} --dpi {args.dpi} --annotations {args.annotations}",
        "software": {"python": platform.python_version(), "numpy": np.__version__,
                     "matplotlib": matplotlib.__version__},
        "inputs": inputs,
        "endpoint_summary_validation": summary_validation,
        "plot_definition": {
            "mean": "PredVal_Full", "lower": "Lower_Full", "upper": "Upper_Full",
            "time_transform": "TimeFromTransfusion / 60; minutes to hours",
            "outcome_transform": "none; retain exported native units, including FiO2 percent",
            "line_interpolation": "straight segments between all 1,441 exported minute values; no smoothing",
            "confidence_interval": "existing normal-approximation 95% pointwise bounds on the predicted level",
            "normal_975_quantile": NORMAL_975,
            "ci_validation_absolute_tolerance": CI_ABSOLUTE_TOLERANCE,
            "reference_line": "0 hours, transfusion time",
            "vertical_axes": "6 mmHg span for all pressure panels; native units; identical across layouts",
            "annotations": args.annotations,
            "reference_times_minutes": list(REFERENCE_TIMES_MIN) if args.annotations != "none" else [],
            "annotation_definition": "optional descriptive endpoint difference; no CI or test for change",
            "print_width_mm": FIGURE_WIDTH_MM,
            "font": "DejaVu Sans; PDF font embedded; SVG text editable",
            "palette": {"prediction": COLOR, "interval_alpha": 0.16, "text": TEXT},
            "excluded_columns": ["Delta_Full", "Delta_Lower", "Delta_Upper", "PredVal_Base"],
        },
        "limitations": [
            "Full-cohort trajectory provenance documented; scientific methods remain under review.",
            "Validation checks exported numbers, not the correctness of the fitted SAS models.",
            "Pointwise bands are not simultaneous bands or intervals for change from baseline.",
            "No patient data, model refit, inferential contrast calculation, or additional smoothing is used.",
        ],
        "layouts": layouts,
        "outputs": [{"path": relative(path), "sha256": sha256_bytes(path.read_bytes())}
                    for path in outputs],
    }
    manifest_path = output_dir / "figure_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Validated {len(inputs)} trajectory inputs and endpoint summary; rendered {len(outputs)} artifacts.")
    print(f"Manifest: {relative(manifest_path)}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError) as error:
        print(f"Figure generation failed: {error}", file=sys.stderr)
        raise SystemExit(1) from error
