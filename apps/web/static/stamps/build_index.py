import json
import glob
def main():
    svg_files = glob.glob('*.svg')
    print(svg_files)
    with open('index.json', 'w') as f:
        json.dump(svg_files, f)

if __name__ == '__main__':
    main()