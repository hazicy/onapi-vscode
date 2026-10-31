"""Regenerate with: pip install -r scripts/icon-font/requirements.txt
Then: python scripts/icon-font/generate.py
SVG strokes are expanded to filled outlines before conversion.
"""
from pathlib import Path
import json
from picosvg.svg import SVG
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path

root = Path(__file__).resolve().parents[2]
names = ['http', 'graphql', 'websocket', 'socketio', 'grpc', 'folder', 'doc', 'tests', 'reports', 'history', 'http-get', 'http-delete', 'http-head', 'http-options', 'http-patch', 'http-post', 'http-put', 'http-trace', 'ai', 'mcp']
font = FontBuilder(1024, isTTF=True)
font.font.recalcTimestamp = False
font.font['head'].created = font.font['head'].modified = 2082844800
font.setupGlyphOrder(['.notdef'] + names)
font.setupCharacterMap({0xE001 + i: name for i, name in enumerate(names)})
glyphs = {'.notdef': TTGlyphPen(None).glyph()}
for name in names:
    svg = SVG.parse(str(root / f'apps/webviews/public/images/{name}.svg')).topicosvg()
    pen = TTGlyphPen(None)
    # Preserve the 16px canvas; invert SVG's downward Y axis for font coordinates.
    outline = TransformPen(Cu2QuPen(pen, 0.5, reverse_direction=True), (64, 0, 0, -64, 0, 896))
    for shape in svg.shapes():
        parse_path(shape.as_path().d, outline)
    glyphs[name] = pen.glyph()
font.setupGlyf(glyphs)
font.setupHorizontalMetrics({name: (1024, 0) for name in glyphs})
# Keep glyph bearings aligned with the source SVG rather than shifting each outline.
for name, glyph in glyphs.items():
    font.font['hmtx'].metrics[name] = (1024, getattr(glyph, 'xMin', 0))
font.setupHorizontalHeader(ascent=896, descent=-128)
font.setupNameTable({'familyName': 'OnAPI Icons', 'styleName': 'Regular', 'uniqueFontIdentifier': 'OnAPI Icons Regular 1', 'fullName': 'OnAPI Icons', 'psName': 'OnAPIIcons-Regular', 'version': 'Version 1.0'})
font.setupOS2(sTypoAscender=896, sTypoDescender=-128, usWinAscent=1024, usWinDescent=128)
font.setupPost()
font.setupMaxp()
font.font.flavor = 'woff'
output = root / 'apps/webviews/public/images/onapi-icons.woff'
font.save(str(output))
manifest_path = root / 'apps/extension/package.json'
manifest = json.loads(manifest_path.read_text())
manifest['contributes']['icons'] = {
    f'onapi-{name.replace("_", "-")}': {
        'description': f'OnAPI {name.replace("_", " ")} icon',
        'default': {'fontPath': './dist/images/onapi-icons.woff', 'fontCharacter': f'\\{0xE001 + i:04X}'}
    } for i, name in enumerate(names)
}
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(f'Generated {len(names)} glyphs: {output}')
