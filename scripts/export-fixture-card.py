"""Export the two static layers and the cached reference from Partidos NEW.psd.

Requires Pillow and psd-tools with its composite extras. The input PSD is read
only; no fonts, team badges, scores, or other dynamic layers enter public PNGs.
"""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from psd_tools import PSDImage


def sha256(path):
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def image_report(path, image):
    colors = image.getcolors(maxcolors=65536)
    return {
        "path": str(path),
        "mode": image.mode,
        "size": list(image.size),
        "alpha_extrema": list(image.getchannel("A").getextrema()),
        "most_common_rgba": sorted(colors, reverse=True)[:6] if colors else None,
        "sha256": sha256(path),
    }


def background_preview_comparison(psd, reference, background):
    """Compare only opaque pixels outside every non-background layer's bbox.

    Photoshop's Perceptual gradient mode is not reproduced pixel-exactly by
    psd-tools. Surface any quantization/interpolation discrepancy explicitly.
    """
    original = np.asarray(reference)
    exported = np.asarray(background)
    unobstructed = (original[:, :, 3] == 255) & (exported[:, :, 3] == 255)
    width, height = psd.size
    for layer in psd:
        if layer.name == "Fondo":
            continue
        left, top, right, bottom = layer.bbox
        unobstructed[max(0, top):min(height, bottom), max(0, left):min(width, right)] = False
    difference = np.abs(original[:, :, :3].astype(int) - exported[:, :, :3].astype(int))[unobstructed]
    return {
        "opaque_unobstructed_pixels_compared": int(unobstructed.sum()),
        "max_rgb_difference_0_to_255": int(difference.max()),
        "mean_rgb_difference_0_to_255": float(difference.mean()),
        "pixel_exact": bool(np.all(difference == 0)),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("psd", type=Path, help="Original Partidos NEW.psd (never modified)")
    args = parser.parse_args()
    source_path = args.psd.resolve(strict=True)
    project = Path(__file__).resolve().parents[1]
    asset_dir = project / "public" / "psd"
    private_dir = project / "private-design"
    before_hash = sha256(source_path)
    psd = PSDImage.open(source_path)
    if psd.size != (1597, 334):
        raise ValueError(f"Unexpected canvas {psd.size}; expected 1597x334.")
    if not psd.has_preview():
        raise ValueError("The PSD must contain its original merged Photoshop preview.")

    # Publish the design reference first so layout work can proceed in parallel.
    reference = psd.topil(apply_icc=True).convert("RGBA")
    if reference.size != psd.size:
        raise ValueError("The merged preview does not match the PSD canvas.")
    private_dir.mkdir(parents=True, exist_ok=True)
    reference_path = private_dir / "fixture-card-reference.png"
    reference.save(reference_path, format="PNG")
    print(json.dumps({"reference": image_report(reference_path, reference)}, ensure_ascii=False), flush=True)

    specifications = [
        ("Rect. Jornada", (725, 17, 871, 70), (146, 53), "fixture-card-label.png"),
        ("Fondo", (0, 0, 1597, 334), (1597, 334), "fixture-card-bg.png"),
    ]
    exports = []
    background_comparison = None
    for layer_name, viewport, expected_size, filename in specifications:
        candidates = [layer for layer in psd if layer.name == layer_name]
        if len(candidates) != 1:
            raise ValueError(f"Expected exactly one root layer named {layer_name!r}.")
        layer = candidates[0]
        if layer.kind != "shape" or not layer.has_pixels():
            raise ValueError(f"{layer_name!r} must be a cached static shape layer.")
        if layer_name == "Rect. Jornada" and layer.bbox != viewport:
            raise ValueError(f"The label bbox changed: {layer.bbox}.")
        # The label's cached RGBA already includes its vector edge alpha. With
        # no layer effects or raster mask, preserve those original bytes rather
        # than round-tripping the green through the floating-point compositor.
        use_cached_raster = (
            layer.bbox == viewport
            and layer.opacity == 255
            and not layer.has_mask()
            and not any(effect.enabled for effect in layer.effects)
        )
        if use_cached_raster:
            image = layer.topil(apply_icc=True).convert("RGBA")
        else:
            # The filter bypasses the merged preview and rejects all dynamic
            # root layers. force=False uses cached raster edges while applying
            # the PSD's own effects, including Fondo's GradientOverlay.
            image = psd.composite(
                viewport=viewport,
                force=False,
                color=1.0,
                alpha=0.0,
                layer_filter=lambda candidate, selected=layer: candidate is selected,
                ignore_preview=True,
                apply_icc=True,
            ).convert("RGBA")
        if image.size != expected_size:
            raise ValueError(f"Unexpected export size for {layer_name}: {image.size}.")
        alpha_min, alpha_max = image.getchannel("A").getextrema()
        if alpha_min != 0 or alpha_max != 255:
            raise ValueError(f"{layer_name!r} lost its expected transparent/opaque pixels.")
        asset_dir.mkdir(parents=True, exist_ok=True)
        output_path = asset_dir / filename
        image.save(output_path, format="PNG")
        exports.append({"layer": layer_name, "bbox": list(layer.bbox), "method": "cached-raster" if use_cached_raster else "isolated-layer-composite", **image_report(output_path, image)})
        if layer_name == "Fondo":
            background_comparison = background_preview_comparison(psd, reference, image)

    after_hash = sha256(source_path)
    if before_hash != after_hash:
        raise RuntimeError("The input PSD changed during export.")
    print(json.dumps({"source": str(source_path), "source_sha256_before": before_hash, "source_sha256_after": after_hash, "source_unchanged": True, "static_exports": exports, "background_preview_comparison": background_comparison}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
