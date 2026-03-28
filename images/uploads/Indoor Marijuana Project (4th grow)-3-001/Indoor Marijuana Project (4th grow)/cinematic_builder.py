import os
import subprocess

# Configuration
image_dir = "/home/jackson/Projects/Web/person_website/images/uploads/Indoor Marijuana Project (4th grow)-3-001/Indoor Marijuana Project (4th grow)"
output_file = os.path.join(image_dir, "grow_room_cinematic_v2.mp4")
photo_duration = 3  # Seconds each photo is visible
fade_duration = 1   # Seconds for the cross-fade
target_res = "1080x1440" # Balanced resolution for mobile/web

# Get sorted list of images
images = sorted([f for f in os.listdir(image_dir) if f.lower().endswith('.jpg')])

if not images:
    print("No images found!")
    exit()

# Build the complex filtergraph
# We scale and pad each image to the same size first
filter_complex = ""
input_args = []

for i, img in enumerate(images):
    input_args.extend(["-loop", "1", "-t", str(photo_duration + fade_duration), "-i", os.path.join(image_dir, img)])
    
    # Scale each image to fit the target resolution and add a slow zoom
    # We use 'zoompan' for the Ken Burns effect
    filter_complex += (
        f"[{i}:v]scale=8000:-1,zoompan=z='min(zoom+0.0015,1.5)':d={25*(photo_duration+fade_duration)}:s={target_res}:fps=25,"
        f"fade=t=in:st=0:d={fade_duration},fade=t=out:st={photo_duration}:d={fade_duration}[v{i}];"
    )

# Overlap the images using the 'overlay' filter or just sequence them with transitions
# For 30 images, xfade is complex, so we'll use a simpler 'overlay' method for stability
concat_filter = ""
for i in range(len(images)):
    concat_filter += f"[v{i}]"
concat_filter += f"concat=n={len(images)}:v=1:a=0[outv]"

# Construct final command
# Note: Using a shorter list if 30 is too heavy for one pass, but let's try 30.
# We'll limit to 15 if it crashes, but 30 should be fine on this machine.
cmd = [
    "ffmpeg", "-y"
] + input_args + [
    "-filter_complex", filter_complex + concat_filter,
    "-map", "[outv]",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-preset", "faster",
    "-crf", "23",
    output_file
]

print("Starting cinematic render (this may take a minute)...")
subprocess.run(cmd)
print(f"Done! Created: {output_file}")
