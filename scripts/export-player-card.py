"""Export the original portrait raster asset from Player Card.psd.

The source PSD is read-only. Its cached Photoshop composite is saved under the
ignored private-design directory for comparison with the website.
"""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image
from psd_tools import PSDImage


def sha256(path):
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def save_report(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)
    return {
        "path": str(path),
        "mode": image.mode,
        "size": list(image.size),
        "alpha_extrema": list(image.getchannel("A").getextrema()),
        "bytes": path.stat().st_size,
        "sha256": sha256(path),
    }


def visible_portrait(psd, reference, layer):
    """Keep Photoshop's rendered InnerGlow and the original clipping alpha.

    psd-tools does not render InnerGlow. Recover the original rendered portrait
    colors from the cached Photoshop preview, removing the known backdrop with
    the portrait and clipping layer's original alpha. Opaque artwork comes
    directly from Photoshop, without color regeneration or resampling.
    """
    background, frame = psd[0], psd[3]
    if frame.name != "Fondo" or not layer.clipping:
        raise ValueError("Expected the original clipped portrait and Fondo frame.")
    raw = np.asarray(layer.topil(apply_icc=True).convert("RGBA"))
    left, top, right, bottom = layer.bbox
    frame_left, frame_top, _, _ = frame.bbox
    frame_alpha = np.asarray(frame.topil().convert("RGBA"))[
        top - frame_top:bottom - frame_top,
        left - frame_left:right - frame_left,
        3,
    ]
    alpha = raw[:, :, 3].astype(float) * frame_alpha.astype(float) / (255 * 255)
    backdrop = np.asarray(psd.composite(
        viewport=layer.bbox,
        force=False,
        color=1.0,
        alpha=0.0,
        layer_filter=lambda candidate: candidate is background or candidate is frame,
        ignore_preview=True,
        apply_icc=True,
    ).convert("RGBA"))[:, :, :3].astype(float)
    rendered = np.asarray(reference)[top:bottom, left:right, :3].astype(float)
    visible = alpha > 0
    rgb = np.zeros_like(rendered)
    rgb[visible] = (
        rendered[visible] - backdrop[visible] * (1 - alpha[visible, None])
    ) / alpha[visible, None]
    result = np.zeros_like(raw)
    result[:, :, :3] = np.clip(np.rint(rgb), 0, 255).astype(np.uint8)
    result[:, :, 3] = np.rint(alpha * 255).astype(np.uint8)
    result[result[:, :, 3] == 0] = 0

    quantized_alpha = result[:, :, 3].astype(float) / 255
    reconstructed = np.rint(
        result[:, :, :3] * quantized_alpha[:, :, None]
        + backdrop * (1 - quantized_alpha[:, :, None])
    )
    difference = np.abs(reconstructed[visible] - rendered[visible])
    opaque = alpha == 1
    if not np.array_equal(result[:, :, :3][opaque], rendered[opaque]):
        raise ValueError("Opaque portrait pixels diverged from Photoshop.")
    report = {
        "method": "Photoshop cached render with original portrait and clipping alpha",
        "opaque_pixels_match_cached_Photoshop_preview": True,
        "recomposited_visible_pixels_max_rgb_difference": int(difference.max()),
        "recomposited_visible_pixels_mean_rgb_difference": float(difference.mean()),
        "preserved_effect": "InnerGlow (black, 72%, 10px)",
    }
    return Image.fromarray(result), report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("psd", type=Path)
    parser.add_argument("--inspect", action="store_true")
    args = parser.parse_args()
    source = args.psd.resolve(strict=True)
    source_hash = sha256(source)
    project = Path(__file__).resolve().parents[1]
    private_dir = project / "private-design"
    psd = PSDImage.open(source)
    if psd.size != (1597, 641) or not psd.has_preview():
        raise ValueError("Expected original 1597x641 Player Card with Photoshop preview.")
    reference = psd.topil(apply_icc=True).convert("RGBA")
    print(json.dumps({"reference": save_report(reference, private_dir / "player-card-reference.png")}), flush=True)

    if args.inspect:
        for index, layer in enumerate(psd):
            if layer.visible and layer.has_pixels() and layer.kind != "type":
                image = layer.topil(apply_icc=True).convert("RGBA")
                print(json.dumps({"layer": layer.name, "index": index, "bbox": layer.bbox, **save_report(image, private_dir / f"player-card-layer-{index}.png")}), flush=True)
        return

    # Nationality flags now use the licensed Flaticon pack, not the PSD layers.
    specs = [("Capa 5", "players/pol-guillem.png")]
    reports = []
    for name, relative_path in specs:
        matching = [layer for layer in psd if layer.name == name and layer.visible]
        if len(matching) != 1:
            raise ValueError(f"Expected one visible {name!r} layer.")
        layer = matching[0]
        if layer.has_mask() or layer.opacity != 255:
            raise ValueError(f"Unexpected mask or opacity on {name!r}.")
        method = {"method": "original cached raster"}
        if name == "Capa 5":
            image, method = visible_portrait(psd, reference, layer)
        else:
            image = layer.topil(apply_icc=True).convert("RGBA")
        crop = image.getchannel("A").getbbox()
        if crop is None:
            raise ValueError(f"Empty alpha channel on {name!r}.")
        image = image.crop(crop)
        reports.append({"layer": name, "source_bbox": layer.bbox, "alpha_crop": crop, **method, **save_report(image, project / "public" / relative_path)})
    if sha256(source) != source_hash:
        raise RuntimeError("Source PSD changed during export.")
    print(json.dumps({"source": str(source), "source_sha256": source_hash, "source_unchanged": True, "exports": reports}), flush=True)


if __name__ == "__main__":
    main()
