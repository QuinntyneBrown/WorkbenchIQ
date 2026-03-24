"""Render all .puml files to .png using the PlantUML online service."""
import os
import glob
import plantuml

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    puml_files = glob.glob(os.path.join(script_dir, "*.puml"))

    server = plantuml.PlantUML(url="http://www.plantuml.com/plantuml/png/")

    for puml_file in sorted(puml_files):
        basename = os.path.basename(puml_file)
        png_file = puml_file.replace(".puml", ".png")
        print(f"Rendering {basename}...", end=" ")
        try:
            server.processes_file(puml_file, outfile=png_file)
            if os.path.exists(png_file) and os.path.getsize(png_file) > 0:
                print(f"OK ({os.path.getsize(png_file)} bytes)")
            else:
                print("FAILED (empty output)")
        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    main()
