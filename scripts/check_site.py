import csv
import io
import re
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
HEADER_ALIAS_GROUPS = {
    "id": ("id", "معرف", "المعرف", "رقم المعرف", "رقم العرض"),
    "departmentid": ("departmentid", "معرف القسم", "معرّف القسم", "رقم القسم", "كود القسم"),
    "title": ("title", "العنوان", "عنوان", "الاسم", "اسم القسم", "اسم البرنامج", "اسم العرض", "اسم الخدمة"),
    "image": ("image", "الصورة", "صورة", "رابط الصورة"),
    "from": ("from", "من", "مدينة المغادرة", "جهة المغادرة"),
    "to": ("to", "الى", "إلى", "الوجهة", "مدينة الوصول"),
    "category": ("category", "الفئة", "التصنيف", "نوع الخدمة", "القسم"),
    "makkahotel": ("makkahotel", "فندق مكة", "فندق مكه", "فندق مكة المكرمة"),
}
HEADER_ALIASES = {
    "".join(
        character
        for character in unicodedata.normalize("NFKC", alias).casefold()
        if not unicodedata.category(character).startswith("M")
        and character != "\u0640"
        and character.isalnum()
    ): canonical
    for canonical, aliases in HEADER_ALIAS_GROUPS.items()
    for alias in aliases
}


class SiteMetadataParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical_url = None
        self.resources = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "link" and attributes.get("rel") == "canonical":
            self.canonical_url = attributes.get("href")
        if tag == "link" and attributes.get("rel") == "stylesheet":
            self.resources.append(attributes.get("href", ""))
        if tag == "script" and attributes.get("src"):
            self.resources.append(attributes["src"])


def normalize_header(value):
    normalized = "".join(
        character
        for character in unicodedata.normalize("NFKC", value.lstrip("\ufeff")).casefold()
        if not unicodedata.category(character).startswith("M")
        and character != "\u0640"
        and character.isalnum()
    )
    return HEADER_ALIASES.get(normalized, normalized)


def contains_sequence(row, sequence):
    return any(
        row[index:index + len(sequence)] == sequence
        for index in range(len(row) - len(sequence) + 1)
    )


def check_static_files():
    index_html = (ROOT / "index.html").read_text(encoding="utf-8")
    parser = SiteMetadataParser()
    parser.feed(index_html)
    if not parser.canonical_url:
        raise RuntimeError("The canonical URL is missing from index.html.")

    for resource in parser.resources:
        parsed_resource = urlsplit(resource)
        if parsed_resource.scheme or parsed_resource.netloc:
            continue
        resource_path = parsed_resource.path.lstrip("/")
        if resource_path and not (ROOT / resource_path).is_file():
            raise RuntimeError(f"Referenced site asset does not exist: {resource_path}")
        if resource_path and not parsed_resource.query:
            raise RuntimeError(f"Asset is missing a cache-busting version: {resource_path}")

    sitemap = ET.parse(ROOT / "sitemap.xml").getroot()
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    sitemap_urls = [element.text for element in sitemap.findall("s:url/s:loc", namespace)]
    if parser.canonical_url not in sitemap_urls:
        raise RuntimeError("The sitemap does not include the canonical URL.")

    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    if f"Sitemap: {parser.canonical_url.rstrip('/')}/sitemap.xml" not in robots:
        raise RuntimeError("robots.txt does not point to the site sitemap.")

    app_js = (ROOT / "app.js").read_text(encoding="utf-8")
    csv_url = re.search(r'const SHEET_CSV_URL = "([^"]+)"', app_js)
    if not csv_url:
        raise RuntimeError("The public CSV URL is missing from app.js.")
    return csv_url.group(1)


def check_published_csv(csv_url):
    request = urllib.request.Request(
        csv_url,
        headers={"User-Agent": "AlwafaaTravelSiteCheck/1.0"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError(f"The published CSV returned HTTP {response.status}.")
        csv_text = response.read().decode("utf-8-sig")

    rows = list(csv.reader(io.StringIO(csv_text)))
    headers = [
        [normalize_header(cell) for cell in row]
        for row in rows
    ]
    has_departments = any(
        contains_sequence(row, ["departmentid", "title", "image"])
        for row in headers
    )
    has_services = any(
        contains_sequence(row, ["id", "from", "to"])
        or contains_sequence(row, ["id", "departmentid", "title"])
        or any(
            row[index:index + 2] == ["id", "title"]
            and any(header in row[index + 2:] for header in ("category", "makkahotel"))
            for index in range(len(row) - 1)
        )
        for row in headers
    )
    if not has_departments or not has_services:
        raise RuntimeError("The published CSV is missing expected department or service tables.")


if __name__ == "__main__":
    check_published_csv(check_static_files())
    print("Static site metadata and published offers CSV checks passed.")
