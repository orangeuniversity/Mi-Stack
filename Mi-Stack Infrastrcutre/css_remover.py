import os
from bs4 import BeautifulSoup

def save_file(filename, content):
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Saved: {filename}")

def extract_css(soup, output_dir):
    style_tag = soup.find("style")
    if style_tag:
        css_content = style_tag.string or ""
        css_file = os.path.join(output_dir, "style.css")
        save_file(css_file, css_content.strip())
        style_tag.decompose()
        # Insert example external CSS link tag in <head>
        link_tag = soup.new_tag("link", rel="stylesheet")
        link_tag["href"] = "{{ url_for('static', filename='index_style.css') }}"  # example placeholder
        if soup.head:
            soup.head.append(link_tag)
        else:
            soup.insert(0, link_tag)
    else:
        print("No <style> tag found.")

def main():
    input_file = input("Enter the HTML file name to extract (e.g., index.html): ").strip()
    if not os.path.isfile(input_file):
        print(f"File '{input_file}' not found. Exiting.")
        return

    base_name = os.path.splitext(os.path.basename(input_file))[0]
    output_dir = os.path.join(os.path.dirname(os.path.abspath(input_file)), base_name)

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created folder: {output_dir}")

    with open(input_file, "r", encoding="utf-8") as file:
        soup = BeautifulSoup(file, "html.parser")

    extract_css(soup, output_dir)

    # Save cleaned HTML as into.html with all original scripts intact
    output_html_path = os.path.join(output_dir, "into.html")
    save_file(output_html_path, str(soup))

    print("Extraction complete! Original file remains unchanged.")

if __name__ == "__main__":
    main()

