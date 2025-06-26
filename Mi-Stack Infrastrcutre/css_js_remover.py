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
        # Example placeholder href — you can manually fix filenames/paths later
        link_tag["href"] = "{{ url_for('static', filename='index_style.css') }}"
        if soup.head:
            soup.head.append(link_tag)
        else:
            soup.insert(0, link_tag)
    else:
        print("No <style> tag found.")

def extract_scripts(soup, output_dir):
    head_scripts = soup.head.find_all("script", recursive=False) if soup.head else []
    body_scripts = soup.body.find_all("script", recursive=False) if soup.body else []

    # Save and remove head scripts
    for i, script in enumerate(head_scripts, 1):
        content = script.string or ""
        if content.strip():
            filename = os.path.join(output_dir, f"script-head{i}.js")
            save_file(filename, content.strip())
        script.decompose()

    # Save and remove body scripts
    for i, script in enumerate(body_scripts, 1):
        content = script.string or ""
        if content.strip():
            filename = os.path.join(output_dir, f"script-body{i}.js")
            save_file(filename, content.strip())
        script.decompose()

    # Insert example external script tags at the end of <body>
    if soup.body:
        # Example placeholders, adjust filenames as needed manually
        example_scripts = [
            "{{ url_for('static', filename='main.js') }}",
            # Add more if you want, e.g., "{{ url_for('static', filename='extra.js') }}"
        ]
        for src in example_scripts:
            script_tag = soup.new_tag("script", src=src)
            soup.body.append(script_tag)
    else:
        print("No <body> tag found to insert script tags.")

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
    extract_scripts(soup, output_dir)

    # Save cleaned HTML as into.html
    output_html_path = os.path.join(output_dir, "into.html")
    # Prettify can break some spacing, so use str(soup) directly
    save_file(output_html_path, str(soup))

    print("Extraction complete! Original file remains unchanged.")

if __name__ == "__main__":
    main()
