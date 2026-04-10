
import base64, os
path = r"C:\Users\Codebreaker\CODE\Sonar workflow\gen_manual.py"
b64path = r"C:\Users\Codebreaker\CODE\Sonar workflow\remaining.b64"
with open(b64path, "r") as f:
    data = base64.b64decode(f.read()).decode("utf-8")
with open(path, "a", encoding="utf-8") as f:
    f.write(data)
print("Appended %d chars" % len(data))
print("Total size:", os.path.getsize(path))
