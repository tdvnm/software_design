import shutil
from pathlib import Path

# dist contains only generated copies; the browser runs the source unchanged.
destination = Path("dist")
shutil.rmtree(destination, ignore_errors=True)
shutil.copytree("src", destination)
