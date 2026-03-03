import os

def check_braces(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            open_count = content.count('{')
            close_count = content.count('}')
            if open_count != close_count:
                print(f"{file_path}: {{={open_count}, }}={close_count}")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

def main():
    start_dir = r"d:\Workflow Engine Platform\frontend\src"
    for root, dirs, files in os.walk(start_dir):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js'):
                check_braces(os.path.join(root, file))

if __name__ == "__main__":
    main()
