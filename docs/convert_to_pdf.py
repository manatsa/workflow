"""
Convert all DOCX manuals to PDF format
"""
import os
from docx2pdf import convert

# Paths
docs_base = "C:/Users/Codebreaker/CODE/Sonarworks/docs/manuals"

# Convert console manuals
console_input = os.path.join(docs_base, "console")
console_output = os.path.join(docs_base, "pdf/console")

print("Converting Console Manuals to PDF...")
for filename in os.listdir(console_input):
    if filename.endswith('.docx'):
        input_path = os.path.join(console_input, filename)
        output_path = os.path.join(console_output, filename.replace('.docx', '.pdf'))
        print(f"  Converting: {filename}")
        try:
            convert(input_path, output_path)
            print(f"    -> Created: {filename.replace('.docx', '.pdf')}")
        except Exception as e:
            print(f"    -> Error: {e}")

# Convert function/API manuals
functions_input = os.path.join(docs_base, "functions")
functions_output = os.path.join(docs_base, "pdf/functions")

print("\nConverting API Function Manuals to PDF...")
for filename in os.listdir(functions_input):
    if filename.endswith('.docx'):
        input_path = os.path.join(functions_input, filename)
        output_path = os.path.join(functions_output, filename.replace('.docx', '.pdf'))
        print(f"  Converting: {filename}")
        try:
            convert(input_path, output_path)
            print(f"    -> Created: {filename.replace('.docx', '.pdf')}")
        except Exception as e:
            print(f"    -> Error: {e}")

print("\nPDF conversion complete!")
