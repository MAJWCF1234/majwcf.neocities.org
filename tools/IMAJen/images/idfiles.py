import os

# Get the absolute path of the directory where the script is located
script_directory = os.path.dirname(os.path.abspath(__file__))

# Get the name of the script file itself to exclude it from the list
script_filename = os.path.basename(__file__)

print(f"--- Files in Directory: {script_directory} ---")

found_files = []
try:
    # List all entries (files and directories) in the script's directory
    all_entries = os.listdir(script_directory)

    # Iterate through each entry
    for entry_name in all_entries:
        # Construct the full path to the entry
        full_path = os.path.join(script_directory, entry_name)

        # Check if the entry is a file and NOT the script file itself
        if os.path.isfile(full_path) and entry_name != script_filename:
            found_files.append(entry_name)

except FileNotFoundError:
    print(f"\nError: Could not find the directory: {script_directory}")
except PermissionError:
    print(f"\nError: Permission denied to read the directory: {script_directory}")
except Exception as e:
    print(f"\nAn unexpected error occurred: {e}")

# Print the list of found files
if found_files:
    print("\nFound files:")
    # Sort the list alphabetically for better readability
    found_files.sort()
    for i, filename in enumerate(found_files):
        print(f"{i + 1}. {filename}")
else:
    print("\nNo other files found in this directory.")

print("\n--- Scan Complete ---")